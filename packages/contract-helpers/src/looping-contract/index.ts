/* eslint-disable complexity */
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
import { WrappedTokenGatewayV3__factory } from '../v3-wethgateway-contract/typechain/WrappedTokenGatewayV3__factory';
import {
  LoopETHParamsType,
  LoopSingleAssetParamsType,
  LoopSwapParamsType,
  PoolTokens,
} from './loopingTypes';
import { Looping, LoopingInterface } from './typechain/Looping';
import { Looping__factory } from './typechain/Looping__factory';

export type LoopSwapTxBuilder = {
  generateTxData: (args: LoopSwapParamsType) => PopulatedTransaction;
  getApprovedAmount: ({ user, token }: TokenOwner) => Promise<ApproveType>;
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
  }: {
    user: tEthereumAddress;
  }) => Promise<ApproveType>;
  getCreditApprovedAmount: ({
    user,
  }: {
    user: tEthereumAddress;
  }) => Promise<DelegationApprovedType>;
};

const WETH = '0x626613B473F7eF65747967017C11225436EFaEd7';
const NRWA = '0x81537d879ACc8a290a1846635a0cAA908f8ca3a6';
const PETH = '0xD630fb6A07c9c723cf709d2DaA9B63325d0E0B73';
const NELIXIR = '0x9fbC367B9Bb966a2A537989817A088AFCaFFDC4c';
const NYIELD = '0x892DFf5257B39f7afB7803dd7C81E8ECDB6af3E8';
const PUSD = '0xdddD73F5Df1F0DC31373357beAC77545dC5A6f3F';
const NTBILL = '0xE72Fe64840F4EF80E3Ec73a1c749491b5c938CB9';

