const {
  TimestampIndexStateTypeScript,
  TimestampInfoTypeScript,
  BlockNumberIndexStateTypeScript,
  BlockNumberInfoTypeScript,
  AlwaysSuccessLockScript,
} = require('../utils/config')
const { ckb, TIME_CELL_CAPACITY } = require('../utils/const')
const { uint32ToBe, remove0x } = require('../utils/hex')
const { TimeIndexState } = require('../model/time_index_state')
const { TimestampInfo, BlockNumberInfo } = require('../model/time_info')
const { getCells } = require('./rpc')

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

const getTimeIndexStateCell = async isTimestamp => {
  const timeIndexStateCells = await getCells(isTimestamp ? TimestampIndexStateTypeScript : BlockNumberIndexStateTypeScript, 'type')
  if (!timeIndexStateCells || timeIndexStateCells.length === 0) {
    return {
      timeIndexStateCell: null,
      timeIndexState: null,
    }
  }
  if (timeIndexStateCells.length > 1) {
    console.error('The amount of time index state cell is bigger than 1')
  }
  const timeIndexStateCell = timeIndexStateCells[0]
  const timeIndexState = TimeIndexState.fromData(timeIndexStateCell.output_data)
  return { timeIndexStateCell, timeIndexState }
}

const getTimeInfoCell = async (timeIndex, isTimestamp) => {
  let timeInfoCells = await getCells(isTimestamp ? TimestampInfoTypeScript : BlockNumberInfoTypeScript, 'type')
  if (!timeInfoCells || timeInfoCells.length === 0) {
    return { timeInfoCell: null, timeInfo: null }
  }
  const infoCells = timeInfoCells.filter(cell => parseInt(remove0x(cell.output_data).slice(0, 2), 16) === timeIndex)
  if (infoCells.length === 0) {
    return { timeInfoCell: null, timeInfo: null }
  }
  const timeInfoCell = infoCells[0]
  const timeInfo = isTimestamp ? TimestampInfo.fromData(timeInfoCell.output_data) : BlockNumberInfo.fromData(timeInfoCell.output_data)
  return { timeInfoCell, timeInfo }
}

const generateTimestampInfoSince = timestamp => {
  return `0x40000000${uint32ToBe(timestamp)}`
}

const generateBlockNumberInfoSince = blockNumber => {
  return `0x${blockNumber.toString(16)}`
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
  getTimeIndexStateCell,
  getTimeInfoCell,
  generateTimestampInfoSince,
  generateBlockNumberInfoSince,
}
