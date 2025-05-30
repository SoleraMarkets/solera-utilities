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

export type SwapConfig = {
  swapType:
    | 'single'
    | 'multi'
    | 'nalpha'
    | 'ninsto'
    | 'nbasis'
    | 'netf'
    | 'splume'
    | null;
  singleSwapConfig?: SingleSwapConfig;
  multiSwapConfig?: MultiSwapConfig;
};

export type SingleSwapConfig = {
  pool: string;
  isSupplyTokenA: boolean;
};

export type MultiSwapConfig = {
  path: string;
};