const WETH_V_TOKEN = '0x578899D60B4ea83537d7d5DD399C2f17Bd15F489';

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

  readonly maverickSingleSwap: Map<PoolTokens, tEthereumAddress>;
  readonly maverickMultiSwap: Map<PoolTokens, string>;

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

    this.maverickSingleSwap.set(
      { tokenA: WETH, tokenB: NRWA },
      '0x6EbE09DDb0edE205fAcE89AB0Bf29211cf885a92',
    );
    this.maverickSingleSwap.set(
      { tokenA: WETH, tokenB: PETH },
      '0x2e1ACd5Ef12d161686d417837003415b569c3c16',
    );
    this.maverickMultiSwap.set(
      { tokenA: WETH, tokenB: NELIXIR },
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
      { tokenA: NELIXIR, tokenB: WETH },
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
      { tokenA: WETH, tokenB: NYIELD },
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
      { tokenA: NYIELD, tokenB: WETH },
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
      { tokenA: WETH, tokenB: NTBILL },
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
      { tokenA: NTBILL, tokenB: WETH },
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
      { tokenA: WETH, tokenB: PUSD },
      '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
    );
    this.maverickMultiSwap.set(
      { tokenA: NRWA, tokenB: PETH },
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
      { tokenA: PETH, tokenB: NRWA },
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
      { tokenA: NRWA, tokenB: NELIXIR },
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
      { tokenA: NELIXIR, tokenB: NRWA },
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
      { tokenA: NRWA, tokenB: NYIELD },
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
      { tokenA: NYIELD, tokenB: NRWA },
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
      { tokenA: NRWA, tokenB: NTBILL },
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
      { tokenA: NTBILL, tokenB: NRWA },
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
      { tokenA: NRWA, tokenB: PUSD },
      '0x9534362C3B5B0ab1770842888497CD299b2bEBCB',
    );

    this.maverickMultiSwap.set(
      { tokenA: PETH, tokenB: NELIXIR },
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
      { tokenA: NELIXIR, tokenB: PETH },
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
      { tokenA: PETH, tokenB: NYIELD },
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
      { tokenA: NYIELD, tokenB: PETH },
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
      { tokenA: PETH, tokenB: NTBILL },
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
      { tokenA: NTBILL, tokenB: PETH },
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
      { tokenA: PETH, tokenB: PUSD },
      '0xc6a6cA7a7C0198a9FC9c616aA30b1BEa2956a0cc',
    );

    this.maverickMultiSwap.set(
      { tokenA: NELIXIR, tokenB: NYIELD },
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
      { tokenA: NYIELD, tokenB: NELIXIR },
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
      { tokenA: NELIXIR, tokenB: NTBILL },
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
      { tokenA: NTBILL, tokenB: NELIXIR },
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
      { tokenA: NELIXIR, tokenB: PUSD },
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          true,
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          true,
        ],
      ),
    );
    this.maverickMultiSwap.set(
      { tokenA: PUSD, tokenB: NELIXIR },
      utils.solidityPack(
        ['address', 'bool', 'address', 'bool', 'address', 'bool'],
        [
          '0x4264FcaA686264B1A247Fa1Ae85078980b759E8A',
          false,
          '0xCef7E4547328130B58e07d171F56f5A705c86fc5',
          false,
        ],
      ),
    );

    this.maverickSingleSwap.set(
      { tokenA: NYIELD, tokenB: PUSD },
      '0xc6a6cA7a7C0198a9FC9c616aA30b1BEa2956a0cc',
    );

    this.maverickMultiSwap.set(
      { tokenA: NYIELD, tokenB: NTBILL },
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
      { tokenA: NTBILL, tokenB: NYIELD },
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
      { tokenA: PUSD, tokenB: NTBILL },
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
        const supplyWrapped =
          supplyReserve === API_ETH_MOCK_ADDRESS ? WETH : supplyReserve;
        const borrowWrapped =
          borrowReserve === API_ETH_MOCK_ADDRESS ? WETH : borrowReserve;
        const singlePool = this.maverickSingleSwap.get({
          tokenA: supplyWrapped,
          tokenB: borrowWrapped,
        });
        const reverseSinglePool = this.maverickSingleSwap.get({
          tokenA: borrowWrapped,
          tokenB: supplyWrapped,
        });
        const multiPoolA = this.maverickMultiSwap.get({
          tokenA: supplyWrapped,
          tokenB: borrowWrapped,
        });
        const multiPoolB = this.maverickMultiSwap.get({
          tokenA: borrowWrapped,
          tokenB: supplyWrapped,
        });

        const isSingleSwap = Boolean(singlePool) || Boolean(reverseSinglePool);
        const isMultiHopSwap = Boolean(multiPoolA) || Boolean(multiPoolB);
        const isSupplyingEth = supplyReserve === API_ETH_MOCK_ADDRESS;
        const isBorrowingEth = borrowReserve === API_ETH_MOCK_ADDRESS;

        let actionTx: PopulatedTransaction;
        if (isSingleSwap && !isSupplyingEth && !isBorrowingEth) {
          const txData = this.loopingInstance.encodeFunctionData(
            'loopSingleSwap',
            [
              {
                supplyToken: supplyReserve,
                targetHealthFactor,
                onBehalfOf: user,
                isSupplyTokenA: Boolean(singlePool),
                borrowToken: borrowReserve,
                numLoops,
                maverickPool: singlePool ?? reverseSinglePool ?? '',
                minAmountSupplied,
                initialAmount: amount,
              },
            ],
          );
          actionTx = {
            data: txData,
            to: this.loopingContractAddress,
            from: user,
            gasLimit: BigNumber.from(
              gasLimitRecommendations[ProtocolAction.default].limit,
            ),
          };
        } else if (isSingleSwap && isSupplyingEth && !isBorrowingEth) {
          const txData = this.wethGatewayInstance.encodeFunctionData(
            'loopEntryETHSingleSwap',
            [
              {
                targetHealthFactor,
                onBehalfOf: user,
                isSupplyTokenA: Boolean(singlePool),
                borrowToken: borrowReserve,
                numLoops,
                maverickPool: singlePool ?? reverseSinglePool ?? '',
                minAmountSupplied,
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
        } else if (isSingleSwap && !isSupplyingEth && isBorrowingEth) {
          const txData = this.wethGatewayInstance.encodeFunctionData(
            'loopExitETHSingleSwap',
            [
              {
                supplyToken: supplyReserve,
                targetHealthFactor,
                onBehalfOf: user,
                isSupplyTokenA: Boolean(singlePool),
                numLoops,
                maverickPool: singlePool ?? reverseSinglePool ?? '',
                minAmountSupplied,
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
        } else if (isMultiHopSwap && !isSupplyingEth && !isBorrowingEth) {
          const txData = this.loopingInstance.encodeFunctionData(
            'loopMultiSwap',
            [
              {
                supplyToken: supplyReserve,
                targetHealthFactor,
                onBehalfOf: user,
                borrowToken: borrowReserve,
                numLoops,
                minAmountSupplied,
                initialAmount: amount,
                path: multiPoolA ?? multiPoolB ?? '',
              },
            ],
          );
          actionTx = {
            data: txData,
            to: this.loopingContractAddress,
            from: user,
            gasLimit: BigNumber.from(
              gasLimitRecommendations[ProtocolAction.default].limit,
            ),
          };
        } else if (isMultiHopSwap && isSupplyingEth && !isBorrowingEth) {
          const txData = this.wethGatewayInstance.encodeFunctionData(
            'loopEntryETHMultiSwap',
            [
              {
                targetHealthFactor,
                onBehalfOf: user,
                borrowToken: borrowReserve,
                numLoops,
                minAmountSupplied,
                path: multiPoolA ?? multiPoolB ?? '',
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
        } else if (isMultiHopSwap && !isSupplyingEth && isBorrowingEth) {
          const txData = this.wethGatewayInstance.encodeFunctionData(
            'loopExitETHMultiSwap',
            [
              {
                supplyToken: supplyReserve,
                targetHealthFactor,
                onBehalfOf: user,
                numLoops,
                minAmountSupplied,
                path: multiPoolA ?? multiPoolB ?? '',
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
          throw new Error('swap pool not found');
        }

        return actionTx;
      },
      getApprovedAmount: async (props: TokenOwner): Promise<ApproveType> => {
        const spender =
          props.token.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase()
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
            'loopETHSingleAsset',
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
            'loopEntryETHSingleAsset',
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
            'loopExitETHSingleAsset',
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
      }): Promise<ApproveType> => {
        const spender = this.loopAddress;
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
}
