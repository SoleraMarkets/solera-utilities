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
}
