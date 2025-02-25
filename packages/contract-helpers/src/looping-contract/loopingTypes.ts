import { tEthereumAddress } from '../commons/types';

export type LoopSwapParamsType = {
  user: tEthereumAddress;
  supplyReserve: tEthereumAddress;
  borrowReserve: tEthereumAddress;
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

export type LoopETHParamsType = {
  user: tEthereumAddress;
  reserve: tEthereumAddress;
  numLoops: number;
  amount: string;
  targetHealthFactor: string;
  unwrap: boolean;
};

export type PoolTokens = {
  tokenA: tEthereumAddress;
  tokenB: tEthereumAddress;
};

export type SwapPool = {
  tokenA: tEthereumAddress;
  tokenB: tEthereumAddress;
  swapPool: tEthereumAddress;
};
