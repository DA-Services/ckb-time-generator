import { serializeOutPoint } from '@nervosnetwork/ckb-sdk-utils'
import config from '../config'
import { IndexStateModel } from '../model/index_state_model'
import { InfoModel } from '../model/info_model'
import { FEE, INFO_CELL_CAPACITY } from '../utils/const'
import { collectInputs, generateIndexStateOutput, generateInfoOutput } from '../utils/helper'
import { toHex } from '../utils/hex'
import { ckb, getCells } from '../utils/rpc'

export async function createInfoAndIndexStateCells (initInfoData: BigInt) {
  const initIndex = 0
  const infoModel = new InfoModel(initIndex, initInfoData).toString()

  const needCapacity = INFO_CELL_CAPACITY + INFO_CELL_CAPACITY + FEE
  const liveCells = await getCells(config.PayersLockScript, 'lock', {output_data_len_range: ['0x0', '0x1']})
  const {inputs, capacity: inputCapacity} = collectInputs(liveCells, needCapacity, '0x0')

  const typeArgs = serializeOutPoint(inputs[ 0 ].previousOutput)
  const indexStateOutput = await generateIndexStateOutput(typeArgs)
  const infoOutput = await generateInfoOutput(typeArgs)

  let outputs = [indexStateOutput, infoOutput]
  let outputsData = [new IndexStateModel(initIndex).toString(), infoModel]

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
  console.log(`Creating cells, inputs count ${inputs.length}`)
  // @ts-ignore
  const txHash = await ckb.rpc.sendTransaction(rawTx)
  console.info(`Creating cells, tx hash: ${txHash} infoData: ${infoModel}`)
}
