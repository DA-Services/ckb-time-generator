const CKB = require('@nervosnetwork/ckb-sdk-core').default
const { CKB_NODE_RPC } = require('./config')

export const ckb = new CKB(CKB_NODE_RPC)
export const FEE = BigInt(1000)
export const TIME_CELL_CAPACITY = BigInt(400) * BigInt(100000000)

export default {
  ckb,
  FEE,
  TIME_CELL_CAPACITY,
}
