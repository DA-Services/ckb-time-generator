import config from '../config'
import { InfoModel } from '../model/info_model'
import { FEE, INFO_CELL_CAPACITY } from '../utils/const'
import {
  collectInputs,
  generateIndexStateOutput,
  generateInfoOutput,
  getIndexStateCell,
  getInfoCell,
} from '../utils/helper'
import { toHex } from '../utils/hex'
import { ckb, getCells, getLatestBlockNumber, getLatestTimestamp } from '../utils/rpc'

export type SinceFunc = (timestamp: BigInt, blockNumber: BigInt) => string

export async function updateInfoAndIndexStateCell (infoData: BigInt, since?: SinceFunc) {
  const {indexStateCell, indexState} = await getIndexStateCell()

  const newIndexState = indexState.increaseIndex()
  const newIndex = newIndexState.getIndex()
  const newInfoModel = new InfoModel(newIndex, infoData)

  const {infoCell: infoCell} = await getInfoCell(newIndexState.getIndex())
  const liveCells = await getCells(config.PayersLockScript, 'lock', {output_data_len_range: ['0x0', '0x1']})

  const latestTimeStamp = await getLatestTimestamp()
  const latestBlockNumber = await getLatestBlockNumber()

  const needCapacity = (infoCell ? BigInt(0) : INFO_CELL_CAPACITY) + FEE

  const {inputs, capacity: inputCapacity} = collectInputs(liveCells, needCapacity, '0x0')

  // add input: indexStateCell
  inputs.push({
    previousOutput: {
      txHash: indexStateCell.out_point.tx_hash,
      index: indexStateCell.out_point.index,
    },
    since: '0x0',
  })

  // add input: infoCell
  if (infoCell) {
    inputs.push({
      previousOutput: {
        txHash: infoCell.out_point.tx_hash,
        index: infoCell.out_point.index,
      },
      since: (since && since(latestTimeStamp, latestBlockNumber)) || '0x0',
    })
  }

  const outputs = [
    await generateIndexStateOutput(indexStateCell.output.type.args),
    await generateInfoOutput(indexStateCell.output.type.args),
  ]

  const outputsData = [newIndexState.toString(), newInfoModel.toString()]

  if (inputCapacity > needCapacity) {
    outputs.push({
      capacity: toHex(inputCapacity - needCapacity),
      lock: config.PayersLockScript,
      type: undefined,
    })

    outputsData.push('0x')
  }

  let cellDeps = [config.AlwaysSuccessDep, config.IndexStateDep, config.InfoDep]

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: outputsData,
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, _i) => '0x')
  console.log(`Updating info cell, inputs count ${inputs.length}`)
  // @ts-ignore
  const txHash = await ckb.rpc.sendTransaction(rawTx)
  console.log(`Update info cell tx hash: ${txHash} infoData: ${newInfoModel.toString()}`)
}
