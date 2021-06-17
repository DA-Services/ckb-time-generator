import config from '../config'
import { toHex } from '../utils/hex'
import {
  generateIndexStateOutput,
  generateInfoOutput,
  getLatestBlockNumber,
  getLatestTimestamp,
  getIndexStateCell,
  getInfoCell, collectInputs,
} from './helper'
import { ckb, FEE, NUMERAL_CELL_CAPACITY } from '../utils/const'
import { getCells} from './rpc'
import { NumeralInfo } from '../model/time_info'

export async function updateCell (numeralData: BigInt) {
  const {indexStateCell, indexState} = await getIndexStateCell()

  const nextIndexState = indexState.increaseIndex()

  const {infoCell: nextInfoCell} = await getInfoCell(nextIndexState.getIndex())
  const liveCells = await getCells(config.PayersLockScript, 'lock', {output_data_len_range: ['0x0', '0x1']})

  const latestTimeStamp = await getLatestTimestamp()
  const latestBlockNumber = await getLatestBlockNumber()

  const needCapacity = (nextInfoCell ? BigInt(0) : NUMERAL_CELL_CAPACITY) + FEE

  const {inputs, capacity} = collectInputs(liveCells, needCapacity, '0x0')

  inputs.push({
    previousOutput: {
      txHash: indexStateCell.out_point.tx_hash,
      index: indexStateCell.out_point.index,
    },
    since: '0x0',
  })

  if (nextInfoCell) {
    inputs.push({
      previousOutput: {
        txHash: nextInfoCell.out_point.tx_hash,
        index: nextInfoCell.out_point.index,
      },
      since: config.since(latestTimeStamp, latestBlockNumber),
    })
  }

  let outputs = [
    await generateIndexStateOutput(indexStateCell.output.type.args),
    await generateInfoOutput(indexStateCell.output.type.args),
  ]

  if (capacity > needCapacity) {
    outputs.push({
      capacity: toHex(capacity - needCapacity),
      lock: config.PayersLockScript,
      type: undefined, // todo: what should be filled here?
    })
  }

  const nextIndex = nextIndexState.getIndex()
  const nextNumeralInfo = new NumeralInfo(nextIndex, numeralData)
  let cellDeps = [config.AlwaysSuccessDep, config.IndexStateDep, config.InfoDep]

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: [nextIndexState.toString(), nextNumeralInfo.toString(), '0x'],
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, _i) => '0x')
  // @ts-ignore
  const txHash = await ckb.rpc.sendTransaction(rawTx)
  console.log(`Update numeral cell tx hash: ${txHash} nextNumeralInfo: ${nextNumeralInfo.toString()}`)
}
