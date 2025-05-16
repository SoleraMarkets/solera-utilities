import { BigNumber, PopulatedTransaction, providers } from 'ethers';
import {
  BaseDebtToken,
  BaseDebtTokenInterface,
  DelegationApprovedType,
} from '../baseDebtToken-contract';
import BaseService from '../commons/BaseService';
import { ProtocolAction, tEthereumAddress } from '../commons/types';
import {
  API_ETH_MOCK_ADDRESS,
  gasLimitRecommendations,
} from '../commons/utils';
import {
  ApproveType,
  ERC20Service,
  IERC20ServiceInterface,
  TokenOwner,
} from '../erc20-contract';
import { UiPoolDataProviderInterface } from '../v3-UiPoolDataProvider-contract';
import {
  LendingPoolMarketConfigV3,
  Pool,
  PoolInterface,
} from '../v3-pool-contract';
import { WrappedTokenGatewayV3Interface } from '../v3-wethgateway-contract/typechain/WrappedTokenGatewayV3';
import { WrappedTokenGatewayV3__factory } from '../v3-wethgateway-contract/typechain/factories/WrappedTokenGatewayV3__factory';
import {
  LoopETHParamsType,
  LoopSingleAssetParamsType,
  LoopSwapParamsType,
  SwapConfig,
} from './loopingTypes';
import { NBASIS, NETF, NINSTO, NALPHA, PUSD, WPLUME } from './tokens';
import { Looping, LoopingInterface } from './typechain/Looping';
import { Looping__factory } from './typechain/factories';
import { LoopData, LoopSimulationParams } from './types';

export type LoopSwapTxBuilder = {
  generateTxData: (args: LoopSwapParamsType) => PopulatedTransaction;
  getApprovedAmount: ({
    user,
    token,
    unWrapped,
  }: TokenOwner & { unWrapped: boolean }) => Promise<ApproveType>;
  getCreditApprovedAmount: ({
    user,
    token,
  }: TokenOwner) => Promise<DelegationApprovedType>;
};

export type LoopSingleAssetTxBuilder = {
  generateTxData: (args: LoopSingleAssetParamsType) => PopulatedTransaction;
  getApprovedAmount: ({ user, token }: TokenOwner) => Promise<ApproveType>;
  getCreditApprovedAmount: ({
    user,
    token,
  }: TokenOwner) => Promise<DelegationApprovedType>;
};

export type LoopETHTxBuilder = {
  generateTxData: (args: LoopETHParamsType) => PopulatedTransaction;
  getApprovedAmount: ({
    user,
    isSupplyUnWrapped,
    isBorrowUnWrapped,
  }: {
    user: tEthereumAddress;
    isSupplyUnWrapped: boolean;
    isBorrowUnWrapped: boolean;
  }) => Promise<ApproveType>;
  getCreditApprovedAmount: ({
    user,
  }: {
    user: tEthereumAddress;
  }) => Promise<DelegationApprovedType>;
};

export * from './types';

const WPLUME_V_TOKEN = '0x578899D60B4ea83537d7d5DD399C2f17Bd15F489';

export class LoopingService extends BaseService<Looping> {
  readonly loopingContractAddress: string;

  readonly erc20Service: IERC20ServiceInterface;

  readonly debtTokenService: BaseDebtTokenInterface;

  readonly poolService: PoolInterface;

  readonly uiPoolDataProviderService: UiPoolDataProviderInterface;

  readonly loopingInstance: LoopingInterface;
  readonly wethGatewayInstance: WrappedTokenGatewayV3Interface;

  readonly wrappedTokenGatewayAddress: tEthereumAddress;
  readonly poolAddress: tEthereumAddress;
  readonly loopAddress: tEthereumAddress;
  readonly stakingAddress: tEthereumAddress;

  loopSwapTxBuilder: LoopSwapTxBuilder;
  loopSingleAssetTxBuilder: LoopSingleAssetTxBuilder;
  loopETHTxBuilder: LoopETHTxBuilder;

  private readonly _contract: Looping;

