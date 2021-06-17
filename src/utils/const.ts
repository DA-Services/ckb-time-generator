import CKB from '@nervosnetwork/ckb-sdk-core'
import config from '../config'

export const ckb = new CKB(config.CKB_NODE_RPC)
export const FEE = BigInt(1000)
export const NUMERAL_CELL_CAPACITY = BigInt(400) * BigInt(100000000)
