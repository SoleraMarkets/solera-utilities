import { providers } from 'ethers';
import { LoopingService, NRWA, PETH } from './index';

describe('StakingService', () => {
  const provider = new providers.JsonRpcProvider();

  const LOOPING_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000001';
  const POOL_ADDRESS = '0x0000000000000000000000000000000000000002';
  const WETH_GATEWAY_ADDRESS = '0x0000000000000000000000000000000000000003';
  const user = '0x0000000000000000000000000000000000000004';

  describe('Initialization', () => {
    it('Expects to be initialized with all params', () => {
      const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
        POOL: POOL_ADDRESS,
        WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
      });
      expect(instance instanceof LoopingService).toEqual(true);

      instance.loopSwapTxBuilder.generateTxData({
        user,
        supplyReserve: NRWA,
        borrowReserve: PETH,
        numLoops: 2,
        amount: '100000',
        targetHealthFactor: '12000',
        minAmountSupplied: '0',
      });
    });
  });
});