  constructor(
    provider: providers.Provider,
    contractAddress: string | undefined,
    lendingPoolConfig?: LendingPoolMarketConfigV3,
  ) {
    super(provider, Looping__factory);

    const { POOL, WRAPPED_TOKEN_GATEWAY, STAKING } = lendingPoolConfig ?? {};

    this.erc20Service = new ERC20Service(provider);

    this.debtTokenService = new BaseDebtToken(provider, this.erc20Service);

    this.poolService = new Pool(provider, lendingPoolConfig);

    this.loopingContractAddress = contractAddress ?? '';

    this.loopingInstance = Looping__factory.createInterface();
    this.wethGatewayInstance = WrappedTokenGatewayV3__factory.createInterface();

    this.poolAddress = POOL ?? '';
    this.wrappedTokenGatewayAddress = WRAPPED_TOKEN_GATEWAY ?? '';
    this.loopAddress = contractAddress ?? '';
    this.stakingAddress = STAKING ?? '';

    this._contract = Looping__factory.connect(this.loopAddress, provider);

    this.loopSwapTxBuilder = {
      generateTxData: ({
        user,
        supplyReserve,
        borrowReserve,
        numLoops,
        amount,
        targetHealthFactor,
        minAmountSupplied,
      }: LoopSwapParamsType): PopulatedTransaction => {
        const { swapType } = this.determineSwapConfig(
          supplyReserve,
          borrowReserve,
        );

        if (swapType === 'nalpha') {
          return this.createNALPHATransaction({
            user,
            numLoops,
            amount,
            minAmountSupplied,
            targetHealthFactor,
          });
        }

        if (swapType === 'ninsto') {
          return this.createNINSTOTransaction({
            user,
            numLoops,
            amount,
            targetHealthFactor,
            minAmountSupplied,
          });
        }

        if (swapType === 'nbasis') {
          return this.createNBASISTransaction({
            user,
            numLoops,
            amount,
            minAmountSupplied,
            targetHealthFactor,
          });
        }

        if (swapType === 'netf') {
          return this.createNETFTransaction({
            user,
            numLoops,
            amount,
            minAmountSupplied,
            targetHealthFactor,
          });
        }

        if (swapType === 'splume') {
          return this.createSPLUMETransaction({
            user,
            unwrap:
              borrowReserve.toLowerCase() ===
              API_ETH_MOCK_ADDRESS.toLowerCase(),
            numLoops,
            amount,
            targetHealthFactor,
          });
        }

        throw new Error('no loop path found');
      },
      getApprovedAmount: async (
        props: TokenOwner & { unWrapped: boolean },
      ): Promise<ApproveType> => {
        const spender = props.unWrapped
          ? this.wrappedTokenGatewayAddress
          : this.loopAddress;
        const amount = await this.erc20Service.approvedAmount({
          ...props,
          spender,
        });
        return {
          ...props,
          spender,
          amount: amount.toString(),
        };
      },
      getCreditApprovedAmount: async (
        props: TokenOwner,
      ): Promise<DelegationApprovedType> => {
        const spender = this.loopAddress;
        const amount = await this.debtTokenService.approvedDelegationAmount({
          ...props,
          debtTokenAddress: props.token,
          delegatee: spender,
        });
        return {
          debtTokenAddress: props.token,
          allowanceGiver: props.user,
          allowanceReceiver: spender,
          amount: amount.toString(),
        };
      },
    };

    this.loopSingleAssetTxBuilder = {
      generateTxData: ({
        user,
        reserve,
        numLoops,
        amount,
        targetHealthFactor,
      }: LoopSingleAssetParamsType): PopulatedTransaction => {
        const txData = this.loopingInstance.encodeFunctionData(
          'loopSingleAsset',
          [
            {
              token: reserve,
              targetHealthFactor,
              onBehalfOf: user,
              numLoops,
              initialAmount: amount,
            },
          ],
        );
        const actionTx = {
          data: txData,
          to: this.loopingContractAddress,
          from: user,
          gasLimit: BigNumber.from(
            gasLimitRecommendations[ProtocolAction.default].limit,
          ),
        };

        return actionTx;
      },
      getApprovedAmount: async (props: TokenOwner): Promise<ApproveType> => {
        const spender = this.loopAddress;
        const amount = await this.erc20Service.approvedAmount({
          ...props,
          spender,
        });
        return {
          ...props,
          spender,
          amount: amount.toString(),
        };
      },
      getCreditApprovedAmount: async (
        props: TokenOwner,
      ): Promise<DelegationApprovedType> => {
        const spender = this.loopAddress;
        const amount = await this.debtTokenService.approvedDelegationAmount({
          ...props,
          debtTokenAddress: props.token,
          delegatee: spender,
        });
        return {
          debtTokenAddress: props.token,
          allowanceGiver: props.user,
          allowanceReceiver: spender,
          amount: amount.toString(),
        };
      },
    };

    // Handles cases where native PLUME is involved
    this.loopETHTxBuilder = {
      generateTxData: ({
        user,
        reserve,
        numLoops,
        amount,
        targetHealthFactor,
        unwrap,
      }: LoopETHParamsType): PopulatedTransaction => {
        const isSupplyingEth =
          reserve.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

        let actionTx: PopulatedTransaction;
        if (isSupplyingEth && unwrap) {
          const txData = this.wethGatewayInstance.encodeFunctionData(
            'loopPLUMESingleAsset',
            [
              {
                targetHealthFactor,
                onBehalfOf: user,
                numLoops,
              },
            ],
          );
          actionTx = {
            data: txData,
            to: this.wrappedTokenGatewayAddress,
            from: user,
            value: BigNumber.from(amount),
            gasLimit: BigNumber.from(
              gasLimitRecommendations[ProtocolAction.default].limit,
            ),
          };
        } else if (isSupplyingEth && !unwrap) {
          const txData = this.wethGatewayInstance.encodeFunctionData(
            'loopEntryPLUMESingleAsset',
            [
              {
                targetHealthFactor,
                onBehalfOf: user,
                numLoops,
              },
            ],
          );
          actionTx = {
            data: txData,
            to: this.wrappedTokenGatewayAddress,
            from: user,
            value: BigNumber.from(amount),
            gasLimit: BigNumber.from(
              gasLimitRecommendations[ProtocolAction.default].limit,
            ),
          };
        } else if (!isSupplyingEth && unwrap) {
          const txData = this.wethGatewayInstance.encodeFunctionData(
            'loopExitPLUMESingleAsset',
            [
              {
                targetHealthFactor,
                onBehalfOf: user,
                numLoops,
                initialAmount: amount,
              },
            ],
          );
          actionTx = {
            data: txData,
            to: this.wrappedTokenGatewayAddress,
            from: user,
            gasLimit: BigNumber.from(
              gasLimitRecommendations[ProtocolAction.default].limit,
            ),
          };
        } else {
          throw new Error('invalid params');
        }

        return actionTx;
      },
      getApprovedAmount: async (props: {
        user: tEthereumAddress;
        isSupplyUnWrapped: boolean;
        isBorrowUnWrapped: boolean;
      }): Promise<ApproveType> => {
        let spender;
        if (!props.isSupplyUnWrapped && props.isBorrowUnWrapped) {
          spender = this.wrappedTokenGatewayAddress;
        } else {
          spender = this.loopAddress;
        }

        const amount = await this.erc20Service.approvedAmount({
          ...props,
          token: WPLUME,
          spender,
        });
        return {
          ...props,
          token: WPLUME,
          spender,
          amount: amount.toString(),
        };
      },
      getCreditApprovedAmount: async (props: {
        user: tEthereumAddress;
      }): Promise<DelegationApprovedType> => {
        const spender = this.loopAddress;
        const amount = await this.debtTokenService.approvedDelegationAmount({
          ...props,
          debtTokenAddress: WPLUME_V_TOKEN,
          delegatee: spender,
        });
        return {
          debtTokenAddress: WPLUME_V_TOKEN,
          allowanceGiver: props.user,
          allowanceReceiver: spender,
          amount: amount.toString(),
        };
      },
    };
  }

