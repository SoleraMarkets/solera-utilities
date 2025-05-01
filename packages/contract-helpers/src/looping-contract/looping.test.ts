import { BigNumber, providers, utils } from 'ethers';
import { API_ETH_MOCK_ADDRESS } from '../commons/utils';
import { WrappedTokenGatewayV3__factory } from '../v3-wethgateway-contract/typechain/factories/WrappedTokenGatewayV3__factory';
import { WPLUME, PUSD, NRWA, NELIXIR, NTBILL } from './tokens';
import { Looping__factory } from './typechain/factories';
import { LoopingService } from './index';

describe('LoopingService', () => {
  const provider = new providers.JsonRpcProvider();

  const LOOPING_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000001';
  const POOL_ADDRESS = '0x0000000000000000000000000000000000000002';
  const WRAPPED_GATEWAY_ADDRESS = '0x0000000000000000000000000000000000000003';
  const user = '0x0000000000000000000000000000000000000004';

  it('Expects to generate tx data for WPLUME -> PUSD', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const minAmountSupplied = '0';
    const amount = '100000';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: WPLUME,
      borrowReserve: PUSD,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const expectedTxData =
      Looping__factory.createInterface().encodeFunctionData('loopSingleSwap', [
        {
          supplyToken: WPLUME,
          targetHealthFactor,
          onBehalfOf: user,
          borrowToken: PUSD,
          numLoops,
          minAmountSupplied,
          initialAmount: amount,
          maverickPool: '0x4A14398C5c5B4B7913954cB82521fB7afA676314',
          isSupplyTokenA: false,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for NRWA->PUSD looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const minAmountSupplied = '0';
    const amount = '100000';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: NRWA,
      borrowReserve: PUSD,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const expectedTxData =
      Looping__factory.createInterface().encodeFunctionData('loopNRWA', [
        {
          targetHealthFactor,
          onBehalfOf: user,
          numLoops,
          initialAmount: amount,
          minAmountSupplied,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for NRWA->ETH looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const minAmountSupplied = '0';
    const amount = '100000';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: NRWA,
      borrowReserve: API_ETH_MOCK_ADDRESS,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const expectedTxData =
      WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
        'loopExitPLUMESingleSwap',
        [
          {
            onBehalfOf: user,
            numLoops,
            targetHealthFactor,
            isSupplyTokenA: true,
            supplyToken: NRWA,
            maverickPool: '0x4A7DB1628e23881890079C43deFA9dC96d7008B0',
            minAmountSupplied,
            initialAmount: amount,
          },
        ],
      );

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for NRWA -> NELIXIR', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const minAmountSupplied = '0';
    const amount = '100000';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: NRWA,
      borrowReserve: NELIXIR,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const path = utils.solidityPack(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x8696Fd163c619d4323B257F8CAc51Fe92eF769D2',
        true,
        '0x2fB3f735f685a9d8c0Ffc35912E4aCb1796752AD',
        false,
      ],
    );

    const expectedTxData =
      Looping__factory.createInterface().encodeFunctionData('loopMultiSwap', [
        {
          supplyToken: NRWA,
          targetHealthFactor,
          onBehalfOf: user,
          borrowToken: NELIXIR,
          numLoops,
          minAmountSupplied,
          initialAmount: amount,
          path,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for PUSD -> PUSD', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
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
      Looping__factory.createInterface().encodeFunctionData('loopSingleAsset', [
        {
          token: PUSD,
          targetHealthFactor,
          onBehalfOf: user,
          numLoops,
          initialAmount: amount,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for ETH->PUSD', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
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
        'loopEntryPLUMESingleSwap',
        [
          {
            onBehalfOf: user,
            numLoops,
            targetHealthFactor,
            isSupplyTokenA: false,
            borrowToken: PUSD,
            maverickPool: '0x4A14398C5c5B4B7913954cB82521fB7afA676314',
            minAmountSupplied,
          },
        ],
      );

    expect(tx.data).toEqual(expectedTxData);
    expect(tx.value).toEqual(BigNumber.from(amount));
  });

  // it('Expects to generate tx data for ETH->Token multi swap looping', () => {
  //   const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
  //     POOL: POOL_ADDRESS,
  //     WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
  //   });
  //   expect(instance instanceof LoopingService).toEqual(true);

  //   const targetHealthFactor = '12000';
  //   const numLoops = 2;
  //   const amount = '100000';
  //   const minAmountSupplied = '0';

  //   const tx = instance.loopSwapTxBuilder.generateTxData({
  //     user,
  //     supplyReserve: API_ETH_MOCK_ADDRESS.toLowerCase(),
  //     borrowReserve: NTBILL,
  //     numLoops,
  //     amount,
  //     targetHealthFactor,
  //     minAmountSupplied,
  //   });

  //   const path = utils.solidityPack(
  //     ['address', 'bool', 'address', 'bool'],
  //     [
  //       '0x483b035C21F77DeB6875f741C7cCb85f22F8E5C3',
  //       false,
  //       '0x92962AcCa4300791b0F5cFE2bfB3b6e62a852D83',
  //       false,
  //     ],
  //   );

  //   const expectedTxData =
  //     WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
  //       'loopEntryPLUMEMultiSwap',
  //       [
  //         {
  //           onBehalfOf: user,
  //           numLoops,
  //           targetHealthFactor,
  //           borrowToken: NTBILL,
  //           minAmountSupplied,
  //           path,
  //         },
  //       ],
  //     );

  //   expect(tx.data).toEqual(expectedTxData);
  //   expect(tx.value).toEqual(BigNumber.from(amount));
  // });

  it('Expects to generate tx data for ETH->WPLUME', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
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
        'loopEntryPLUMESingleAsset',
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

  it('Expects to generate tx data for PUSD->ETH', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
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
        'loopExitPLUMESingleSwap',
        [
          {
            onBehalfOf: user,
            numLoops,
            targetHealthFactor,
            isSupplyTokenA: true,
            supplyToken: PUSD,
            maverickPool: '0x4A14398C5c5B4B7913954cB82521fB7afA676314',
            minAmountSupplied,
            initialAmount: amount,
          },
        ],
      );

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for WPLUME->ETH', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const amount = '100000';

    const tx = instance.loopETHTxBuilder.generateTxData({
      user,
      reserve: WPLUME,
      numLoops,
      amount,
      targetHealthFactor,
      unwrap: true,
    });

    const expectedTxData =
      WrappedTokenGatewayV3__factory.createInterface().encodeFunctionData(
        'loopExitPLUMESingleAsset',
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

  it('Expects to generate tx data for ETH->ETH', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
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
        'loopPLUMESingleAsset',
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

  it('Expects to generate tx data for NTBILL -> PUSD', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const minAmountSupplied = '0';
    const amount = '100000';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: NTBILL,
      borrowReserve: PUSD,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const expectedTxData =
      Looping__factory.createInterface().encodeFunctionData('loopSingleSwap', [
        {
          supplyToken: NTBILL,
          targetHealthFactor,
          onBehalfOf: user,
          borrowToken: PUSD,
          numLoops,
          minAmountSupplied,
          initialAmount: amount,
          maverickPool: '0xB1Ac405847eaA909a67a7e5d67D61115303F6Fa0',
          isSupplyTokenA: false,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for NTBILL -> NELIXIR', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const minAmountSupplied = '0';
    const amount = '100000';

    const tx = instance.loopSwapTxBuilder.generateTxData({
      user,
      supplyReserve: NTBILL,
      borrowReserve: NELIXIR,
      numLoops,
      amount,
      targetHealthFactor,
      minAmountSupplied,
    });

    const path = utils.solidityPack(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x8872127381209fd106E48666B2EcAD4A151C9EA9',
        true,
        '0xB1Ac405847eaA909a67a7e5d67D61115303F6Fa0',
        true,
      ],
    );

    const expectedTxData =
      Looping__factory.createInterface().encodeFunctionData('loopMultiSwap', [
        {
          supplyToken: NTBILL,
          targetHealthFactor,
          onBehalfOf: user,
          borrowToken: NELIXIR,
          numLoops,
          minAmountSupplied,
          initialAmount: amount,
          path,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for NELIXIR -> PUSD single asset looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const amount = '100000';

    const tx = instance.loopSingleAssetTxBuilder.generateTxData({
      user,
      reserve: NELIXIR,
      numLoops,
      amount,
      targetHealthFactor,
    });

    const expectedTxData =
      Looping__factory.createInterface().encodeFunctionData('loopSingleAsset', [
        {
          token: NELIXIR,
          targetHealthFactor,
          onBehalfOf: user,
          numLoops,
          initialAmount: amount,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });

  it('Expects to generate tx data for NTBILL -> PUSD single asset looping', () => {
    const instance = new LoopingService(provider, LOOPING_CONTRACT_ADDRESS, {
      POOL: POOL_ADDRESS,
      WRAPPED_TOKEN_GATEWAY: WRAPPED_GATEWAY_ADDRESS,
    });
    expect(instance instanceof LoopingService).toEqual(true);

    const targetHealthFactor = '12000';
    const numLoops = 2;
    const amount = '100000';

    const tx = instance.loopSingleAssetTxBuilder.generateTxData({
      user,
      reserve: NTBILL,
      numLoops,
      amount,
      targetHealthFactor,
    });

    const expectedTxData =
      Looping__factory.createInterface().encodeFunctionData('loopSingleAsset', [
        {
          token: NTBILL,
          targetHealthFactor,
          onBehalfOf: user,
          numLoops,
          initialAmount: amount,
        },
      ]);

    expect(tx.data).toEqual(expectedTxData);
  });
});
