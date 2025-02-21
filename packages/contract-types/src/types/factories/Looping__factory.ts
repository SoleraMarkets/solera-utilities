/* Autogenerated file. Do not edit manually. */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from 'ethers';
import type { Provider, TransactionRequest } from '@ethersproject/providers';
import type { Looping, LoopingInterface } from '../Looping';

const _abi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_aavePool',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_priceOracle',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_swapRouter',
        type: 'address',
        internalType: 'contract ISwapRouter',
      },
      {
        name: '_oracleDecimals',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'calculateBorrowAmount',
    inputs: [
      {
        name: 'supplyAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'supplyToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'borrowToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'ltv',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'targetHealthFactor',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculateBorrowAmountSingleAsset',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'ltv',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'targetHealthFactor',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'loopMultiSwap',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct LoopDataTypes.LoopMultiSwapParams',
        components: [
          {
            name: 'supplyToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'targetHealthFactor',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'borrowToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'numLoops',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'onBehalfOf',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'initialAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'minAmountSupplied',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'path',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'loopSingleAsset',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct LoopDataTypes.LoopSingleAssetParams',
        components: [
          {
            name: 'token',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'targetHealthFactor',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'onBehalfOf',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'numLoops',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'initialAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'loopSingleSwap',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct LoopDataTypes.LoopSingleSwapParams',
        components: [
          {
            name: 'supplyToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'targetHealthFactor',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'onBehalfOf',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'isSupplyTokenA',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'borrowToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'numLoops',
            type: 'uint16',
            internalType: 'uint16',
          },
          {
            name: 'maverickPool',
            type: 'address',
            internalType: 'contract IMaverickV2Pool',
          },
          {
            name: 'minAmountSupplied',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'initialAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidHealthFactor',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidLoops',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidTokens',
    inputs: [],
  },
  {
    type: 'error',
    name: 'MaxSlippageExceeded',
    inputs: [
      {
        name: 'amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'minAmountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
] as const;

const _bytecode =
  '0x610100604052348015610010575f80fd5b506040516121b13803806121b183398101604081905261002f9161006c565b60015f556001600160a01b0393841660805291831660a05290911660c05260e0526100bc565b6001600160a01b0381168114610069575f80fd5b50565b5f805f806080858703121561007f575f80fd5b845161008a81610055565b602086015190945061009b81610055565b60408601519093506100ac81610055565b6060959095015193969295505050565b60805160a05160c05160e05161202461018d5f395f50505f8181610f1301528181610fb10152818161106001528181611648015281816116e6015261179501525f8181610109015261019601525f8181610223015281816102e4015281816104bc015281816105cc015281816106670152818161070f015281816107f50152818161097501528181610ba501528181610c1301528181610cae01528181610d5601528181610e4c015281816112f60152818161136501528181611400015281816114a8015261158101526120245ff3fe608060405234801561000f575f80fd5b5060043610610055575f3560e01c8063327c047e146100595780637b809dee1461007f578063c886a5e8146100ad578063d5b6e490146100c0578063da529841146100d3575b5f80fd5b61006c610067366004611b99565b6100e6565b6040519081526020015b60405180910390f35b61009261008d366004611be7565b6103cf565b60408051938452602084019290925290820152606001610076565b61006c6100bb366004611bf7565b610952565b6100926100ce366004611c31565b610a74565b6100926100e1366004611c70565b6111c4565b60405163b3596f0760e01b81526001600160a01b0385811660048301525f9182917f0000000000000000000000000000000000000000000000000000000000000000169063b3596f0790602401602060405180830381865afa15801561014e573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906101729190611c81565b60405163b3596f0760e01b81526001600160a01b0387811660048301529192505f917f0000000000000000000000000000000000000000000000000000000000000000169063b3596f0790602401602060405180830381865afa1580156101db573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906101ff9190611c81565b60405163c44b11f760e01b81526001600160a01b0389811660048301529192505f917f0000000000000000000000000000000000000000000000000000000000000000169063c44b11f790602401602060405180830381865afa158015610268573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061028c9190611c98565b80519091505f9060301c60ff166102a490600a611dd8565b6102b690670de0b6b3a7640000611de3565b6102c0908b611e02565b60405163c44b11f760e01b81526001600160a01b038a811660048301529192505f917f0000000000000000000000000000000000000000000000000000000000000000169063c44b11f790602401602060405180830381865afa158015610329573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061034d9190611c98565b805190915060301c60ff165f61037d61036f6103688c611930565b8690611947565b6103788b611930565b61197d565b90505f61039361038d8984611947565b8861197d565b9050670de0b6b3a76400006103a984600a611dd8565b6103b39083611e02565b6103bd9190611de3565b9e9d5050505050505050505050505050565b5f805f60025f54036103fc5760405162461bcd60e51b81526004016103f390611e19565b60405180910390fd5b60025f908155608085013590036104265760405163162908e360e11b815260040160405180910390fd5b6104366080850160608601611e50565b61ffff165f036104595760405163204ec41160e21b815260040160405180910390fd5b61290461046c6040860160208701611e50565b61ffff1610806104905750614e2061048a6040860160208701611e50565b61ffff16115b156104ae5760405163185cfc6d60e11b815260040160405180910390fd5b5f61057f6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663c44b11f76104ee6020890189611e71565b6040516001600160e01b031960e084901b1681526001600160a01b039091166004820152602401602060405180830381865afa158015610530573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906105549190611c98565b5161ffff80821692601083901c821692602081901c831692603082901c60ff169260409290921c1690565b5092935050505060808501356105af33308361059e60208b018b611e71565b6001600160a01b03169291906119b2565b6105bc6020870187611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f6040518363ffffffff1660e01b8152600401610609929190611e8c565b6020604051808303815f875af1158015610625573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906106499190611eb2565b506106576020870187611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f196040518363ffffffff1660e01b81526004016106a5929190611e8c565b6020604051808303815f875af11580156106c1573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906106e59190611eb2565b505f805f5b6106fa60808a0160608b01611e50565b61ffff168110156108a4576001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663617ba03761074160208c018c611e71565b8661075260608e0160408f01611e71565b5f6040518563ffffffff1660e01b81526004016107729493929190611ecd565b5f604051808303815f87803b158015610789575f80fd5b505af115801561079b573d5f803e3d5ffd5b5050505083836107ab9190611efa565b92505f6107dc856107bf60208d018d611e71565b888d60200160208101906107d39190611e50565b61ffff16610952565b9050805f036107eb57506108a4565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663a415bcad61082760208d018d611e71565b8360025f8f604001602081019061083e9190611e71565b6040518663ffffffff1660e01b815260040161085e959493929190611f0d565b5f604051808303815f87803b158015610875575f80fd5b505af1158015610887573d5f803e3d5ffd5b5050505080836108979190611efa565b90945091506001016106ea565b505f6108b360208a018a611e71565b6040516370a0823160e01b81523060048201526001600160a01b0391909116906370a0823190602401602060405180830381865afa1580156108f7573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061091b9190611c81565b905061093f338261092f60208d018d611e71565b6001600160a01b03169190611a51565b60015f5591989097509095509350505050565b60405163c44b11f760e01b81526001600160a01b0384811660048301525f9182917f0000000000000000000000000000000000000000000000000000000000000000169063c44b11f790602401602060405180830381865afa1580156109ba573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906109de9190611c98565b80519091505f9060301c60ff166109f690600a611dd8565b610a0890670de0b6b3a7640000611de3565b610a129088611e02565b825190915060301c60ff165f610a3d610a34610a2d89611930565b8590611947565b61037888611930565b9050670de0b6b3a7640000610a5383600a611dd8565b610a5d9083611e02565b610a679190611de3565b9998505050505050505050565b5f805f60025f5403610a985760405162461bcd60e51b81526004016103f390611e19565b60025f90815560a08501359003610ac25760405163162908e360e11b815260040160405180910390fd5b610ad26080850160608601611e50565b61ffff165f03610af55760405163204ec41160e21b815260040160405180910390fd5b612904610b086040860160208701611e50565b61ffff161080610b2c5750614e20610b266040860160208701611e50565b61ffff16115b15610b4a5760405163185cfc6d60e11b815260040160405180910390fd5b610b5a6060850160408601611e71565b6001600160a01b0316610b706020860186611e71565b6001600160a01b031603610b97576040516333910aef60e11b815260040160405180910390fd5b5f610bd76001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663c44b11f76104ee6020890189611e71565b5092935050505060a0850135610bf633308361059e60208b018b611e71565b610c036020870187611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f6040518363ffffffff1660e01b8152600401610c50929190611e8c565b6020604051808303815f875af1158015610c6c573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610c909190611eb2565b50610c9e6020870187611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f196040518363ffffffff1660e01b8152600401610cec929190611e8c565b6020604051808303815f875af1158015610d08573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610d2c9190611eb2565b505f805f5b610d4160808a0160608b01611e50565b61ffff16811015611101576001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663617ba037610d8860208c018c611e71565b86610d9960a08e0160808f01611e71565b5f6040518563ffffffff1660e01b8152600401610db99493929190611ecd565b5f604051808303815f87803b158015610dd0575f80fd5b505af1158015610de2573d5f803e3d5ffd5b505050508383610df29190611efa565b92505f610e3385610e0660208d018d611e71565b610e1660608e0160408f01611e71565b898e6020016020810190610e2a9190611e50565b61ffff166100e6565b9050805f03610e425750611101565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663a415bcad610e8160608d0160408e01611e71565b8360025f8f6080016020810190610e989190611e71565b6040518663ffffffff1660e01b8152600401610eb8959493929190611f0d565b5f604051808303815f87803b158015610ecf575f80fd5b505af1158015610ee1573d5f803e3d5ffd5b505050508083610ef19190611efa565b9250610f0360608b0160408c01611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f6040518363ffffffff1660e01b8152600401610f50929190611e8c565b6020604051808303815f875af1158015610f6c573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610f909190611eb2565b50610fa160608b0160408c01611e71565b6001600160a01b031663095ea7b37f0000000000000000000000000000000000000000000000000000000000000000836040518363ffffffff1660e01b8152600401610fee929190611e8c565b6020604051808303815f875af115801561100a573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061102e9190611eb2565b50600161104160808c0160608d01611e50565b61104b9190611f41565b61ffff168210156110f8576001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663522ba7eb3061109360e08e018e611f63565b855f6040518663ffffffff1660e01b81526004016110b5959493929190611fad565b6020604051808303815f875af11580156110d1573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906110f59190611c81565b94505b50600101610d31565b508760c001358210156111345760405163593100b560e11b81526004810183905260c089013560248201526044016103f3565b5f61114560608a0160408b01611e71565b6040516370a0823160e01b81523060048201526001600160a01b0391909116906370a0823190602401602060405180830381865afa158015611189573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906111ad9190611c81565b905061093f338261092f60608d0160408e01611e71565b5f805f60025f54036111e85760405162461bcd60e51b81526004016103f390611e19565b60025f90815561010085013590036112135760405163162908e360e11b815260040160405180910390fd5b61122360c0850160a08601611e50565b61ffff165f036112465760405163204ec41160e21b815260040160405180910390fd5b6129046112596040860160208701611e50565b61ffff16108061127d5750614e206112776040860160208701611e50565b61ffff16115b1561129b5760405163185cfc6d60e11b815260040160405180910390fd5b6112ab60a0850160808601611e71565b6001600160a01b03166112c16020860186611e71565b6001600160a01b0316036112e8576040516333910aef60e11b815260040160405180910390fd5b5f6113286001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663c44b11f76104ee6020890189611e71565b5092935050505061010085013561134833308361059e60208b018b611e71565b6113556020870187611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f6040518363ffffffff1660e01b81526004016113a2929190611e8c565b6020604051808303815f875af11580156113be573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906113e29190611eb2565b506113f06020870187611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f196040518363ffffffff1660e01b815260040161143e929190611e8c565b6020604051808303815f875af115801561145a573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061147e9190611eb2565b505f805f5b61149360c08a0160a08b01611e50565b61ffff1681101561186d576001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663617ba0376114da60208c018c611e71565b866114eb60608e0160408f01611e71565b5f6040518563ffffffff1660e01b815260040161150b9493929190611ecd565b5f604051808303815f87803b158015611522575f80fd5b505af1158015611534573d5f803e3d5ffd5b5050505083836115449190611efa565b92505f6115688561155860208d018d611e71565b610e1660a08e0160808f01611e71565b9050805f03611577575061186d565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663a415bcad6115b660a08d0160808e01611e71565b8360025f8f60400160208101906115cd9190611e71565b6040518663ffffffff1660e01b81526004016115ed959493929190611f0d565b5f604051808303815f87803b158015611604575f80fd5b505af1158015611616573d5f803e3d5ffd5b5050505080836116269190611efa565b925061163860a08b0160808c01611e71565b6001600160a01b031663095ea7b37f00000000000000000000000000000000000000000000000000000000000000005f6040518363ffffffff1660e01b8152600401611685929190611e8c565b6020604051808303815f875af11580156116a1573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906116c59190611eb2565b506116d660a08b0160808c01611e71565b6001600160a01b031663095ea7b37f0000000000000000000000000000000000000000000000000000000000000000836040518363ffffffff1660e01b8152600401611723929190611e8c565b6020604051808303815f875af115801561173f573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117639190611eb2565b50600161177660c08c0160a08d01611e50565b6117809190611f41565b61ffff16821015611864576001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001663a3b105ca306117cb60e08e0160c08f01611e71565b8d60600160208101906117de9190611ffc565b6040516001600160e01b031960e086901b1681526001600160a01b039384166004820152929091166024830152156044820152606481018490525f608482015260a4016020604051808303815f875af115801561183d573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906118619190611c81565b94505b50600101611483565b508760e001358210156118a05760405163593100b560e11b81526004810183905260e089013560248201526044016103f3565b5f6118b160a08a0160808b01611e71565b6040516370a0823160e01b81523060048201526001600160a01b0391909116906370a0823190602401602060405180830381865afa1580156118f5573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906119199190611c81565b905061093f338261092f60a08d0160808e01611e71565b5f61194182655af3107a4000611e02565b92915050565b5f81156706f05b59d3b200001983900484111517611963575f80fd5b50670de0b6b3a764000091026706f05b59d3b20000010490565b5f8115670de0b6b3a76400006002840419048411171561199b575f80fd5b50670de0b6b3a76400009190910260028204010490565b6040516323b872dd60e01b8082526001600160a01b0385811660048401528416602483015260448201839052905f80606483828a5af16119f4573d5f803e3d5ffd5b506119fe85611adf565b611a4a5760405162461bcd60e51b815260206004820152601960248201527f475076323a206661696c6564207472616e7366657246726f6d0000000000000060448201526064016103f3565b5050505050565b60405163a9059cbb60e01b8082526001600160a01b038416600483015260248201839052905f8060448382895af1611a8b573d5f803e3d5ffd5b50611a9584611adf565b611ad95760405162461bcd60e51b815260206004820152601560248201527423a83b191d103330b4b632b2103a3930b739b332b960591b60448201526064016103f3565b50505050565b5f611b01565b62461bcd60e51b5f52602060045280602452508060445260645ffd5b3d8015611b405760208114611b7157611b3b7f475076323a206d616c666f726d6564207472616e7366657220726573756c7400601f611ae5565b611b7c565b823b611b6857611b687311d41d8c8e881b9bdd08184818dbdb9d1c9858dd60621b6014611ae5565b60019150611b7c565b3d5f803e5f51151591505b50919050565b6001600160a01b0381168114611b96575f80fd5b50565b5f805f805f60a08688031215611bad575f80fd5b853594506020860135611bbf81611b82565b93506040860135611bcf81611b82565b94979396509394606081013594506080013592915050565b5f60a08284031215611b7c575f80fd5b5f805f8060808587031215611c0a575f80fd5b843593506020850135611c1c81611b82565b93969395505050506040820135916060013590565b5f60208284031215611c41575f80fd5b813567ffffffffffffffff811115611c57575f80fd5b82016101008185031215611c69575f80fd5b9392505050565b5f6101208284031215611b7c575f80fd5b5f60208284031215611c91575f80fd5b5051919050565b5f60208284031215611ca8575f80fd5b6040516020810181811067ffffffffffffffff82111715611cd757634e487b7160e01b5f52604160045260245ffd5b6040529151825250919050565b634e487b7160e01b5f52601160045260245ffd5b600181815b80851115611d3257815f1904821115611d1857611d18611ce4565b80851615611d2557918102915b93841c9390800290611cfd565b509250929050565b5f82611d4857506001611941565b81611d5457505f611941565b8160018114611d6a5760028114611d7457611d90565b6001915050611941565b60ff841115611d8557611d85611ce4565b50506001821b611941565b5060208310610133831016604e8410600b8410161715611db3575081810a611941565b611dbd8383611cf8565b805f1904821115611dd057611dd0611ce4565b029392505050565b5f611c698383611d3a565b5f82611dfd57634e487b7160e01b5f52601260045260245ffd5b500490565b808202811582820484141761194157611941611ce4565b6020808252601f908201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c00604082015260600190565b5f60208284031215611e60575f80fd5b813561ffff81168114611c69575f80fd5b5f60208284031215611e81575f80fd5b8135611c6981611b82565b6001600160a01b03929092168252602082015260400190565b8015158114611b96575f80fd5b5f60208284031215611ec2575f80fd5b8151611c6981611ea5565b6001600160a01b03948516815260208101939093529216604082015261ffff909116606082015260800190565b8082018082111561194157611941611ce4565b6001600160a01b0395861681526020810194909452604084019290925261ffff166060830152909116608082015260a00190565b61ffff828116828216039080821115611f5c57611f5c611ce4565b5092915050565b5f808335601e19843603018112611f78575f80fd5b83018035915067ffffffffffffffff821115611f92575f80fd5b602001915036819003821315611fa6575f80fd5b9250929050565b6001600160a01b03861681526080602082018190528101849052838560a08301375f60a085830101525f60a0601f19601f87011683010190508360408301528260608301529695505050505050565b5f6020828403121561200c575f80fd5b8135611c6981611ea556fea164736f6c6343000819000a';

type LoopingConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: LoopingConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Looping__factory extends ContractFactory {
  constructor(...args: LoopingConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _aavePool: string,
    _priceOracle: string,
    _swapRouter: string,
    _oracleDecimals: BigNumberish,
    overrides?: Overrides & { from?: string },
  ): Promise<Looping> {
    return super.deploy(
      _aavePool,
      _priceOracle,
      _swapRouter,
      _oracleDecimals,
      overrides || {},
    ) as Promise<Looping>;
  }
  override getDeployTransaction(
    _aavePool: string,
    _priceOracle: string,
    _swapRouter: string,
    _oracleDecimals: BigNumberish,
    overrides?: Overrides & { from?: string },
  ): TransactionRequest {
    return super.getDeployTransaction(
      _aavePool,
      _priceOracle,
      _swapRouter,
      _oracleDecimals,
      overrides || {},
    );
  }
  override attach(address: string): Looping {
    return super.attach(address) as Looping;
  }
  override connect(signer: Signer): Looping__factory {
    return super.connect(signer) as Looping__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LoopingInterface {
    return new utils.Interface(_abi) as LoopingInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): Looping {
    return new Contract(address, _abi, signerOrProvider) as Looping;
  }
}
