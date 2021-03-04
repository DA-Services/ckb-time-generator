const CKB = require('@nervosnetwork/ckb-sdk-core').default
const {
  CKB_NODE_RPC,
  TimeIndexStateTypeScript,
  TimeInfoTypeScript,
  AlwaysSuccessLockScript,
} = require('../utils/config')

const ckb = new CKB(CKB_NODE_RPC)
const FEE = BigInt(1000)
const TIME_CELL_CAPACITY = BigInt(400) * BigInt(100000000)

const timeIndexStateTypeScript = args => {
  return {
    ...TimeIndexStateTypeScript,
    args,
  }
}

const timeInfoTypeScript = args => {
  return {
    ...TimeInfoTypeScript,
    args,
  }
}

const getLatestBlockNumber = async () => {
  const { number } = await ckb.rpc.getTipHeader()
  return parseInt(number)
}

const getLatestTimestamp = async () => {
  const tipBlockNumber = await getLatestBlockNumber()
  //The median block time calculated from the past 37 blocks timestamp
  const { timestamp } = await ckb.rpc.getHeaderByNumber(BigInt(tipBlockNumber - 18))
  return Math.floor(parseInt(timestamp) / 1000)
}

const generateTimeIndexStateOutput = async args => {
  return {
    capacity: `0x${TIME_CELL_CAPACITY.toString(16)}`,
    lock: AlwaysSuccessLockScript,
    type: timeIndexStateTypeScript(args),
  }
}

const generateTimeInfoOutput = async args => {
  return {
    capacity: `0x${TIME_CELL_CAPACITY.toString(16)}`,
    lock: AlwaysSuccessLockScript,
    type: timeInfoTypeScript(args),
  }
}

module.exports = {
  ckb,
  FEE,
  TIME_CELL_CAPACITY,
  getLatestBlockNumber,
  getLatestTimestamp,
  timeIndexStateTypeScript,
  timeInfoTypeScript,
  generateTimeIndexStateOutput,
  generateTimeInfoOutput,
}
