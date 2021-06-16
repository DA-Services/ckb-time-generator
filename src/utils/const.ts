const CKB = require('@nervosnetwork/ckb-sdk-core').default
const { CKB_NODE_RPC } = require('./config')

const ckb = new CKB(CKB_NODE_RPC)
const FEE = BigInt(1000)
const TIME_CELL_CAPACITY = BigInt(400) * BigInt(100000000)

module.exports = {
  ckb,
  FEE,
  TIME_CELL_CAPACITY,
}
