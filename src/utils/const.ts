export const FEE = BigInt(1000)
export const INFO_CELL_CAPACITY = BigInt(400) * BigInt(100000000)
export const SUM_OF_INFO_CELLS = 12 // 36 info cells, we can add more if necessary
export enum INFO_DATA_TYPE {
  arbitrage = 0,
  timestamp = 1,
  blocknumber = 2,
}
