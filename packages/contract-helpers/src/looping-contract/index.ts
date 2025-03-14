import { BigNumber, PopulatedTransaction, providers, utils } from 'ethers';
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
  PoolTokens,
  SwapConfig,
} from './loopingTypes';
import { Looping, LoopingInterface } from './typechain/Looping';
import { Looping__factory } from './typechain/factories';

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

export const WETH = '0x626613B473F7eF65747967017C11225436EFaEd7'.toLowerCase();
export const NRWA = '0x81537d879ACc8a290a1846635a0cAA908f8ca3a6'.toLowerCase();
export const PETH = '0xD630fb6A07c9c723cf709d2DaA9B63325d0E0B73'.toLowerCase();
export const NELIXIR =
  '0x9fbC367B9Bb966a2A537989817A088AFCaFFDC4c'.toLowerCase();
export const NYIELD =
  '0x892DFf5257B39f7afB7803dd7C81E8ECDB6af3E8'.toLowerCase();
export const PUSD = '0xdddD73F5Df1F0DC31373357beAC77545dC5A6f3F'.toLowerCase();
export const NTBILL =
  '0xE72Fe64840F4EF80E3Ec73a1c749491b5c938CB9'.toLowerCase();

const WETH_V_TOKEN = '0x578899D60B4ea83537d7d5DD399C2f17Bd15F489'.toLowerCase();

export class LoopingService extends BaseService<Looping> {
  readonly loopingContractAddress: string;

  readonly erc20Service: IERC20ServiceInterface;

  readonly debtTokenService: BaseDebtTokenInterface;

  readonly poolService: PoolInterface;

  readonly uiPoolDataProviderService: UiPoolDataProviderInterface;

  readonly loopingInstance: LoopingInterface;
  readonly wethGatewayInstance: WrappedTokenGatewayV3Interface;

  readonly wethGatewayAddress: tEthereumAddress;
  readonly poolAddress: tEthereumAddress;
  readonly loopAddress: tEthereumAddress;

  readonly maverickSingleSwap: Map<string, tEthereumAddress>;
  readonly maverickMultiSwap: Map<string, string>;

  loopSwapTxBuilder: LoopSwapTxBuilder;
  loopSingleAssetTxBuilder: LoopSingleAssetTxBuilder;
  loopETHTxBuilder: LoopETHTxBuilder;

