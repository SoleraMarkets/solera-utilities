import { utils } from 'ethers';
import { NELIXIR, NRWA, WPLUME, NYIELD, NTBILL, PUSD } from './tokens';

export const SINGLE_HOP_POOLS = [
  {
    tokenA: NRWA,
    tokenB: WPLUME,
    poolAddress: '0x4A7DB1628e23881890079C43deFA9dC96d7008B0',
  },
  {
    tokenA: NELIXIR,
    tokenB: WPLUME,
    poolAddress: '0x10B02Da17F82F263252C6Ac9E2f785Cb9fE4d544',
  },
  {
    tokenA: NYIELD,
    tokenB: WPLUME,
    poolAddress: '0x20462dA42BA8D773138D417C42F116Ba77DDe908',
  },
  {
    tokenA: NTBILL,
    tokenB: WPLUME,
    poolAddress: '0x098Dbf700286109e3BcD1465F00A6554488Ec148',
  },
  {
    tokenA: PUSD,
    tokenB: WPLUME,
    poolAddress: '0x4A14398C5c5B4B7913954cB82521fB7afA676314',
  },
  {
    tokenA: NRWA,
    tokenB: PUSD,
    poolAddress: '0x2fB3f735f685a9d8c0Ffc35912E4aCb1796752AD',
  },
  {
    tokenA: NELIXIR,
    tokenB: PUSD,
    poolAddress: '0x8872127381209fd106E48666B2EcAD4A151C9EA9',
  },
  {
    tokenA: NYIELD,
    tokenB: PUSD,
    poolAddress: '0x45D5e8eB57b2079A615Bd9fB6A6ec574b3749826',
  },
  {
    tokenA: PUSD,
    tokenB: NTBILL,
    poolAddress: '0xB1Ac405847eaA909a67a7e5d67D61115303F6Fa0',
  },
];

// MULTI HOP POOLS
export const MULTI_HOP_POOLS = [
  {
    tokenA: NRWA,
    tokenB: NELIXIR,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x2fB3f735f685a9d8c0Ffc35912E4aCb1796752AD',
        true,
        '0x8696Fd163c619d4323B257F8CAc51Fe92eF769D2',
        false,
      ],
    ),
  },
  // Adding the rest from maverickMultiSwap
  {
    tokenA: NELIXIR,
    tokenB: NRWA,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x8696Fd163c619d4323B257F8CAc51Fe92eF769D2',
        true,
        '0x2fB3f735f685a9d8c0Ffc35912E4aCb1796752AD',
        false,
      ],
    ),
  },
  {
    tokenA: NRWA,
    tokenB: NTBILL,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x2fB3f735f685a9d8c0Ffc35912E4aCb1796752AD',
        true,
        '0x4b127c92456C76dB6089274312988eCB00104641',
        true,
      ],
    ),
  },
  {
    tokenA: NTBILL,
    tokenB: NRWA,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x4b127c92456C76dB6089274312988eCB00104641',
        false,
        '0x2fB3f735f685a9d8c0Ffc35912E4aCb1796752AD',
        false,
      ],
    ),
  },
  {
    tokenA: NELIXIR,
    tokenB: NYIELD,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x8872127381209fd106E48666B2EcAD4A151C9EA9',
        true,
        '0x45D5e8eB57b2079A615Bd9fB6A6ec574b3749826',
        false,
      ],
    ),
  },
  {
    tokenA: NYIELD,
    tokenB: NELIXIR,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x45D5e8eB57b2079A615Bd9fB6A6ec574b3749826',
        true,
        '0x8872127381209fd106E48666B2EcAD4A151C9EA9',
        false,
      ],
    ),
  },
  {
    tokenA: NELIXIR,
    tokenB: NTBILL,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x8872127381209fd106E48666B2EcAD4A151C9EA9',
        true,
        '0xB1Ac405847eaA909a67a7e5d67D61115303F6Fa0',
        true,
      ],
    ),
  },
  {
    tokenA: NTBILL,
    tokenB: NELIXIR,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0xB1Ac405847eaA909a67a7e5d67D61115303F6Fa0',
        false,
        '0x8872127381209fd106E48666B2EcAD4A151C9EA9',
        false,
      ],
    ),
  },
  {
    tokenA: NYIELD,
    tokenB: NTBILL,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0x45D5e8eB57b2079A615Bd9fB6A6ec574b3749826',
        true,
        '0xB1Ac405847eaA909a67a7e5d67D61115303F6Fa0',
        true,
      ],
    ),
  },
  {
    tokenA: NTBILL,
    tokenB: NYIELD,
    path: encodePath(
      ['address', 'bool', 'address', 'bool'],
      [
        '0xB1Ac405847eaA909a67a7e5d67D61115303F6Fa0',
        false,
        '0x45D5e8eB57b2079A615Bd9fB6A6ec574b3749826',
        false,
      ],
    ),
  },
];

// Helper function to encode path
function encodePath(types: string[], values: unknown[]) {
  return utils.solidityPack(types, values);
}

// Add a helper function to find pools
export function findSingleHopPool(tokenA: string, tokenB: string) {
  return SINGLE_HOP_POOLS.find(
    pool =>
      (pool.tokenA.toLowerCase() === tokenA.toLowerCase() &&
        pool.tokenB.toLowerCase() === tokenB.toLowerCase()) ||
      (pool.tokenA.toLowerCase() === tokenB.toLowerCase() &&
        pool.tokenB.toLowerCase() === tokenA.toLowerCase()),
  );
}

export function findMultiHopPool(tokenA: string, tokenB: string) {
  return MULTI_HOP_POOLS.find(
    pool =>
      pool.tokenA.toLowerCase() === tokenA.toLowerCase() &&
      pool.tokenB.toLowerCase() === tokenB.toLowerCase(),
  );
}

// Special case for NRWA pool
export const NRWA_HANDLER = {
  tokenA: NRWA,
  tokenB: PUSD,
};