  public async simulateLoop(params: LoopSimulationParams): Promise<LoopData> {
    return this._contract.simulateLoop(params);
  }

  private determineSwapConfig(_supply: string, _borrow: string): SwapConfig {
    const supply =
      _supply.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase()
        ? WPLUME
        : _supply;
    const borrow =
      _borrow.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase()
        ? WPLUME
        : _borrow;

    if (
      supply.toLowerCase() === NALPHA.toLowerCase() &&
      borrow.toLowerCase() === PUSD.toLowerCase()
    ) {
      return {
        swapType: 'nalpha',
      };
    }

    if (
      supply.toLowerCase() === NINSTO.toLowerCase() &&
      borrow.toLowerCase() === PUSD.toLowerCase()
    ) {
      return {
        swapType: 'ninsto',
      };
    }

    if (
      supply.toLowerCase() === NBASIS.toLowerCase() &&
      borrow.toLowerCase() === PUSD.toLowerCase()
    ) {
      return {
        swapType: 'nbasis',
      };
    }

    if (
      supply.toLowerCase() === NETF.toLowerCase() &&
      borrow.toLowerCase() === PUSD.toLowerCase()
    ) {
      return {
        swapType: 'netf',
      };
    }

    if (
      supply.toLowerCase() === this.stakingAddress.toLowerCase() &&
      borrow.toLowerCase() === WPLUME.toLowerCase()
    ) {
      return {
        swapType: 'splume',
      };
    }

    return {
      swapType: null,
    };
  }

