// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import config from '../config'
import { IndexState } from '../model/time_index_state'
import { NumeralInfo } from '../model/time_info'
import { ckb, NUMERAL_CELL_CAPACITY } from '../utils/const'
import { parseIndex, toHex, uint32ToBe } from '../utils/hex'
import { getCells } from './rpc'

export async function getLatestBlockNumber () {
  const number = await ckb.rpc.getTipBlockNumber()
  return BigInt(number)
}

export async function getLatestTimestamp () {
  const tipBlockNumber = await getLatestBlockNumber()
  //The median block time calculated from the past 37 blocks timestamp
  const number = tipBlockNumber - BigInt(18)
  const {timestamp} = await ckb.rpc.getHeaderByNumber(number)
  return BigInt(Math.floor(parseInt(timestamp) / 1000))
}

export async function generateIndexStateOutput (args) {
  return {
    capacity: toHex(NUMERAL_CELL_CAPACITY),
    lock: config.AlwaysSuccessLockScript,
    type: {
      ...config.IndexStateTypeScript,
      args,
    },
  }
}

export async function generateInfoOutput (args) {
  return {
    capacity: toHex(NUMERAL_CELL_CAPACITY),
    lock: config.AlwaysSuccessLockScript,
    type: {
      ...config.InfoTypeScript,
      args
    }
  }
}

export async function getIndexStateCell (): Promise<{indexStateCell: CKBComponents.Cell, indexState: IndexState}> {
  const indexStateCells = await getCells(config.IndexStateTypeScript, 'type')
  if (!indexStateCells || indexStateCells.length === 0) {
    return {
      indexStateCell: null,
      indexState: null,
    }
  }
  if (indexStateCells.length > 1) {
    console.error('The amount of time index state cell is bigger than 1')
  }
  const indexStateCell = indexStateCells[ 0 ]
  const indexState = IndexState.fromData(indexStateCell.output_data)
  return {
    indexStateCell,
    indexState: indexState
  }
}

export async function getInfoCell (timeIndex): Promise<{infoCell: CKBComponents.Cell, numeralInfo: NumeralInfo}> {
  let timeInfoCells = await getCells(config.InfoTypeScript, 'type')

  if (timeInfoCells && timeInfoCells.length !== 0) {
    const infoCell = timeInfoCells.find(cell => parseIndex(cell.output_data) === timeIndex)

    if (infoCell) {
      const numeralInfo = NumeralInfo.fromData(infoCell.output_data)

      return {
        infoCell,
        numeralInfo,
      }
    }
  }

  return {
    infoCell: null,
    numeralInfo: null,
  }
}

export const collectInputs = (liveCells, needCapacity, since) => {
  let inputs = []
  let sum = BigInt(0)
  for (let cell of liveCells) {
    inputs.push({
      previousOutput: {
        txHash: cell.out_point.tx_hash,
        index: cell.out_point.index,
      },
      since,
    })
    sum = sum + BigInt(cell.output.capacity)
    if (sum >= needCapacity) {
      break
    }
  }
  if (sum < needCapacity) {
    throw Error('Capacity not enough')
  }
  return {inputs, capacity: sum}
}

export const generateTimestampInfoSince = timestamp => {
  return `0x40000000${uint32ToBe(timestamp)}`
}

export const generateBlockNumberInfoSince = (blockNumber: BigInt) => {
  return toHex(blockNumber)
}
