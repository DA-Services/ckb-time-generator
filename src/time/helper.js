const {
  TimestampIndexStateTypeScript,
  TimestampInfoTypeScript,
  BlockNumberIndexStateTypeScript,
  BlockNumberInfoTypeScript,
  AlwaysSuccessLockScript,
} = require('../utils/config')
const { ckb, TIME_CELL_CAPACITY } = require('../utils/const')

const timestampIndexStateTypeScript = args => {
  return {
    ...TimestampIndexStateTypeScript,
    args,
  }
}

const timestampInfoTypeScript = args => {
  return {
    ...TimestampInfoTypeScript,
    args,
  }
}

const blockNumberIndexStateTypeScript = args => {
  return {
    ...BlockNumberIndexStateTypeScript,
    args,
  }
}

const blockNumberInfoTypeScript = args => {
  return {
    ...BlockNumberInfoTypeScript,
    args,
  }
}

const getLatestBlockNumber = async () => {
  const number = await ckb.rpc.getTipBlockNumber()
  return BigInt(number)
}

const getLatestTimestamp = async () => {
  const tipBlockNumber = await getLatestBlockNumber()
  //The median block time calculated from the past 37 blocks timestamp
  const number = tipBlockNumber - BigInt(18)
  const { timestamp } = await ckb.rpc.getHeaderByNumber(number)
  return Math.floor(parseInt(timestamp) / 1000)
}

const generateTimeIndexStateOutput = async (args, isTimestamp) => {
  return {
    capacity: `0x${TIME_CELL_CAPACITY.toString(16)}`,
    lock: AlwaysSuccessLockScript,
    type: isTimestamp ? timestampIndexStateTypeScript(args) : blockNumberIndexStateTypeScript(args),
  }
}

const generateTimeInfoOutput = async (args, isTimestamp) => {
  return {
    capacity: `0x${TIME_CELL_CAPACITY.toString(16)}`,
    lock: AlwaysSuccessLockScript,
    type: isTimestamp ? timestampInfoTypeScript(args) : blockNumberInfoTypeScript(args),
  }
}

module.exports = {
  getLatestBlockNumber,
  getLatestTimestamp,
  timestampIndexStateTypeScript,
  timestampInfoTypeScript,
  blockNumberIndexStateTypeScript,
  blockNumberInfoTypeScript,
  generateTimeIndexStateOutput,
  generateTimeInfoOutput,
}
