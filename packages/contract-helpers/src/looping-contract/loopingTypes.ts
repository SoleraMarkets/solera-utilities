import { tEthereumAddress } from '../commons/types';

export type LoopingParamsType = {
  user: tEthereumAddress;
  supplyReserve: tEthereumAddress;
  borrowReserve: tEthereumAddress;
  maverickPool: tEthereumAddress;
  isSupplyTokenA: boolean;
  numLoops: number;
  amount: string;
  borrowCeiling: string;
  targetHealthFactor: string;
};