  private createNALPHATransaction(config: {
    user: string;
    numLoops: number;
    amount: string;
    minAmountSupplied: string;
    targetHealthFactor: string;
  }): PopulatedTransaction {
    const { user, numLoops, amount, targetHealthFactor, minAmountSupplied } =
      config;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let value: BigNumber | undefined;

    const txData = this.loopingInstance.encodeFunctionData('loopNALPHA', [
      {
        targetHealthFactor,
        onBehalfOf: user,
        numLoops,
        minAmountSupplied,
        initialAmount: amount,
      },
    ]);
    const to = this.loopingContractAddress;

    // Build and return the transaction
    const actionTx: PopulatedTransaction = {
      data: txData,
      to,
      from: user,
      gasLimit,
    };

    if (value) {
      actionTx.value = value;
    }

    return actionTx;
  }

  private createNINSTOTransaction(config: {
    user: string;
    numLoops: number;
    amount: string;
    targetHealthFactor: string;
    minAmountSupplied: string;
  }): PopulatedTransaction {
    const { user, numLoops, amount, targetHealthFactor, minAmountSupplied } =
      config;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let value: BigNumber | undefined;

    const txData = this.loopingInstance.encodeFunctionData('loopNINSTO', [
      {
        targetHealthFactor,
        onBehalfOf: user,
        numLoops,
        minAmountSupplied,
        initialAmount: amount,
      },
    ]);
    const to = this.loopingContractAddress;

    // Build and return the transaction
    const actionTx: PopulatedTransaction = {
      data: txData,
      to,
      from: user,
      gasLimit,
    };

    if (value) {
      actionTx.value = value;
    }

    return actionTx;
  }

  private createNBASISTransaction(config: {
    user: string;
    numLoops: number;
    amount: string;
    targetHealthFactor: string;
    minAmountSupplied: string;
  }): PopulatedTransaction {
    const { user, numLoops, amount, targetHealthFactor, minAmountSupplied } =
      config;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let value: BigNumber | undefined;

    const txData = this.loopingInstance.encodeFunctionData('loopNBASIS', [
      {
        targetHealthFactor,
        onBehalfOf: user,
        numLoops,
        initialAmount: amount,
        minAmountSupplied,
      },
    ]);
    const to = this.loopingContractAddress;

    // Build and return the transaction
    const actionTx: PopulatedTransaction = {
      data: txData,
      to,
      from: user,
      gasLimit,
    };

    if (value) {
      actionTx.value = value;
    }

    return actionTx;
  }

