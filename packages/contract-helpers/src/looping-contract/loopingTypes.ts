import { tEthereumAddress } from '../commons/types';

export type LoopSingleSwapParamsType = {
  user: tEthereumAddress;
  supplyReserve: tEthereumAddress;
  borrowReserve: tEthereumAddress;
  maverickPool: tEthereumAddress;
  isSupplyTokenA: boolean;
  numLoops: number;
  amount: string;
  targetHealthFactor: string;
  minAmountSupplied: string;
};

export type LoopMultiSwapParamsType = {
  user: tEthereumAddress;
  supplyReserve: tEthereumAddress;
  borrowReserve: tEthereumAddress;
  path: string;
  numLoops: number;
  amount: string;
  targetHealthFactor: string;
  minAmountSupplied: string;
};

export type LoopSingleAssetParamsType = {
  user: tEthereumAddress;
  reserve: tEthereumAddress;
  numLoops: number;
  amount: string;
  targetHealthFactor: string;
};
