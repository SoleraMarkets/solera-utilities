import { BigNumber, BigNumberish } from 'ethers';

export type LoopSimulationParams = {
  supply: string;
  borrow: string;
  targetHealthFactor: BigNumberish;
  numLoops: BigNumberish;
  initialAmount: BigNumberish;
};

export type LoopData = {
  supplyAmount: BigNumber;
  borrowAmount: BigNumber;
  leftoverBorrowAmount: BigNumber;
};