  private createNETFTransaction(config: {
    user: string;
    numLoops: number;
    amount: string;
    targetHealthFactor: string;
    minAmountSupplied: string;
  }): PopulatedTransaction {
    const { user, numLoops, amount, targetHealthFactor, minAmountSupplied } =
      config;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let value: BigNumber | undefined;

    const txData = this.loopingInstance.encodeFunctionData('loopNETF', [
      {
        targetHealthFactor,
        onBehalfOf: user,
        numLoops,
        initialAmount: amount,
        minAmountSupplied,
      },
    ]);
    const to = this.loopingContractAddress;

    // Build and return the transaction
    const actionTx: PopulatedTransaction = {
      data: txData,
      to,
      from: user,
      gasLimit,
    };

    if (value) {
      actionTx.value = value;
    }

    return actionTx;
  }

  // private createSingleSwapTransaction(config: {
  //   user: string;
  //   supplyReserve: string;
  //   borrowReserve: string;
  //   pool: string;
  //   isSupplyTokenA: boolean;
  //   numLoops: number;
  //   amount: string;
  //   targetHealthFactor: string;
  //   minAmountSupplied: string;
  // }): PopulatedTransaction {
  //   const {
  //     user,
  //     supplyReserve,
  //     borrowReserve,
  //     pool,
  //     isSupplyTokenA,
  //     numLoops,
  //     amount,
  //     targetHealthFactor,
  //     minAmountSupplied,
  //   } = config;

  //   const isSupplyingEth =
  //     supplyReserve.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();
  //   const isBorrowingEth =
  //     borrowReserve.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

  //   const gasLimit = BigNumber.from(
  //     gasLimitRecommendations[ProtocolAction.default].limit,
  //   );

  //   let txData: string;
  //   let to: string;
  //   let value: BigNumber | undefined;

  //   // Determine the transaction method and parameters based on scenario
  //   if (!isSupplyingEth && !isBorrowingEth) {
  //     // Case 1: Regular single-swap
  //     txData = this.loopingInstance.encodeFunctionData('loopSingleSwap', [
  //       {
  //         supplyToken: supplyReserve,
  //         targetHealthFactor,
  //         onBehalfOf: user,
  //         isSupplyTokenA,
  //         borrowToken: borrowReserve,
  //         numLoops,
  //         maverickPool: pool,
  //         minAmountSupplied,
  //         initialAmount: amount,
  //       },
  //     ]);
  //     to = this.loopingContractAddress;
  //   } else if (isSupplyingEth && !isBorrowingEth) {
  //     // Case 2: ETH->Token single-swap
  //     txData = this.wethGatewayInstance.encodeFunctionData(
  //       'loopEntryPLUMESingleSwap',
  //       [
  //         {
  //           targetHealthFactor,
  //           onBehalfOf: user,
  //           isSupplyTokenA,
  //           borrowToken: borrowReserve,
  //           numLoops,
  //           maverickPool: pool,
  //           minAmountSupplied,
  //         },
  //       ],
  //     );
  //     to = this.wrappedTokenGatewayAddress;
  //     value = BigNumber.from(amount);
  //   } else {
  //     // Case 3: Token->ETH single-swap
  //     txData = this.wethGatewayInstance.encodeFunctionData(
  //       'loopExitPLUMESingleSwap',
  //       [
  //         {
  //           supplyToken: supplyReserve,
  //           targetHealthFactor,
  //           onBehalfOf: user,
  //           isSupplyTokenA,
  //           numLoops,
  //           maverickPool: pool,
  //           minAmountSupplied,
  //           initialAmount: amount,
  //         },
  //       ],
  //     );
  //     to = this.wrappedTokenGatewayAddress;
  //   }

  //   // Build and return the transaction
  //   const actionTx: PopulatedTransaction = {
  //     data: txData,
  //     to,
  //     from: user,
  //     gasLimit,
  //   };

  //   if (value) {
  //     actionTx.value = value;
  //   }

  //   return actionTx;
  // }

