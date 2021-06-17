import { serializeOutPoint } from '@nervosnetwork/ckb-sdk-utils'
import { collectInputs, generateIndexStateOutput, generateInfoOutput } from './helper'
import { toHex } from '../utils/hex'
import config from '../config'
import { ckb, FEE, NUMERAL_CELL_CAPACITY } from '../utils/const'
import { getCells} from './rpc'
import { IndexState } from '../model/time_index_state'
import { NumeralInfo } from '../model/time_info'


export async function createCells (initNumeralData: BigInt) {
  const liveCells = await getCells(config.PayersLockScript, 'lock', {output_data_len_range: ['0x0', '0x1']})
  const needCapacity = NUMERAL_CELL_CAPACITY + NUMERAL_CELL_CAPACITY + FEE // todo: 似乎不够？
  const {inputs, capacity: inputCapacity} = collectInputs(liveCells, needCapacity, '0x0')

  const typeArgs = serializeOutPoint(inputs[ 0 ].previousOutput)
  const indexStateOutput = await generateIndexStateOutput(typeArgs)
  const infoOutput = await generateInfoOutput(typeArgs)
  let outputs = [indexStateOutput, infoOutput]

  if (inputCapacity > needCapacity) {
    outputs.push({
      capacity: toHex(inputCapacity - needCapacity),
      lock: config.PayersLockScript,
      type: undefined, // todo:
    })
  }

  const initIndex = 0
  let numeralInfoData = new NumeralInfo(initIndex, initNumeralData).toString()

  let cellDeps = [config.AlwaysSuccessDep, config.IndexStateDep, config.InfoDep]

  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: [new IndexState(initIndex).toString(), numeralInfoData, '0x'],
    witnesses: [],
  }
  rawTx.witnesses = rawTx.inputs.map((_, _i) => '0x')
  // @ts-ignore
  const txHash = await ckb.rpc.sendTransaction(rawTx)
  console.info(`Creating numeral cell tx hash: ${txHash} numeralInfoData: ${numeralInfoData}`)
}
