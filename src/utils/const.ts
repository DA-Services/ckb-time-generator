export const FEE = BigInt(1000)
export const INFO_CELL_CAPACITY = BigInt(400) * BigInt(100000000)
export const SUM_OF_INFO_CELLS = 12 // 36 info cells, we can add more if necessary
export enum INFO_DATA_TYPE {
  arbitrage = 0,
  timestamp = 1,
  blocknumber = 2,
}

export const TIME_1_M = 60 * 1000;
export const TIME_30_S = 30 * 1000;
export const TIME_5_S = 5 * 1000;
