const { getLatestTimestamp, ckb, FEE, generateTimeInfoOutput, generateTimeIndexStateOutput } = require('./helper')
const { getCells, collectInputs } = require('./rpc')
const {
  AlwaysSuccessLockScript,
  AlwaysSuccessDep,
  TimeIndexStateDep,
  TimeIndexStateTypeScript,
  TimeInfoDep,
  TimeInfoTypeScript,
} = require('../utils/config')
const { TimeIndexState } = require('../model/time_index_state')
const { TimeInfo } = require('../model/time_info')
const { uin32ToBe, remove0x } = require('../utils/hex')

const getTimeIndexStateCell = async () => {
  const timeIndexStateCells = await getCells(TimeIndexStateTypeScript, 'type')
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

const getTimeInfoCell = async timeIndex => {
  let timeInfoCells = await getCells(TimeInfoTypeScript, 'type')
  if (!timeInfoCells || timeInfoCells.length === 0) {
    return { timeInfoCell: null, timeInfo: null }
  }
  const infoCells = timeInfoCells.filter(cell => parseInt(remove0x(cell.output_data).slice(0, 2)) === timeIndex)
  if (infoCells.length === 0) {
    throw new Error('Time info cell does not exist')
  }
  const timeInfoCell = infoCells[0]
  const timeInfo = TimeInfo.fromData(timeInfoCell.output_data)
  return { timeInfoCell, timeInfo }
}

const generateTimeInfoSince = timestamp => {
  return `0x40000000${uin32ToBe(timestamp)}`
}

const updateTimeCell = async () => {
  const { timeIndexStateCell, timeIndexState } = await getTimeIndexStateCell()
  const nextTimeIndexState = timeIndexState.increaseIndex()

  const { timeInfoCell: preTimeInfoCell } = await getTimeInfoCell(nextTimeIndexState.getTimeIndex())

  const timeIndexStateCapacity = BigInt(parseInt(timeIndexStateCell.output.capacity.substr(2), 16))

  const timeInfoCapacity = preTimeInfoCell
    ? BigInt(parseInt(preTimeInfoCell.output.capacity.substr(2), 16))
    : TIME_INFO_CELL_CAPACITY

  const liveCells = await getCells(AlwaysSuccessLockScript, 'lock')
  const needCapacity = (preTimeInfoCell ? BigInt(0) : TIME_INFO_CELL_CAPACITY) + FEE
  const { inputs, capacity } = collectInputs(liveCells, needCapacity, '0x0')
  const nextTimestamp = await getLatestTimestamp()

  inputs.push({
    previousOutput: {
      txHash: timeIndexStateCell.out_point.tx_hash,
      index: timeIndexStateCell.out_point.index,
    },
    since: '0x0',
  })
  if (preTimeInfoCell) {
    inputs.push({
      previousOutput: {
        txHash: preTimeInfoCell.out_point.tx_hash,
        index: preTimeInfoCell.out_point.index,
      },
      since: generateTimeInfoSince(nextTimestamp),
    })
  }
  let outputs = [
    await generateTimeIndexStateOutput(timeIndexStateCell.output.type.args, timeIndexStateCapacity),
    await generateTimeInfoOutput(timeIndexStateCell.output.type.args, timeInfoCapacity),
  ]

  if (capacity > needCapacity) {
    outputs.push({
      capacity: `0x${(capacity - needCapacity).toString(16)}`,
      lock: AlwaysSuccessLockScript,
    })
  }

  const nextTimeInfo = new TimeInfo(nextTimestamp, nextTimeIndexState.getTimeIndex())
  const cellDeps = [AlwaysSuccessDep, TimeIndexStateDep, TimeInfoDep]
  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: [nextTimeIndexState.toString(), nextTimeInfo.toString(), '0x'],
  }
  rawTx.witnesses = rawTx.inputs.map((_, _i) => '0x')
  const txHash = await ckb.rpc.sendTransaction(rawTx)
  console.log(`Update time cell tx hash:${txHash} timeIndex:${nextTimeInfo.getTimeIndex()} timestamp:${nextTimestamp}`)
}

module.exports = {
  getTimeIndexStateCell,
  getTimeInfoCell,
  updateTimeCell,
}
