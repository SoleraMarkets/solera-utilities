import { providers } from 'ethers';

import BaseService from '../commons/BaseService';
import {
  eEthereumTxType,
  EthereumTransactionTypeExtended,
  ProtocolAction,
  tEthereumAddress,
  transactionType,
} from '../commons/types';
import { DEFAULT_APPROVE_AMOUNT, valueToWei } from '../commons/utils';
import { ERC20Service, IERC20ServiceInterface } from '../erc20-contract';
import { SoleraStaking } from './typechain/SoleraStaking';
import { SoleraStaking__factory } from './typechain/SoleraStaking__factory';

export class SoleraStakingService extends BaseService<SoleraStaking> {
  readonly soleraStakingContractAddress: string;

  readonly erc20Service: IERC20ServiceInterface;

  constructor(
    provider: providers.Provider,
    contractAddress: string | undefined,
  ) {
    super(provider, SoleraStaking__factory);

    this.erc20Service = new ERC20Service(provider);

    this.soleraStakingContractAddress = contractAddress ?? '';
  }

  public async previewRedeem(shares: string): Promise<string> {
    const stakingContract: SoleraStaking = this.getContractInstance(
      this.soleraStakingContractAddress,
    );

    return (await stakingContract.previewRedeem(shares)).toString();
  }

  public async previewDeposit(amount: string): Promise<string> {
    const stakingContract: SoleraStaking = this.getContractInstance(
      this.soleraStakingContractAddress,
    );

    return (await stakingContract.previewDeposit(amount)).toString();
  }

  public async getWithdrawRequests(
    user: tEthereumAddress,
  ): Promise<SoleraStaking.WithdrawRequestStructOutput[]> {
    const stakingContract: SoleraStaking = this.getContractInstance(
      this.soleraStakingContractAddress,
    );

    return stakingContract.getWithdrawRequests(user);
  }

  public async deposit(
    user: tEthereumAddress,
    receiver: tEthereumAddress,
    amount: string,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const { decimalsOf, isApproved, approve } = this.erc20Service;

    const stakingContract: SoleraStaking = this.getContractInstance(
      this.soleraStakingContractAddress,
    );

    const asset: string = await stakingContract.asset();
    const stakedTokenDecimals: number = await decimalsOf(asset);
    const convertedAmount: string = valueToWei(amount, stakedTokenDecimals);

    const approved: boolean = await isApproved({
      token: asset,
      user,
      spender: this.soleraStakingContractAddress,
      amount,
    });

    if (!approved) {
      const approveTx = approve({
        user,
        token: asset,
        spender: this.soleraStakingContractAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        stakingContract.populateTransaction.deposit(convertedAmount, receiver),
      from: user,
      action: ProtocolAction.soleraStake,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.SOLERA_STAKE_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.soleraStake,
      ),
    });

    return txs;
  }

  public async requestRedeem(
    user: tEthereumAddress,
    receiver: tEthereumAddress,
    amount: string,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const { decimalsOf } = this.erc20Service;

    const stakingContract: SoleraStaking = this.getContractInstance(
      this.soleraStakingContractAddress,
    );

    const stakingTokenDecimals: number = await decimalsOf(
      this.soleraStakingContractAddress,
    );
    const convertedAmount: string = valueToWei(amount, stakingTokenDecimals);

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        stakingContract.populateTransaction.requestRedeem(
          convertedAmount,
          receiver,
          user,
        ),
      from: user,
      action: ProtocolAction.soleraRequestUnstake,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.SOLERA_STAKE_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.soleraRequestUnstake,
      ),
    });

    return txs;
  }

  public async redeem(
    user: tEthereumAddress,
    index: number,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const stakingContract: SoleraStaking = this.getContractInstance(
      this.soleraStakingContractAddress,
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        stakingContract.populateTransaction['redeem(uint256)'](index),
      from: user,
      action: ProtocolAction.soleraUnstake,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.SOLERA_STAKE_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.soleraUnstake,
      ),
    });

    return txs;
  }
}
