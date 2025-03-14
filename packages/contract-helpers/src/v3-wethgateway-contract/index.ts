import { BigNumber, constants, PopulatedTransaction, providers } from 'ethers';
import {
  BaseDebtToken,
  BaseDebtTokenInterface,
} from '../baseDebtToken-contract';
import BaseService from '../commons/BaseService';
import {
  eEthereumTxType,
  EthereumTransactionTypeExtended,
  ProtocolAction,
  tEthereumAddress,
  transactionType,
} from '../commons/types';
import { gasLimitRecommendations, valueToWei } from '../commons/utils';
import { WETHValidator } from '../commons/validators/methodValidators';
import {
  is0OrPositiveAmount,
  isEthAddress,
  isPositiveAmount,
  isPositiveOrMinusOneAmount,
} from '../commons/validators/paramValidators';
import { IERC20ServiceInterface } from '../erc20-contract';
import {
  WrappedTokenGatewayV3,
  WrappedTokenGatewayV3Interface,
} from './typechain/WrappedTokenGatewayV3';
import { WrappedTokenGatewayV3__factory } from './typechain/factories/WrappedTokenGatewayV3__factory';

export type WETHDepositParamsType = {
  lendingPool: tEthereumAddress;
  user: tEthereumAddress;
  amount: string; // normal
  onBehalfOf?: tEthereumAddress;
  referralCode?: string;
};

export type WETHWithdrawParamsType = {
  lendingPool: tEthereumAddress;
  user: tEthereumAddress;
  amount: string;
  aTokenAddress: tEthereumAddress;
  onBehalfOf?: tEthereumAddress;
};

export type WETHRepayParamsType = {
  lendingPool: tEthereumAddress;
  user: tEthereumAddress;
  amount: string;
  onBehalfOf?: tEthereumAddress;
};

export type WETHBorrowParamsType = {
  lendingPool: tEthereumAddress;
  user: tEthereumAddress;
  amount: string;
  debtTokenAddress?: tEthereumAddress;
  referralCode?: string;
};

export type LoopEntryETHSingleSwapParamsType = {
  user: tEthereumAddress;
  targetHealthFactor: string;
  onBehalfOf?: tEthereumAddress;
  isSupplyTokenA: boolean;
  borrowToken: tEthereumAddress;
  numLoops: string;
  maverickPool: tEthereumAddress;
  minAmountSupplied: string;
  initialAmount: string;
};

export type LoopEntryETHMultiSwapParamsType = {
  user: tEthereumAddress;
  targetHealthFactor: string;
  onBehalfOf?: tEthereumAddress;
  borrowToken: tEthereumAddress;
  numLoops: string;
  minAmountSupplied: string;
  initialAmount: string;
  path: string;
};

export type LoopEntryETHSingleAssetParamsType = {
  user: tEthereumAddress;
  targetHealthFactor: string;
  onBehalfOf: tEthereumAddress;
  numLoops: string;
  initialAmount: string;
};

export type LoopExitETHSingleSwapParamsType = {
  user: tEthereumAddress;
  targetHealthFactor: string;
  onBehalfOf?: tEthereumAddress;
  isSupplyTokenA: boolean;
  supplyToken: tEthereumAddress;
  numLoops: string;
  maverickPool: tEthereumAddress;
  minAmountSupplied: string;
  initialAmount: string;
};

export type LoopExitETHMultiSwapParamsType = {
  user: tEthereumAddress;
  targetHealthFactor: string;
  onBehalfOf?: tEthereumAddress;
  supplyToken: tEthereumAddress;
  numLoops: string;
  minAmountSupplied: string;
  initialAmount: string;
  path: string;
};

export type LoopExitETHSingleAssetParamsType = {
  user: tEthereumAddress;
  targetHealthFactor: string;
  onBehalfOf: tEthereumAddress;
  numLoops: string;
  initialAmount: string;
};

export type LoopETHSingleAssetParamsType = {
  user: tEthereumAddress;
  targetHealthFactor: string;
  onBehalfOf: tEthereumAddress;
  numLoops: string;
  initialAmount: string;
};

