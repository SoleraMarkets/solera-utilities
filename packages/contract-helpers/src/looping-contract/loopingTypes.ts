import { tEthereumAddress } from '../commons/types';

export type LoopingSingleSwapParamsType = {
  user: tEthereumAddress;
  supplyReserve: tEthereumAddress;
  borrowReserve: tEthereumAddress;
  maverickPool: tEthereumAddress;
  isSupplyTokenA: boolean;
  numLoops: number;
  amount: string;
  targetHealthFactor: string;
};

export type LoopingMultiSwapParamsType = {
  user: tEthereumAddress;
  supplyReserve: tEthereumAddress;
  borrowReserve: tEthereumAddress;
  path: string;
  numLoops: number;
  amount: string;
  targetHealthFactor: string;
};

export type LoopingSingleAssetParamsType = {
  user: tEthereumAddress;
  reserve: tEthereumAddress;
  numLoops: number;
  amount: string;
  targetHealthFactor: string;
};