  // private createMultiSwapTransaction(config: {
  //   user: string;
  //   supplyReserve: string;
  //   borrowReserve: string;
  //   path: string;
  //   numLoops: number;
  //   amount: string;
  //   targetHealthFactor: string;
  //   minAmountSupplied: string;
  // }): PopulatedTransaction {
  //   const {
  //     user,
  //     supplyReserve,
  //     borrowReserve,
  //     path,
  //     numLoops,
  //     amount,
  //     targetHealthFactor,
  //     minAmountSupplied,
  //   } = config;

  //   const isSupplyingEth = supplyReserve === API_ETH_MOCK_ADDRESS.toLowerCase();
  //   const isBorrowingEth = borrowReserve === API_ETH_MOCK_ADDRESS.toLowerCase();

  //   const gasLimit = BigNumber.from(
  //     gasLimitRecommendations[ProtocolAction.default].limit,
  //   );

  //   let txData: string;
  //   let to: string;
  //   let value: BigNumber | undefined;

  //   if (!isSupplyingEth && !isBorrowingEth) {
  //     // Case 1: Regular multi-swap
  //     txData = this.loopingInstance.encodeFunctionData('loopMultiSwap', [
  //       {
  //         supplyToken: supplyReserve,
  //         targetHealthFactor,
  //         onBehalfOf: user,
  //         borrowToken: borrowReserve,
  //         numLoops,
  //         minAmountSupplied,
  //         initialAmount: amount,
  //         path,
  //       },
  //     ]);
  //     to = this.loopingContractAddress;
  //   } else if (isSupplyingEth && !isBorrowingEth) {
  //     // Case 2: ETH->Token multi-swap
  //     txData = this.wethGatewayInstance.encodeFunctionData(
  //       'loopEntryPLUMEMultiSwap',
  //       [
  //         {
  //           targetHealthFactor,
  //           onBehalfOf: user,
  //           borrowToken: borrowReserve,
  //           numLoops,
  //           minAmountSupplied,
  //           path,
  //         },
  //       ],
  //     );
  //     to = this.wrappedTokenGatewayAddress;
  //     value = BigNumber.from(amount);
  //   } else {
  //     // Case 3: Token->ETH multi-swap
  //     txData = this.wethGatewayInstance.encodeFunctionData(
  //       'loopExitPLUMEMultiSwap',
  //       [
  //         {
  //           supplyToken: supplyReserve,
  //           targetHealthFactor,
  //           onBehalfOf: user,
  //           numLoops,
  //           minAmountSupplied,
  //           path,
  //           initialAmount: amount,
  //         },
  //       ],
  //     );
  //     to = this.wrappedTokenGatewayAddress;
  //   }

  //   // Build and return the transaction
  //   const actionTx: PopulatedTransaction = {
  //     data: txData,
  //     to,
  //     from: user,
  //     gasLimit,
  //   };

  //   if (value) {
  //     actionTx.value = value;
  //   }

  //   return actionTx;
  // }

  private createSPLUMETransaction(config: {
    user: string;
    unwrap: boolean;
    numLoops: number;
    amount: string;
    targetHealthFactor: string;
  }): PopulatedTransaction {
    const { user, unwrap, numLoops, amount, targetHealthFactor } = config;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let txData: string;
    let to: string;
    let value: BigNumber | undefined;

    if (unwrap) {
      // Case 1: sPLUME->PLUME
      txData = this.wethGatewayInstance.encodeFunctionData(
        'loopExitPLUMESPLUME',
        [
          {
            targetHealthFactor,
            onBehalfOf: user,
            numLoops,
            initialAmount: amount,
          },
        ],
      );
      to = this.wrappedTokenGatewayAddress;
    } else {
      // Case 2: sPLUME->WPLUME
      txData = this.loopingInstance.encodeFunctionData('loopSPLUME', [
        {
          targetHealthFactor,
          onBehalfOf: user,
          numLoops,
          initialAmount: amount,
        },
      ]);
      to = this.loopingContractAddress;
    }

    // Build and return the transaction
    const actionTx: PopulatedTransaction = {
      data: txData,
      to,
      from: user,
      gasLimit,
    };

    if (value) {
      actionTx.value = value;
    }

    return actionTx;
  }
}
