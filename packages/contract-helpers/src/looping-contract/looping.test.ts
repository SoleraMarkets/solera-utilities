import { BigNumber, providers, utils } from 'ethers';
import { API_ETH_MOCK_ADDRESS } from '../commons/utils';
import { WrappedTokenGatewayV3__factory } from '../v3-wethgateway-contract/typechain/WrappedTokenGatewayV3__factory';
import { Looping__factory } from './typechain/factories';
import { LoopingService, NRWA, NTBILL, PETH, PUSD, WETH } from './index';

describe('LoopingService', () => {
  const provider = new providers.JsonRpcProvider();

  const LOOPING_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000001';
  const POOL_ADDRESS = '0x0000000000000000000000000000000000000002';
  const WETH_GATEWAY_ADDRESS = '0x0000000000000000000000000000000000000003';
  const user = '0x0000000000000000000000000000000000000004';

  describe('GenerateTxData', () => {
    it('Expects to generate tx data for single swap looping', () => {
      const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
        POOL: POOL_ADDRESS,
        WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
      });
      expect(instance instanceof LoopingService).toEqual(true);

      const targetHealthFactor = '12000';
      const numLoops = 2;
      const minAmountSupplied = '0';
      const amount = '100000';

      const tx = instance.loopSwapTxBuilder.generateTxData({
        user,
        supplyReserve: WETH,
        borrowReserve: PUSD,
        numLoops,
        amount,
        targetHealthFactor,
        minAmountSupplied,
      });

      const expectedTxData =
        Looping__factory.createInterface().encodeFunctionData(
          'loopSingleSwap',
          [
            {
              supplyToken: WETH,
              targetHealthFactor,
              onBehalfOf: user,
              borrowToken: PUSD,
              numLoops,
              minAmountSupplied,
              initialAmount: amount,
              maverickPool: '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
              isSupplyTokenA: true,
            },
          ],
        );

      expect(tx.data).toEqual(expectedTxData);
    });

    it('Expects to generate tx data for multi swap looping', () => {
      const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
        POOL: POOL_ADDRESS,
        WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
      });
      expect(instance instanceof LoopingService).toEqual(true);

      const targetHealthFactor = '12000';
      const numLoops = 2;
      const minAmountSupplied = '0';
      const amount = '100000';

      const tx = instance.loopSwapTxBuilder.generateTxData({
        user,
        supplyReserve: NRWA,
        borrowReserve: PETH,
        numLoops,
        amount,
        targetHealthFactor,
        minAmountSupplied,
      });

      const path = utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x6EbE09DDb0edE205fAcE89AB0Bf29211cf885a92',
          false,
          '0x2e1ACd5Ef12d161686d417837003415b569c3c16',
          true,
        ],
      );

      const expectedTxData =
        Looping__factory.createInterface().encodeFunctionData('loopMultiSwap', [
          {
            supplyToken: NRWA,
            targetHealthFactor,
            onBehalfOf: user,
            borrowToken: PETH,
            numLoops,
            minAmountSupplied,
            initialAmount: amount,
            path,
          },
        ]);

      expect(tx.data).toEqual(expectedTxData);
    });

    it('Expects to generate tx data for single asset looping', () => {
      const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
        POOL: POOL_ADDRESS,
        WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
      });
      expect(instance instanceof LoopingService).toEqual(true);

      const targetHealthFactor = '12000';
      const numLoops = 2;
      const amount = '100000';

      const tx = instance.loopSingleAssetTxBuilder.generateTxData({
        user,
        reserve: PUSD,
        numLoops,
        amount,
        targetHealthFactor,
      });

      const expectedTxData =
        Looping__factory.createInterface().encodeFunctionData(
          'loopSingleAsset',
          [
            {
              token: PUSD,
              targetHealthFactor,
              onBehalfOf: user,
              numLoops,
              initialAmount: amount,
            },
          ],
        );

      expect(tx.data).toEqual(expectedTxData);
    });

    it('Expects to generate tx data for ETH->Token single swap looping', () => {
      const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
        POOL: POOL_ADDRESS,
        WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
      });
      expect(instance instanceof LoopingService).toEqual(true);

      const targetHealthFactor = '12000';
      const numLoops = 2;
      const amount = '100000';
      const minAmountSupplied = '0';

      const tx = instance.loopSwapTxBuilder.generateTxData({
        user,
        supplyReserve: API_ETH_MOCK_ADDRESS,
        borrowReserve: PUSD,
        numLoops,
        amount,
        targetHealthFactor,
        minAmountSupplied,
      });

      const expectedTxData =
        WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
          'loopEntryETHSingleSwap',
          [
            {
              onBehalfOf: user,
              numLoops,
              targetHealthFactor,
              isSupplyTokenA: true,
              borrowToken: PUSD,
              maverickPool: '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
              minAmountSupplied,
            },
          ],
        );

      expect(tx.data).toEqual(expectedTxData);
      expect(tx.value).toEqual(BigNumber.from(amount));
    });

    it('Expects to generate tx data for ETH->Token multi swap looping', () => {
      const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
        POOL: POOL_ADDRESS,
        WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
      });
      expect(instance instanceof LoopingService).toEqual(true);

      const targetHealthFactor = '12000';
      const numLoops = 2;
      const amount = '100000';
      const minAmountSupplied = '0';

      const tx = instance.loopSwapTxBuilder.generateTxData({
        user,
        supplyReserve: API_ETH_MOCK_ADDRESS,
        borrowReserve: NTBILL,
        numLoops,
        amount,
        targetHealthFactor,
        minAmountSupplied,
      });

      const path = utils.solidityPack(
        ['address', 'bool', 'address', 'bool'],
        [
          '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
          true,
          '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
          true,
        ],
      );

      const expectedTxData =
        WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
          'loopEntryETHMultiSwap',
          [
            {
              onBehalfOf: user,
              numLoops,
              targetHealthFactor,
              borrowToken: NTBILL,
              minAmountSupplied,
              path,
            },
          ],
        );

      expect(tx.data).toEqual(expectedTxData);
      expect(tx.value).toEqual(BigNumber.from(amount));
    });

    it('Expects to generate tx data for ETH->WETH single asset looping', () => {
      const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
        POOL: POOL_ADDRESS,
        WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
      });
      expect(instance instanceof LoopingService).toEqual(true);

      const targetHealthFactor = '12000';
      const numLoops = 2;
      const amount = '100000';

      const tx = instance.loopETHTxBuilder.generateTxData({
        user,
        reserve: API_ETH_MOCK_ADDRESS,
        numLoops,
        amount,
        targetHealthFactor,
        unwrap: false,
      });

      const expectedTxData =
        WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
          'loopEntryETHSingleAsset',
          [
            {
              targetHealthFactor,
              onBehalfOf: user,
              numLoops,
            },
          ],
        );

      expect(tx.data).toEqual(expectedTxData);
      expect(tx.value).toEqual(BigNumber.from(amount));
    });
  });

  it('Expects to generate tx data for Token->ETH single swap looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const amount = '100000';
    const minAmountSupplied = '0';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: PUSD,
      borrowReserve: API_ETH_MOCK_ADDRESS,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const expectedTxData =
      WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
        'loopExitETHSingleSwap',
        [
          {
            onBehalfOf: user,
            numLoops,
            targetHealthFactor,
            isSupplyTokenA: false,
            supplyToken: PUSD,
            maverickPool: '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
            minAmountSupplied,
            initialAmount: amount,
          },
        ],
      );

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for Token->ETH multi swap looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const amount = '100000';
    const minAmountSupplied = '0';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: NTBILL,
      borrowReserve: API_ETH_MOCK_ADDRESS,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const path = utils.solidityPack(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
        false,
        '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
        false,
      ],
    );

    const expectedTxData =
      WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
        'loopExitETHMultiSwap',
        [
          {
            onBehalfOf: user,
            numLoops,
            targetHealthFactor,
            supplyToken: NTBILL,
            minAmountSupplied,
            path,
            initialAmount: amount,
          },
        ],
      );

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for WETH->ETH single asset looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const amount = '100000';

    const tx = instance.loopETHTxBuilder.generateTxData({
      user,
      reserve: WETH,
      numLoops,
      amount,
      targetHealthFactor,
      unwrap: true,
    });

    const expectedTxData =
      WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
        'loopExitETHSingleAsset',
        [
          {
            targetHealthFactor,
            onBehalfOf: user,
            numLoops,
            initialAmount: amount,
          },
        ],
      );

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for ETH->ETH single asset looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WETH_GATEWAY: WETH_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const amount = '100000';

    const tx = instance.loopETHTxBuilder.generateTxData({
      user,
      reserve: API_ETH_MOCK_ADDRESS,
      numLoops,
      amount,
      targetHealthFactor,
      unwrap: true,
    });

    const expectedTxData =
      WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
        'loopETHSingleAsset',
        [
          {
            targetHealthFactor,
            onBehalfOf: user,
            numLoops,
          },
        ],
      );

    expect(tx.data).toEqual(expectedTxData);
    expect(tx.value).toEqual(BigNumber.from(amount));
  });
});