  constructor(
    provider: providers.Provider,
    contractAddress: string | undefined,
    lendingPoolConfig?: LendingPoolMarketConfigV3,
  ) {
    super(provider, Looping__factory);

    const { POOL, WETH_GATEWAY } = lendingPoolConfig ?? {};

    this.erc20Service = new ERC20Service(provider);

    this.debtTokenService = new BaseDebtToken(provider, this.erc20Service);

    this.poolService = new Pool(provider, lendingPoolConfig);

    this.loopingContractAddress = contractAddress ?? '';

    this.loopingInstance = Looping__factory.createInterface();
    this.wethGatewayInstance = WrappedTokenGatewayV3__factory.createInterface();

    this.poolAddress = POOL ?? '';
    this.wethGatewayAddress = WETH_GATEWAY ?? '';
    this.loopAddress = contractAddress ?? '';

    this.maverickSingleSwap = new Map();
    this.maverickMultiSwap = new Map();

    this.maverickSingleSwap.set(
      this.getObjectKey({ tokenA: WETH, tokenB: NRWA }),
      '0x6EbE09DDb0edE205fAcE89AB0Bf29211cf885a92',
    );
    this.maverickSingleSwap.set(
      this.getObjectKey({ tokenA: WETH, tokenB: PETH }),
      '0x2e1ACd5Ef12d161686d417837003415b569c3c16',
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: WETH, tokenB: NELIXIR }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x40528F831D013cca16Fae64a7b4A1fA9b6ae86B7',
          false,
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NELIXIR, tokenB: WETH }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          false,
          '0x40528F831D013cca16Fae64a7b4A1fA9b6ae86B7',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: WETH, tokenB: NYIELD }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
          true,
          '0xbD2Dc0def95Ab16615dEC0744995027971FA8b8C',
          false,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NYIELD, tokenB: WETH }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xbD2Dc0def95Ab16615dEC0744995027971FA8b8C',
          true,
          '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
          false,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: WETH, tokenB: NTBILL }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
          true,
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NTBILL, tokenB: WETH }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          false,
          '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
          false,
        ],
      ),
    );
    this.maverickSingleSwap.set(
      this.getObjectKey({ tokenA: WETH, tokenB: PUSD }),
      '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NRWA, tokenB: PETH }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x6EbE09DDb0edE205fAcE89AB0Bf29211cf885a92',
          false,
          '0x2e1ACd5Ef12d161686d417837003415b569c3c16',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: PETH, tokenB: NRWA }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x2e1ACd5Ef12d161686d417837003415b569c3c16',
          false,
          '0x6EbE09DDb0edE205fAcE89AB0Bf29211cf885a92',
          true,
        ],
      ),
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NRWA, tokenB: NELIXIR }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0x6EbE09DDb0edE205fAcE89AB0Bf29211cf885a92',
          false,
          '0x40528F831D013cca16Fae64a7b4A1fA9b6ae86B7',
          false,
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NELIXIR, tokenB: NRWA }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          false,
          '0x40528F831D013cca16Fae64a7b4A1fA9b6ae86B7',
          true,
          '0x6EbE09DDb0edE205fAcE89AB0Bf29211cf885a92',
          true,
        ],
      ),
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NRWA, tokenB: NYIELD }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x9534362C3B5B0ab1770842888497CD299b2bEBCB',
          true,
          '0xbD2Dc0def95Ab16615dEC0744995027971FA8b8C',
          false,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NYIELD, tokenB: NRWA }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xbD2Dc0def95Ab16615dEC0744995027971FA8b8C',
          true,
          '0x9534362C3B5B0ab1770842888497CD299b2bEBCB',
          false,
        ],
      ),
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NRWA, tokenB: NTBILL }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x9534362C3B5B0ab1770842888497CD299b2bEBCB',
          true,
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NTBILL, tokenB: NRWA }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          false,
          '0x9534362C3B5B0ab1770842888497CD299b2bEBCB',
          false,
        ],
      ),
    );

    this.maverickSingleSwap.set(
      this.getObjectKey({ tokenA: NRWA, tokenB: PUSD }),
      '0x9534362C3B5B0ab1770842888497CD299b2bEBCB',
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: PETH, tokenB: NELIXIR }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xc48694997a6b7559a2A4C6B0bBA8ffd121Fa60a8',
          false,
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NELIXIR, tokenB: PETH }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          false,
          '0xc48694997a6b7559a2A4C6B0bBA8ffd121Fa60a8',
          true,
        ],
      ),
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: PETH, tokenB: NYIELD }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xc6a6cA7a7C0198a9FC9c616aA30b1BEa2956a0cc',
          true,
          '0x3B4b1655e50c130686b5da39E4b255e8Dd7e2010',
          false,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NYIELD, tokenB: PETH }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x3B4b1655e50c130686b5da39E4b255e8Dd7e2010',
          true,
          '0xc6a6cA7a7C0198a9FC9c616aA30b1BEa2956a0cc',
          false,
        ],
      ),
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: PETH, tokenB: NTBILL }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xc6a6cA7a7C0198a9FC9c616aA30b1BEa2956a0cc',
          true,
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NTBILL, tokenB: PETH }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          true,
          '0xc6a6cA7a7C0198a9FC9c616aA30b1BEa2956a0cc',
          true,
        ],
      ),
    );

    this.maverickSingleSwap.set(
      this.getObjectKey({ tokenA: PETH, tokenB: PUSD }),
      '0xc6a6cA7a7C0198a9FC9c616aA30b1BEa2956a0cc',
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NELIXIR, tokenB: NYIELD }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          false,
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          true,
          '0xbD2Dc0def95Ab16615dEC0744995027971FA8b8C',
          false,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NYIELD, tokenB: NELIXIR }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0xbD2Dc0def95Ab16615dEC0744995027971FA8b8C',
          true,
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          false,
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          true,
        ],
      ),
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NELIXIR, tokenB: NTBILL }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          false,
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          true,
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NTBILL, tokenB: NELIXIR }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          false,
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          false,
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          true,
        ],
      ),
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NELIXIR, tokenB: PUSD }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          true,
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: PUSD, tokenB: NELIXIR }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          false,
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          false,
        ],
      ),
    );

    this.maverickSingleSwap.set(
      this.getObjectKey({ tokenA: NYIELD, tokenB: PUSD }),
      '0x3B4b1655e50c130686b5da39E4b255e8Dd7e2010',
    );

    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NYIELD, tokenB: NTBILL }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x3B4b1655e50c130686b5da39E4b255e8Dd7e2010',
          true,
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      this.getObjectKey({ tokenA: NTBILL, tokenB: NYIELD }),
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          false,
          '0x3B4b1655e50c130686b5da39E4b255e8Dd7e2010',
          false,
        ],
      ),
    );

    this.maverickSingleSwap.set(
      this.getObjectKey({ tokenA: PUSD, tokenB: NTBILL }),
      '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
    );

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
        // Normalize token addresses for WETH
        const supplyWrapped =
          supplyReserve === API_ETH_MOCK_ADDRESS ? WETH : supplyReserve;
        const borrowWrapped =
          borrowReserve === API_ETH_MOCK_ADDRESS ? WETH : borrowReserve;

        // Determine swap type and pool
        const { swapType, singleSwapConfig, multiSwapConfig } =
          this.determineSwapConfig(supplyWrapped, borrowWrapped);

        if (swapType === 'single') {
          return this.createSingleSwapTransaction({
            user,
            supplyReserve,
            borrowReserve,
            numLoops,
            amount,
            targetHealthFactor,
            minAmountSupplied,
            pool: singleSwapConfig?.pool ?? '',
            isSupplyTokenA: singleSwapConfig?.isSupplyTokenA ?? true,
          });
        }

        if (swapType === 'multi') {
          return this.createMultiSwapTransaction({
            user,
            supplyReserve,
            borrowReserve,
            numLoops,
            amount,
            targetHealthFactor,
            minAmountSupplied,
            path: multiSwapConfig?.path ?? '',
          });
        }

        return this.createNestVaultTransaction({
          user,
          numLoops,
          amount,
          targetHealthFactor,
          minAmountSupplied,
          isSupplyingPUSD: swapType === 'pusd',
        });
      },
      getApprovedAmount: async (
        props: TokenOwner & { unWrapped: boolean },
      ): Promise<ApproveType> => {
        const spender = props.unWrapped
          ? this.wethGatewayAddress
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

    this.loopETHTxBuilder = {
      generateTxData: ({
        user,
        reserve,
        numLoops,
        amount,
        targetHealthFactor,
        unwrap,
      }: LoopETHParamsType): PopulatedTransaction => {
        const isSupplyingEth = reserve === API_ETH_MOCK_ADDRESS;

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
            to: this.wethGatewayAddress,
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
            to: this.wethGatewayAddress,
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
            to: this.wethGatewayAddress,
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
          spender = this.wethGatewayAddress;
        } else {
          spender = this.loopAddress;
        }

        const amount = await this.erc20Service.approvedAmount({
          ...props,
          token: WETH,
          spender,
        });
        return {
          ...props,
          token: WETH,
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
          debtTokenAddress: WETH_V_TOKEN,
          delegatee: spender,
        });
        return {
          debtTokenAddress: WETH_V_TOKEN,
          allowanceGiver: props.user,
          allowanceReceiver: spender,
          amount: amount.toString(),
        };
      },
    };
  }

  private determineSwapConfig(supply: string, borrow: string): SwapConfig {
    if (supply === PUSD && borrow === NRWA) {
      return {
        swapType: 'pusd',
      };
    }

    if (supply === NRWA && borrow === PUSD) {
      return {
        swapType: 'nrwa',
      };
    }

    // Check for single swap
    const singlePool = this.maverickSingleSwap.get(
      this.getObjectKey({ tokenA: supply, tokenB: borrow }),
    );
    const reverseSinglePool = this.maverickSingleSwap.get(
      this.getObjectKey({ tokenA: borrow, tokenB: supply }),
    );

    const multiPool = this.maverickMultiSwap.get(
      this.getObjectKey({ tokenA: borrow, tokenB: supply }),
    );

    if (singlePool || reverseSinglePool) {
      return {
        swapType: 'single',
        singleSwapConfig: {
          pool: singlePool ?? reverseSinglePool ?? '',
          isSupplyTokenA: Boolean(singlePool),
        },
      };
    }

    if (multiPool) {
      return {
        swapType: 'multi',
        multiSwapConfig: {
          path: multiPool ?? '',
        },
      };
    }

    return {
      swapType: null,
    };
  }

  private createNestVaultTransaction(config: {
    user: string;
    isSupplyingPUSD: boolean;
    numLoops: number;
    amount: string;
    targetHealthFactor: string;
    minAmountSupplied: string;
  }): PopulatedTransaction {
    const {
      user,
      isSupplyingPUSD,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    } = config;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let txData: string;
    let to: string;
    let value: BigNumber | undefined;

    if (isSupplyingPUSD) {
      txData = this.loopingInstance.encodeFunctionData('loopPUSD', [
        {
          targetHealthFactor,
          onBehalfOf: user,
          numLoops,
          minAmountSupplied,
          initialAmount: amount,
        },
      ]);
      to = this.loopingContractAddress;
    } else {
      txData = this.loopingInstance.encodeFunctionData('loopNRWA', [
        {
          targetHealthFactor,
          onBehalfOf: user,
          numLoops,
          minAmountSupplied,
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

  private createSingleSwapTransaction(config: {
    user: string;
    supplyReserve: string;
    borrowReserve: string;
    pool: string;
    isSupplyTokenA: boolean;
    numLoops: number;
    amount: string;
    targetHealthFactor: string;
    minAmountSupplied: string;
  }): PopulatedTransaction {
    const {
      user,
      supplyReserve,
      borrowReserve,
      pool,
      isSupplyTokenA,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    } = config;

    const isSupplyingEth = supplyReserve === API_ETH_MOCK_ADDRESS;
    const isBorrowingEth = borrowReserve === API_ETH_MOCK_ADDRESS;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let txData: string;
    let to: string;
    let value: BigNumber | undefined;

    // Determine the transaction method and parameters based on scenario
    if (!isSupplyingEth && !isBorrowingEth) {
      // Case 1: Regular single-swap
      txData = this.loopingInstance.encodeFunctionData('loopSingleSwap', [
        {
          supplyToken: supplyReserve,
          targetHealthFactor,
          onBehalfOf: user,
          isSupplyTokenA,
          borrowToken: borrowReserve,
          numLoops,
          maverickPool: pool,
          minAmountSupplied,
          initialAmount: amount,
        },
      ]);
      to = this.loopingContractAddress;
    } else if (isSupplyingEth && !isBorrowingEth) {
      // Case 2: ETH->Token single-swap
      txData = this.wethGatewayInstance.encodeFunctionData(
        'loopEntryPLUMESingleSwap',
        [
          {
            targetHealthFactor,
            onBehalfOf: user,
            isSupplyTokenA,
            borrowToken: borrowReserve,
            numLoops,
            maverickPool: pool,
            minAmountSupplied,
          },
        ],
      );
      to = this.wethGatewayAddress;
      value = BigNumber.from(amount);
    } else {
      // Case 3: Token->ETH single-swap
      txData = this.wethGatewayInstance.encodeFunctionData(
        'loopExitPLUMESingleSwap',
        [
          {
            supplyToken: supplyReserve,
            targetHealthFactor,
            onBehalfOf: user,
            isSupplyTokenA,
            numLoops,
            maverickPool: pool,
            minAmountSupplied,
            initialAmount: amount,
          },
        ],
      );
      to = this.wethGatewayAddress;
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

  private createMultiSwapTransaction(config: {
    user: string;
    supplyReserve: string;
    borrowReserve: string;
    path: string;
    numLoops: number;
    amount: string;
    targetHealthFactor: string;
    minAmountSupplied: string;
  }): PopulatedTransaction {
    const {
      user,
      supplyReserve,
      borrowReserve,
      path,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    } = config;

    const isSupplyingEth = supplyReserve === API_ETH_MOCK_ADDRESS;
    const isBorrowingEth = borrowReserve === API_ETH_MOCK_ADDRESS;

    const gasLimit = BigNumber.from(
      gasLimitRecommendations[ProtocolAction.default].limit,
    );

    let txData: string;
    let to: string;
    let value: BigNumber | undefined;

    if (!isSupplyingEth && !isBorrowingEth) {
      // Case 1: Regular multi-swap
      txData = this.loopingInstance.encodeFunctionData('loopMultiSwap', [
        {
          supplyToken: supplyReserve,
          targetHealthFactor,
          onBehalfOf: user,
          borrowToken: borrowReserve,
          numLoops,
          minAmountSupplied,
          initialAmount: amount,
          path,
        },
      ]);
      to = this.loopingContractAddress;
    } else if (isSupplyingEth && !isBorrowingEth) {
      // Case 2: ETH->Token multi-swap
      txData = this.wethGatewayInstance.encodeFunctionData(
        'loopEntryPLUMEMultiSwap',
        [
          {
            targetHealthFactor,
            onBehalfOf: user,
            borrowToken: borrowReserve,
            numLoops,
            minAmountSupplied,
            path,
          },
        ],
      );
      to = this.wethGatewayAddress;
      value = BigNumber.from(amount);
    } else {
      // Case 3: Token->ETH multi-swap
      txData = this.wethGatewayInstance.encodeFunctionData(
        'loopExitPLUMEMultiSwap',
        [
          {
            supplyToken: supplyReserve,
            targetHealthFactor,
            onBehalfOf: user,
            numLoops,
            minAmountSupplied,
            path,
            initialAmount: amount,
          },
        ],
      );
      to = this.wethGatewayAddress;
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

  private getObjectKey(obj: PoolTokens) {
    return JSON.stringify(obj);
  }
}
