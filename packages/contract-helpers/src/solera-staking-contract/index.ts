import { providers } from 'ethers';

import { parseUnits } from 'ethers/lib/utils';
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
import { SoleraStaking, ISoleraStaking } from './typechain/SoleraStaking';
import { PLUMEGateway__factory } from './typechain/factories/PLUMEGateway__factory';
import { SoleraStaking__factory } from './typechain/factories/SoleraStaking__factory';

export class SoleraStakingService extends BaseService<SoleraStaking> {
  readonly plumeGatewayAddress: string;

  readonly stakingContractAddress: string;

  readonly erc20Service: IERC20ServiceInterface;

  constructor(
    provider: providers.Provider,
    contractAddress: string | undefined,
    plumeGatewayAddress: string | undefined,
  ) {
    super(provider, SoleraStaking__factory);
    this.erc20Service = new ERC20Service(provider);

    this.plumeGatewayAddress = plumeGatewayAddress ?? '';

    this.stakingContractAddress = contractAddress ?? '';
  }

  public async previewRedeem(shares: string): Promise<string> {
    const stakingContract: SoleraStaking = this.getContractInstance(
      this.stakingContractAddress,
    );

    return (await stakingContract.previewRedeem(shares)).toString();
  }

  public async previewDeposit(amount: string): Promise<string> {
    const stakingContract: SoleraStaking = this.getContractInstance(
      this.stakingContractAddress,
    );

    return (await stakingContract.previewDeposit(amount)).toString();
  }

  public async getWithdrawRequests(
    user: tEthereumAddress,
  ): Promise<ISoleraStaking.WithdrawRequestStructOutput[]> {
    const stakingContract: SoleraStaking = this.getContractInstance(
      this.stakingContractAddress,
    );

    return stakingContract.getWithdrawRequests(user);
  }

  public async depositPLUME(
    user: tEthereumAddress,
    amount: string,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const plumeGatewayContract = PLUMEGateway__factory.connect(
      this.plumeGatewayAddress,
      this.provider,
    );

    const txs: EthereumTransactionTypeExtended[] = [];

    const convertedAmount: string = parseUnits(amount).toString();

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        plumeGatewayContract.populateTransaction.depositPLUME(user),
      from: user,
      value: convertedAmount,
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

  public async requestRedeemPLUME(
    user: tEthereumAddress,
    amount: string,
    minAmount: string,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const { decimalsOf, isApproved, approve } = this.erc20Service;

    const approved = await isApproved({
      token: this.stakingContractAddress,
      user,
      spender: this.plumeGatewayAddress,
      amount,
    });

    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = approve({
        user,
        token: this.stakingContractAddress,
        spender: this.plumeGatewayAddress,
        amount: DEFAULT_APPROVE_AMOUNT,
      });
      txs.push(approveTx);
    }

    const stakeTokenDecimals: number = await decimalsOf(
      this.stakingContractAddress,
    );
    const convertedAmount: string = valueToWei(amount, stakeTokenDecimals);
    const convertedMinAmount: string = valueToWei(
      minAmount,
      stakeTokenDecimals,
    );

    const plumeGatewayContract = PLUMEGateway__factory.connect(
      this.plumeGatewayAddress,
      this.provider,
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        plumeGatewayContract.populateTransaction.requestRedeemPLUME(
          convertedAmount,
          user,
          convertedMinAmount,
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

  public async redeemPLUME(
    user: tEthereumAddress,
    index: number,
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const plumeGatewayContract = PLUMEGateway__factory.connect(
      this.plumeGatewayAddress,
      this.provider,
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: async () =>
        plumeGatewayContract.populateTransaction.redeemPLUME(index, user),
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