export interface WETHGatewayInterface {
  generateDepositEthTxData: (
    args: WETHDepositParamsType,
  ) => PopulatedTransaction;
  generateBorrowEthTxData: (args: WETHBorrowParamsType) => PopulatedTransaction;
  generateRepayEthTxData: (args: WETHRepayParamsType) => PopulatedTransaction;
  depositETH: (
    args: WETHDepositParamsType,
  ) => EthereumTransactionTypeExtended[];
  withdrawETH: (
    args: WETHWithdrawParamsType,
  ) => Promise<EthereumTransactionTypeExtended[]>;
  repayETH: (args: WETHRepayParamsType) => EthereumTransactionTypeExtended[];
  borrowETH: (
    args: WETHBorrowParamsType,
  ) => Promise<EthereumTransactionTypeExtended[]>;
}

export class WETHGatewayService
  extends BaseService<WrappedTokenGatewayV3>
  implements WETHGatewayInterface
{
  readonly wethGatewayAddress: string;

  readonly baseDebtTokenService: BaseDebtTokenInterface;

  readonly erc20Service: IERC20ServiceInterface;

  readonly wethGatewayInstance: WrappedTokenGatewayV3Interface;

  generateDepositEthTxData: (
    args: WETHDepositParamsType,
  ) => PopulatedTransaction;

  generateBorrowEthTxData: (args: WETHBorrowParamsType) => PopulatedTransaction;

  generateRepayEthTxData: (args: WETHRepayParamsType) => PopulatedTransaction;

  constructor(
    provider: providers.Provider,
    erc20Service: IERC20ServiceInterface,
    wethGatewayAddress?: string,
  ) {
    super(provider, WrappedTokenGatewayV3__factory);
    this.erc20Service = erc20Service;

    this.baseDebtTokenService = new BaseDebtToken(
      this.provider,
      this.erc20Service,
    );

    this.wethGatewayAddress = wethGatewayAddress ?? '';

    this.depositETH = this.depositETH.bind(this);
    this.withdrawETH = this.withdrawETH.bind(this);
    this.repayETH = this.repayETH.bind(this);
    this.borrowETH = this.borrowETH.bind(this);
    this.wethGatewayInstance = WrappedTokenGatewayV3__factory.createInterface();
    this.generateDepositEthTxData = (
      args: WETHDepositParamsType,
    ): PopulatedTransaction => {
      const txData = this.wethGatewayInstance.encodeFunctionData(
        'depositPLUME',
        [
          args.lendingPool,
          args.onBehalfOf ?? args.user,
          args.referralCode ?? '0',
        ],
      );
      const actionTx: PopulatedTransaction = {
        data: txData,
        to: this.wethGatewayAddress,
        from: args.user,
        value: BigNumber.from(args.amount),
        gasLimit: BigNumber.from(
          gasLimitRecommendations[ProtocolAction.deposit].limit,
        ),
      };
      return actionTx;
    };

    this.generateBorrowEthTxData = (
      args: WETHBorrowParamsType,
    ): PopulatedTransaction => {
      const txData = this.wethGatewayInstance.encodeFunctionData(
        'borrowPLUME',
        [args.lendingPool, args.amount, args.referralCode ?? '0'],
      );
      const actionTx: PopulatedTransaction = {
        data: txData,
        to: this.wethGatewayAddress,
        from: args.user,
        gasLimit: BigNumber.from(
          gasLimitRecommendations[ProtocolAction.borrowETH].limit,
        ),
      };
      return actionTx;
    };

    this.generateRepayEthTxData = ({
      lendingPool,
      amount,
      user,
      onBehalfOf,
    }) => {
      const txData = this.wethGatewayInstance.encodeFunctionData('repayPLUME', [
        lendingPool,
        amount,
        onBehalfOf ?? user,
      ]);
      const actionTx: PopulatedTransaction = {
        data: txData,
        to: this.wethGatewayAddress,
        from: user,
        value: BigNumber.from(amount),
        gasLimit: BigNumber.from(
          gasLimitRecommendations[ProtocolAction.repayETH].limit,
        ),
      };
      return actionTx;
    };
  }

  @WETHValidator
  public depositETH(
    @isEthAddress('lendingPool')
    @isEthAddress('user')
    @isEthAddress('onBehalfOf')
    @isPositiveAmount('amount')
    @is0OrPositiveAmount('referralCode')
    {
      lendingPool,
      user,
      amount,
      onBehalfOf,
      referralCode,
    }: WETHDepositParamsType,
  ): EthereumTransactionTypeExtended[] {
    const convertedAmount: string = valueToWei(amount, 18);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.depositPLUME(
          lendingPool,
          onBehalfOf ?? user,
          referralCode ?? '0',
        ),
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  @WETHValidator
  public async borrowETH(
    @isEthAddress('lendingPool')
    @isEthAddress('user')
    @isPositiveAmount('amount')
    @isEthAddress('debtTokenAddress')
    @is0OrPositiveAmount('referralCode')
    {
      lendingPool,
      user,
      amount,
      debtTokenAddress,
      referralCode,
    }: WETHBorrowParamsType,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];
    const convertedAmount: string = valueToWei(amount, 18);
    if (!debtTokenAddress) {
      throw new Error(
        `To borrow ETH you need to pass the variable WETH debt Token Address`,
      );
    }

    const delegationApproved: boolean =
      await this.baseDebtTokenService.isDelegationApproved({
        debtTokenAddress,
        allowanceGiver: user,
        allowanceReceiver: this.wethGatewayAddress,
        amount,
      });

    if (!delegationApproved) {
      const approveDelegationTx: EthereumTransactionTypeExtended =
        this.baseDebtTokenService.approveDelegation({
          user,
          delegatee: this.wethGatewayAddress,
          debtTokenAddress,
          amount: constants.MaxUint256.toString(),
        });

      txs.push(approveDelegationTx);
    }

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.borrowPLUME(
          lendingPool,
          convertedAmount,
          referralCode ?? '0',
        ),
      from: user,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.borrowETH,
      ),
    });

    return txs;
  }

  @WETHValidator
  public async withdrawETH(
    @isEthAddress('lendingPool')
    @isEthAddress('user')
    @isEthAddress('onBehalfOf')
    @isPositiveOrMinusOneAmount('amount')
    @isEthAddress('aTokenAddress')
    {
      lendingPool,
      user,
      amount,
      onBehalfOf,
      aTokenAddress,
    }: WETHWithdrawParamsType,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];
    const { isApproved, approve }: IERC20ServiceInterface = this.erc20Service;
    const convertedAmount: string =
      amount === '-1'
        ? constants.MaxUint256.toString()
        : valueToWei(amount, 18);

    const approved: boolean = await isApproved({
      token: aTokenAddress,
      user,
      spender: this.wethGatewayAddress,
      amount,
    });

    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = approve({
        user,
        token: aTokenAddress,
        spender: this.wethGatewayAddress,
        amount: constants.MaxUint256.toString(),
      });
      txs.push(approveTx);
    }

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.withdrawPLUME(
          lendingPool,
          convertedAmount,
          onBehalfOf ?? user,
        ),
      from: user,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.withdrawETH,
      ),
    });

    return txs;
  }

  @WETHValidator
  public repayETH(
    @isEthAddress('lendingPool')
    @isEthAddress('user')
    @isEthAddress('onBehalfOf')
    @isPositiveAmount('amount')
    { lendingPool, user, amount, onBehalfOf }: WETHRepayParamsType,
  ): EthereumTransactionTypeExtended[] {
    const convertedAmount: string = valueToWei(amount, 18);
    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.repayPLUME(
          lendingPool,
          convertedAmount,
          onBehalfOf ?? user,
        ),
      gasSurplus: 30,
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  public loopEntryETHSingleSwap({
    user,
    targetHealthFactor,
    onBehalfOf,
    isSupplyTokenA,
    borrowToken,
    numLoops,
    maverickPool,
    minAmountSupplied,
    initialAmount,
  }: LoopEntryETHSingleSwapParamsType): EthereumTransactionTypeExtended[] {
    const convertedAmount: string = valueToWei(initialAmount, 18);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.loopEntryPLUMESingleSwap({
          targetHealthFactor,
          onBehalfOf: onBehalfOf ?? user,
          isSupplyTokenA,
          borrowToken,
          numLoops,
          maverickPool,
          minAmountSupplied,
        }),
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  public loopEntryETHMultiSwap({
    user,
    targetHealthFactor,
    onBehalfOf,
    borrowToken,
    numLoops,
    minAmountSupplied,
    initialAmount,
    path,
  }: LoopEntryETHMultiSwapParamsType): EthereumTransactionTypeExtended[] {
    const convertedAmount: string = valueToWei(initialAmount, 18);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.loopEntryPLUMEMultiSwap({
          targetHealthFactor,
          onBehalfOf: onBehalfOf ?? user,
          borrowToken,
          numLoops,
          minAmountSupplied,
          path,
        }),
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  public loopEntryETHSingleAsset({
    user,
    targetHealthFactor,
    onBehalfOf,
    numLoops,
    initialAmount,
  }: LoopEntryETHSingleAssetParamsType): EthereumTransactionTypeExtended[] {
    const convertedAmount: string = valueToWei(initialAmount, 18);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.loopEntryPLUMESingleAsset({
          targetHealthFactor,
          onBehalfOf: onBehalfOf ?? user,
          numLoops,
        }),
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  public async loopExitETHSingleSwap({
    user,
    targetHealthFactor,
    onBehalfOf,
    isSupplyTokenA,
    supplyToken,
    numLoops,
    maverickPool,
    minAmountSupplied,
    initialAmount,
  }: LoopExitETHSingleSwapParamsType): Promise<
    EthereumTransactionTypeExtended[]
  > {
    const { decimalsOf }: IERC20ServiceInterface = this.erc20Service;
    const reserveDecimals: number = await decimalsOf(supplyToken);
    const convertedAmount: string = valueToWei(initialAmount, reserveDecimals);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.loopExitPLUMESingleSwap({
          targetHealthFactor,
          onBehalfOf: onBehalfOf ?? user,
          isSupplyTokenA,
          supplyToken,
          numLoops,
          maverickPool,
          minAmountSupplied,
          initialAmount: convertedAmount,
        }),
      from: user,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  public async loopExitETHMultiSwap({
    user,
    targetHealthFactor,
    onBehalfOf,
    supplyToken,
    numLoops,
    minAmountSupplied,
    initialAmount,
    path,
  }: LoopExitETHMultiSwapParamsType): Promise<
    EthereumTransactionTypeExtended[]
  > {
    const { decimalsOf }: IERC20ServiceInterface = this.erc20Service;
    const reserveDecimals: number = await decimalsOf(supplyToken);
    const convertedAmount: string = valueToWei(initialAmount, reserveDecimals);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.loopExitPLUMEMultiSwap({
          targetHealthFactor,
          onBehalfOf: onBehalfOf ?? user,
          supplyToken,
          numLoops,
          minAmountSupplied,
          initialAmount: convertedAmount,
          path,
        }),
      from: user,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  public loopExitETHSingleAsset({
    user,
    targetHealthFactor,
    onBehalfOf,
    numLoops,
    initialAmount,
  }: LoopExitETHSingleAssetParamsType): EthereumTransactionTypeExtended[] {
    const convertedAmount: string = valueToWei(initialAmount, 18);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.loopExitPLUMESingleAsset({
          targetHealthFactor,
          onBehalfOf: onBehalfOf ?? user,
          numLoops,
          initialAmount: convertedAmount,
        }),
      from: user,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  public loopETHSingleAsset({
    user,
    targetHealthFactor,
    onBehalfOf,
    numLoops,
    initialAmount,
  }: LoopETHSingleAssetParamsType): EthereumTransactionTypeExtended[] {
    const convertedAmount: string = valueToWei(initialAmount, 18);

    const wethGatewayContract: WrappedTokenGatewayV3 = this.getContractInstance(
      this.wethGatewayAddress,
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        wethGatewayContract.populateTransaction.loopPLUMESingleAsset({
          targetHealthFactor,
          onBehalfOf: onBehalfOf ?? user,
          numLoops,
        }),
      value: convertedAmount,
      from: user,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }
}
