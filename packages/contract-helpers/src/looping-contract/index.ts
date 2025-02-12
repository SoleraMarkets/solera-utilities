import { constants, providers } from 'ethers';
import {
  BaseDebtToken,
  BaseDebtTokenInterface,
} from '../baseDebtToken-contract';
import BaseService from '../commons/BaseService';
import {
  eEthereumTxType,
  EthereumTransactionTypeExtended,
  ProtocolAction,
  transactionType,
} from '../commons/types';
import { DEFAULT_APPROVE_AMOUNT } from '../commons/utils';
import { ERC20Service, IERC20ServiceInterface } from '../erc20-contract';
import { UiPoolDataProviderInterface } from '../v3-UiPoolDataProvider-contract';
import {
  LendingPoolMarketConfigV3,
  Pool,
  PoolInterface,
} from '../v3-pool-contract';
import { LPReserveData } from '../v3-pool-contract/lendingPoolTypes';
import {
  LoopingMultiSwapParamsType,
  LoopingSingleAssetParamsType,
  LoopingSingleSwapParamsType,
} from './loopingTypes';
import { Looping } from './typechain/Looping';
import { Looping__factory } from './typechain/Looping__factory';

export class LoopingService extends BaseService<Looping> {
  readonly soleraLoopingContractAddress: string;

  readonly erc20Service: IERC20ServiceInterface;

  readonly debtTokenService: BaseDebtTokenInterface;

  readonly poolService: PoolInterface;

  readonly uiPoolDataProviderService: UiPoolDataProviderInterface;

  constructor(
    provider: providers.Provider,
    contractAddress: string | undefined,
    lendingPoolConfig?: LendingPoolMarketConfigV3,
  ) {
    super(provider, Looping__factory);

    this.erc20Service = new ERC20Service(provider);

    this.debtTokenService = new BaseDebtToken(provider, this.erc20Service);

    this.poolService = new Pool(provider, lendingPoolConfig);

    this.soleraLoopingContractAddress = contractAddress ?? '';
  }

  public async leveragePositionSingleSwap({
    user,
    supplyReserve,
    borrowReserve,
    maverickPool,
    isSupplyTokenA,
    numLoops,
    amount,
    targetHealthFactor,
  }: LoopingSingleSwapParamsType): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const { isApproved, approve } = this.erc20Service;

    const { isDelegationApproved, approveDelegation } = this.debtTokenService;

    const { getReserveData } = this.poolService;

    const loopingContract: Looping = this.getContractInstance(
      this.soleraLoopingContractAddress,
    );

    const approved: boolean = await isApproved({
      token: supplyReserve,
      user,
      spender: this.soleraLoopingContractAddress,
      amount,
    });

    if (!approved) {
      const approveTx = approve({
        user,
        token: supplyReserve,
        spender: this.soleraLoopingContractAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveTx);
    }

    const reserveData: LPReserveData = await getReserveData(borrowReserve);

    const delegationApproved: boolean = await isDelegationApproved({
      debtTokenAddress: reserveData.variableDebtTokenAddress,
      allowanceGiver: user,
      allowanceReceiver: this.soleraLoopingContractAddress,
      amount: constants.MaxUint256.div(2).toString(),
    });

    if (!delegationApproved) {
      const approveDelegationTx = approveDelegation({
        user,
        delegatee: this.soleraLoopingContractAddress,
        debtTokenAddress: reserveData.variableDebtTokenAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveDelegationTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        loopingContract.populateTransaction.leveragePositionSingleSwap(
          supplyReserve,
          borrowReserve,
          maverickPool,
          isSupplyTokenA,
          {
            initialAmount: amount,
            targetHealthFactor,
            numLoops,
          },
        ),
      from: user,
      action: ProtocolAction.loop,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(txs, txCallback),
    });

    return txs;
  }

  public async leveragePositionMultiSwap({
    user,
    supplyReserve,
    borrowReserve,
    path,
    numLoops,
    amount,
    targetHealthFactor,
  }: LoopingMultiSwapParamsType): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const { isApproved, approve } = this.erc20Service;

    const { isDelegationApproved, approveDelegation } = this.debtTokenService;

    const { getReserveData } = this.poolService;

    const loopingContract: Looping = this.getContractInstance(
      this.soleraLoopingContractAddress,
    );

    const approved: boolean = await isApproved({
      token: supplyReserve,
      user,
      spender: this.soleraLoopingContractAddress,
      amount,
    });

    if (!approved) {
      const approveTx = approve({
        user,
        token: supplyReserve,
        spender: this.soleraLoopingContractAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveTx);
    }

    const reserveData: LPReserveData = await getReserveData(borrowReserve);

    const delegationApproved: boolean = await isDelegationApproved({
      debtTokenAddress: reserveData.variableDebtTokenAddress,
      allowanceGiver: user,
      allowanceReceiver: this.soleraLoopingContractAddress,
      amount: constants.MaxUint256.div(2).toString(),
    });

    if (!delegationApproved) {
      const approveDelegationTx = approveDelegation({
        user,
        delegatee: this.soleraLoopingContractAddress,
        debtTokenAddress: reserveData.variableDebtTokenAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveDelegationTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        loopingContract.populateTransaction.leveragePositionMultiSwap(
          supplyReserve,
          borrowReserve,
          path,
          {
            initialAmount: amount,
            targetHealthFactor,
            numLoops,
          },
        ),
      from: user,
      action: ProtocolAction.loop,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(txs, txCallback),
    });

    return txs;
  }

  public async leveragePositionSingleAsset({
    user,
    reserve,
    numLoops,
    amount,
    targetHealthFactor,
  }: LoopingSingleAssetParamsType): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const { isApproved, approve } = this.erc20Service;

    const { isDelegationApproved, approveDelegation } = this.debtTokenService;

    const { getReserveData } = this.poolService;

    const loopingContract: Looping = this.getContractInstance(
      this.soleraLoopingContractAddress,
    );

    const approved: boolean = await isApproved({
      token: reserve,
      user,
      spender: this.soleraLoopingContractAddress,
      amount,
    });

    if (!approved) {
      const approveTx = approve({
        user,
        token: reserve,
        spender: this.soleraLoopingContractAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveTx);
    }

    const reserveData: LPReserveData = await getReserveData(reserve);

    const delegationApproved: boolean = await isDelegationApproved({
      debtTokenAddress: reserveData.variableDebtTokenAddress,
      allowanceGiver: user,
      allowanceReceiver: this.soleraLoopingContractAddress,
      amount: constants.MaxUint256.div(2).toString(),
    });

    if (!delegationApproved) {
      const approveDelegationTx = approveDelegation({
        user,
        delegatee: this.soleraLoopingContractAddress,
        debtTokenAddress: reserveData.variableDebtTokenAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveDelegationTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        loopingContract.populateTransaction.leveragePositionSingleAsset(
          reserve,
          {
            initialAmount: amount,
            targetHealthFactor,
            numLoops,
          },
        ),
      from: user,
      action: ProtocolAction.loop,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(txs, txCallback),
    });

    return txs;
  }
}
