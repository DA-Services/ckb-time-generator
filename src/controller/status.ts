import { Arguments } from 'yargs'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { getTypeScriptOfIndexStateCell, getTypeScriptOfInfoCell, typeToCellType } from '../utils/helper'
import { getBlockNumber, getCells } from '../utils/rpc'
import { InfoModel } from '../model/info_model'
import { IndexStateModel } from '../model/index_state_model'
import { CellType } from '../const'

const dayjs = require('dayjs')

dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)

async function findIndexStateCells (typeScript: CKBComponents.Script) {
  const indexStateCells = await getCells(typeScript, 'type')

  const statusOfCells = indexStateCells.map(async cell => {
    const model = IndexStateModel.fromHex(cell.output_data)
    const block = await getBlockNumber(cell.block_number)

    const created_at = BigInt(block.header.timestamp)
    const created_at_height = BigInt(block.header.number)
    return {
      out_point: cell.out_point,
      index: model.index,
      total: model.total,
      created_at,
      created_at_height,
    }
  })

  return Promise.all(statusOfCells)
}

async function findInfoCells (typeScript: CKBComponents.Script) {
  const infoCells = await getCells(typeScript, 'type')

  const statusOfCells = infoCells.map(async cell => {
    const model = InfoModel.fromHex(cell.output_data)
    const block = await getBlockNumber(cell.block_number)

    const created_at = BigInt(block.header.timestamp)
    const created_at_height = BigInt(block.header.number)
    return {
      out_point: cell.out_point,
      index: model.index,
      value: model.infoData,
      created_at,
      created_at_height,
    }
  })

  return Promise.all(statusOfCells)
}

export async function statusController (argv: Arguments<{ type: string }>) {
  console.log('Check status of cells ...')
  const cellType = typeToCellType(argv.type)
  const indexStateTypeScript = getTypeScriptOfIndexStateCell(cellType)
  const infoCellTypeScript = getTypeScriptOfInfoCell(cellType)

  console.log(`cell type: ${argv.type}`)

  let statusOfIndexStateCells: { out_point: RPC.OutPoint; index: number, total: number, created_at: bigint, created_at_height: bigint }[]
  let statusOfInfoCells: { out_point: RPC.OutPoint; index: number, value: bigint, created_at: bigint, created_at_height: bigint }[]
  try {
    statusOfIndexStateCells = await findIndexStateCells(indexStateTypeScript)
    statusOfInfoCells = await findInfoCells(infoCellTypeScript)
  } catch (e) {
    console.error(e)
  }

  statusOfIndexStateCells.sort((a, b) => {
    return a.created_at_height > b.created_at_height ? 1 : (a.created_at_height < b.created_at_height ? -1 : 0)
  })

  statusOfInfoCells.sort((a, b) => {
    return a.created_at_height > b.created_at_height ? 1 : (a.created_at_height < b.created_at_height ? -1 : 0)
  })

  console.log(`\n=== index cells ===`)
  statusOfIndexStateCells.forEach(status => {
    const index = status.index.toString().padStart(2, ' ')
    const created_at = dayjs(Number(status.created_at))

    console.log(`  index: ${index}, total: ${status.total}, height: ${status.created_at_height}`)
    console.log(`    created_at: ${status.created_at}(${created_at.format('YYYY-MM-DD HH:mm:ss')}), from_now: ${created_at.fromNow()}, tx_hash: ${status.out_point.tx_hash}`)
  })

  console.log(`\n=== info cells ===`)
  statusOfInfoCells.forEach(status => {
    const index = status.index.toString().padStart(2, ' ')
    const created_at = dayjs(Number(status.created_at))

    switch (cellType) {
      case CellType.Timestamp:
        const value = dayjs(status.value.toString(), 'X').format('YYYY-MM-DD HH:mm:ss')
        console.log(`  index: ${index}, value: ${status.value}(${value}), block_height: ${status.created_at_height}, block_time: ${status.created_at / BigInt(1000)}(${created_at.format('YYYY-MM-DD HH:mm:ss')})`)
        console.log(`    from_now: ${created_at.fromNow()}, tx_hash: ${status.out_point.tx_hash}`)
        break
      default:
        console.log(`  index: ${index}, value: ${status.value}, block_height: ${status.created_at_height}, block_time: ${status.created_at / BigInt(1000)}(${created_at.format('YYYY-MM-DD HH:mm:ss')})`)
        console.log(`    from_now: ${created_at.fromNow()}, tx_hash: ${status.out_point.tx_hash}`)
    }
  })
}
