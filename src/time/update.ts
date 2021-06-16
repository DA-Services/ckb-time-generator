const { generateTimeIndexStateOutput, generateTimeInfoOutput, getLatestBlockNumber, getLatestTimestamp } = require('./helper')
const { ckb, FEE, TIME_CELL_CAPACITY } = require('../utils/const')
const { getCells, collectInputs } = require('./rpc')
const {
  AlwaysSuccessLockScript,
  AlwaysSuccessDep,
  TimestampIndexStateDep,
  TimestampInfoDep,
  BlockNumberIndexStateDep,
  BlockNumberInfoDep,
} = require('../utils/config')
const { TimestampInfo, BlockNumberInfo } = require('../model/time_info')
const { getTimeIndexStateCell, getTimeInfoCell, generateTimestampInfoSince, generateBlockNumberInfoSince } = require('./helper')

const updateTimeCell = async isTimestamp => {
  const { timeIndexStateCell, timeIndexState } = await getTimeIndexStateCell(isTimestamp)
  const nextTimeIndexState = timeIndexState.increaseIndex()

  const { timeInfoCell: nextTimeInfoCell } = await getTimeInfoCell(nextTimeIndexState.getTimeIndex(), isTimestamp)

  const liveCells = await getCells(AlwaysSuccessLockScript, 'lock', { output_data_len_range: ['0x0', '0x1'] })

  const needCapacity = (nextTimeInfoCell ? BigInt(0) : TIME_CELL_CAPACITY) + FEE
  const { inputs, capacity } = collectInputs(liveCells, needCapacity, '0x0')
  const nextTimestamp = await getLatestTimestamp()
  const nextBlockNumber = await getLatestBlockNumber()

  inputs.push({
    previousOutput: {
      txHash: timeIndexStateCell.out_point.tx_hash,
      index: timeIndexStateCell.out_point.index,
    },
    since: '0x0',
  })
  if (nextTimeInfoCell) {
    inputs.push({
      previousOutput: {
        txHash: nextTimeInfoCell.out_point.tx_hash,
        index: nextTimeInfoCell.out_point.index,
      },
      since: isTimestamp ? generateTimestampInfoSince(nextTimestamp) : generateBlockNumberInfoSince(nextBlockNumber),
    })
  }

  let outputs = [
    await generateTimeIndexStateOutput(timeIndexStateCell.output.type.args, isTimestamp),
    await generateTimeInfoOutput(timeIndexStateCell.output.type.args, isTimestamp),
  ]

  if (capacity > needCapacity) {
    outputs.push({
      capacity: `0x${(capacity - needCapacity).toString(16)}`,
      lock: AlwaysSuccessLockScript,
    })
  }

  const nextTimeIndex = nextTimeIndexState.getTimeIndex()
  const nextTimeInfo = isTimestamp ? new TimestampInfo(nextTimeIndex, nextTimestamp) : new BlockNumberInfo(nextTimeIndex, nextBlockNumber)
  let cellDeps = [AlwaysSuccessDep]
  if (isTimestamp) {
    cellDeps = cellDeps.concat([TimestampIndexStateDep, TimestampInfoDep])
  } else {
    cellDeps = cellDeps.concat([BlockNumberIndexStateDep, BlockNumberInfoDep])
  }
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
  console.log(`Update time cell tx hash: ${txHash} nextTimeInfo: ${nextTimeInfo.toString()}`)
}

module.exports = {
  updateTimeCell,
}
