const { serializeOutPoint } = require('@nervosnetwork/ckb-sdk-utils')
const {
  AlwaysSuccessDep,
  AlwaysSuccessLockScript,
  TimestampIndexStateDep,
  TimestampInfoDep,
  BlockNumberIndexStateDep,
  BlockNumberInfoDep,
} = require('../utils/config')
const { generateTimeIndexStateOutput, generateTimeInfoOutput, getLatestBlockNumber } = require('./helper')
const { ckb, FEE, TIME_CELL_CAPACITY } = require('../utils/const')
const { getCells, collectInputs } = require('./rpc')
const { TimeIndexState } = require('../model/time_index_state')
const { TimestampInfo, BlockNumberInfo } = require('../model/time_info')

const createTimeCell = async (isTimestamp = true) => {
  const liveCells = await getCells(AlwaysSuccessLockScript, 'lock', { output_data_len_range: ['0x0', '0x1'] })
  const needCapacity = TIME_CELL_CAPACITY + TIME_CELL_CAPACITY + FEE
  const { inputs, capacity: inputCapacity } = collectInputs(liveCells, needCapacity, '0x0')

  const typeArgs = serializeOutPoint(inputs[0].previousOutput)
  const timeIndexStateOutput = await generateTimeIndexStateOutput(typeArgs, isTimestamp)
  const timeInfoOutput = await generateTimeInfoOutput(typeArgs, isTimestamp)
  let outputs = [timeIndexStateOutput, timeInfoOutput]

  if (inputCapacity > needCapacity) {
    outputs.push({
      capacity: `0x${(inputCapacity - needCapacity).toString(16)}`,
      lock: AlwaysSuccessLockScript,
    })
  }

  const timeIndex = 0
  let timeInfoData = '0x'
  if (isTimestamp) {
    const timestamp = Math.floor(new Date().getTime() / 1000)
    timeInfoData = new TimestampInfo(timeIndex, timestamp).toString()
  } else {
    const tipBlockNumber = await getLatestBlockNumber()
    timeInfoData = new BlockNumberInfo(timeIndex, tipBlockNumber).toString()
  }

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
    outputsData: [new TimeIndexState(timeIndex).toString(), timeInfoData, '0x'],
  }
  rawTx.witnesses = rawTx.inputs.map((_, _i) => '0x')
  console.log(JSON.stringify(rawTx))
  const txHash = await ckb.rpc.sendTransaction(rawTx)
  console.info(`Creating time cell tx hash: ${txHash} timeInfoData: ${timeInfoData}`)
}

module.exports = {
  createTimeCell,
}
