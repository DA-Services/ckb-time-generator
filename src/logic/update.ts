import { inspect } from 'util'
import { EMPTY_WITNESS_ARGS } from '@nervosnetwork/ckb-sdk-utils/lib/const'
import config from '../config'
import { InfoModel } from '../model/info_model'
import { FEE, INFO_CELL_CAPACITY } from '../utils/const'
import {
  collectInputs, generateIndexStateOutput,
  generateInfoOutput,
  getIndexStateCell,
  getInfoCell,
} from '../utils/helper'
import { toHex } from '../utils/hex'
import { ckb, getCells, getLatestBlockNumber, getLatestTimestamp } from '../utils/rpc'

export type SinceFunc = (timestamp: BigInt, blockNumber: BigInt) => string

export async function updateInfoAndIndexStateCell (infoData: BigInt, since?: SinceFunc): Promise<string> {
  console.log('update: Try to update index and info cells ...')

  const { indexStateCell, indexState } = await getIndexStateCell()
  console.log('update: indexState:', indexState)

  const newIndexState = indexState.increaseIndex()

  const latestTimeStamp = await getLatestTimestamp()
  const latestBlockNumber = await getLatestBlockNumber()

  const { infoCell } = await getInfoCell(newIndexState.getIndex())
  const needCapacity = (infoCell ? BigInt(0) : INFO_CELL_CAPACITY) + FEE
  const liveCells = await getCells(config.PayersLockScript, 'lock', {output_data_len_range: ['0x0', '0x1']})
  const { inputs, capacity: inputCapacity } = collectInputs(liveCells, needCapacity, '0x0')
  // console.log('update: Find inputs: ', inputs)

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

  const outputsData = [
    newIndexState.toString(),
    new InfoModel(newIndexState.getIndex(), config.infoDataType, infoData).toString()
  ]

  let typeName = config.infoDataType === 2 ? 'block number' : (config.infoDataType === 1 ? 'timestamp' : 'quote')
  console.log(`update: Update ${typeName}, IndexStateCell ${indexState.getIndex()} -> ${newIndexState.getIndex()}, InfoCell -> ${infoData} ${outputsData[1]}`)

  if (inputCapacity > needCapacity) {
    outputs.push({
      capacity: toHex(inputCapacity - needCapacity),
      lock: config.PayersLockScript,
      type: undefined,
    })

    outputsData.push('0x')
  }


  const rawTx = {
    version: '0x0',
    cellDeps: config.CellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: outputsData,
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, _i) => EMPTY_WITNESS_ARGS)

  await ckb.loadDeps()
  const signedRawTx = ckb.signTransaction(config.PayersPrivateKey)(rawTx)
  // console.log('signedRawTx:', inspect(signedRawTx, { depth: 3 }))

  try {
    const txHash = await ckb.rpc.sendTransaction(signedRawTx)
    console.log(`update: Push transaction, tx hash:`, txHash)
    return txHash
  } catch (e) {
    console.error('update: Send transaction failed:', e.message)
    throw e
  }
}
