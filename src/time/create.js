const { AlwaysSuccessDep, TimeIndexStateDep, TimeInfoDep, AlwaysSuccessLockScript } = require('../utils/config')
const { ckb, FEE, TIME_CELL_CAPACITY, generateTimeIndexStateOutput, generateTimeInfoOutput } = require('./helper')
const { getCells, collectInputs } = require('./rpc')
const { TimeIndexState } = require('../model/time_index_state')
const { serializeOutPoint } = require('@nervosnetwork/ckb-sdk-utils')
const { TimeInfo } = require('../model/time_info')

const createTimeCell = async () => {
  const liveCells = await getCells(AlwaysSuccessLockScript, 'lock')
  const needCapacity = TIME_CELL_CAPACITY + TIME_CELL_CAPACITY + FEE
  const { inputs, capacity: inputCapacity } = collectInputs(liveCells, needCapacity, '0x0')

  const typeArgs = serializeOutPoint(inputs[0].previousOutput)
  const timeIndexStateOutput = await generateTimeIndexStateOutput(typeArgs)
  const timeInfoOutput = await generateTimeInfoOutput(typeArgs)
  let outputs = [timeIndexStateOutput, timeInfoOutput]

  if (inputCapacity > needCapacity) {
    outputs.push({
      capacity: `0x${(inputCapacity - needCapacity).toString(16)}`,
      lock: AlwaysSuccessLockScript,
    })
  }

  const timeIndex = 0
  const timestamp = Math.floor(new Date().getTime() / 1000)

  const cellDeps = [AlwaysSuccessDep, TimeIndexStateDep, TimeInfoDep]
  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: [new TimeIndexState(timeIndex).toString(), new TimeInfo(timeIndex, timestamp).toString(), '0x'],
  }
  rawTx.witnesses = rawTx.inputs.map((_, _i) => '0x')
  const txHash = await ckb.rpc.sendTransaction(rawTx)
  console.info(`Creating time cell tx hash:${txHash} timeIndex:${timeIndex} timestamp:${timestamp}`)
}

module.exports = {
  createTimeCell,
}
