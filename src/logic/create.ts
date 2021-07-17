import { inspect } from 'util'
import { serializeOutPoint } from '@nervosnetwork/ckb-sdk-utils'
import { EMPTY_WITNESS_ARGS } from '@nervosnetwork/ckb-sdk-utils/lib/const'
import config from '../config'
import { IndexStateModel } from '../model/index_state_model'
import { InfoModel } from '../model/info_model'
import { FEE, INFO_CELL_CAPACITY, SUM_OF_INFO_CELLS } from '../utils/const'
import { collectInputs, generateIndexStateOutput, generateInfoOutput } from '../utils/helper'
import { toHex } from '../utils/hex'
import { ckb, getCells } from '../utils/rpc'

export async function createInfoAndIndexStateCells (initInfoData: BigInt): Promise<string> {
  console.log('create: Try to create index and info cells ...')

  const needCapacity = INFO_CELL_CAPACITY + INFO_CELL_CAPACITY + FEE
  const liveCells = await getCells(config.PayersLockScript, 'lock', { output_data_len_range: ['0x0', '0x1'] })
  const { inputs, capacity: inputCapacity } = collectInputs(liveCells, needCapacity, '0x0')
  // console.log('create: Find inputs: ', inputs)

  const typeArgs = serializeOutPoint(inputs[0].previousOutput)

  let outputs = [
    await generateIndexStateOutput(config.IndexStateTypeScript.args),
    await generateInfoOutput(config.IndexStateTypeScript.args),
  ]
  let outputsData = [
    new IndexStateModel(0).toString(),
    new InfoModel(0, config.infoDataType, initInfoData).toString(),
  ]

  // Change unused capacity.
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
  // console.log(`create: Generate signed transaction:`, inspect(signedRawTx, { depth: 3 }))

  try {
    const txHash = await ckb.rpc.sendTransaction(signedRawTx)
    console.info(`create: Push transaction, tx hash:`, txHash)
    return txHash
  } catch (e) {
    console.error('create: Send transaction failed:', e.message)
    if (e.message.search('"code":-301')) {
      return 'retry'
    } else {
      throw e
    }
  }
}
