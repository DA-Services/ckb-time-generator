// import { inspect } from 'util'
import { Arguments } from 'yargs'

import config from '../config.js'
import { SUM_OF_INFO_CELLS } from '../const.js'
import { ckb, getCells } from '../utils/rpc.js'
import {
  getTypeScriptOfIndexStateCell,
  getTypeScriptOfInfoCell,
  sortLiveCells,
  typeToCellType,
  toHex
} from '../utils/helper.js'
import { InfoModel } from '../model/info_model.js'
import { EMPTY_WITNESS_ARGS } from '@nervosnetwork/ckb-sdk-utils/lib/const.js'

async function findRedundantIndexStateCells (typeScript: CKBComponents.Script) {
  let indexStateCells = await getCells(typeScript, 'type')
  indexStateCells = sortLiveCells(indexStateCells)

  const cells = indexStateCells.map(cell => {
    const created_at_height = parseInt(cell.block_number, 16)
    const capacity = parseInt(cell.output.capacity, 16)
    return {
      out_point: cell.out_point,
      created_at_height,
      capacity,
    }
  })

  console.log(`Find ${cells.length} IndexStateCells, will recycle ${cells.length - 1} of them.`)

  // The last one is the newest one, so we keep it.
  cells.pop()
  return Promise.all(cells)
}

async function findRedundantInfoCells (typeScript: CKBComponents.Script) {
  let infoCells = await getCells(typeScript, 'type')
  infoCells = sortLiveCells(infoCells)

  const cells: { out_point: RPC.OutPoint, created_at_height: number, capacity: number, index: number }[] = []
  const existIndexes: number[] = []
  for (const cell of infoCells) {
    const model = InfoModel.fromHex(cell.output_data)
    const created_at_height = parseInt(cell.block_number, 16)
    const capacity = parseInt(cell.output.capacity, 16)
    if (model.index > SUM_OF_INFO_CELLS - 1) {
      // Cells with out of range index is redundant.
      cells.push({
        out_point: cell.out_point,
        created_at_height,
        index: model.index,
        capacity,
      })
    } else {
      if (existIndexes.includes(model.index)) {
        // Cells with the same index is redundant.
        cells.push({
          out_point: cell.out_point,
          created_at_height,
          index: model.index,
          capacity,
        })
      } else {
        existIndexes.push(model.index)
      }
    }
  }

  console.log(`Find ${infoCells.length} IndexStateCells, will recycle ${cells.length} of them.`)
  return Promise.all(cells)
}

export async function fixController (argv: Arguments<{ type: string }>) {
  console.log('Fix redundant cells ...')
  const cellType = typeToCellType(argv.type)
  const indexStateTypeScript = getTypeScriptOfIndexStateCell(cellType)
  const infoCellTypeScript = getTypeScriptOfInfoCell(cellType)

  console.log(`cell type: ${argv.type}`)

  let indexStateCells: { out_point: RPC.OutPoint, created_at_height: number, capacity: number }[]
  let infoCells: { out_point: RPC.OutPoint, created_at_height: number, capacity: number, index: number }[]
  try {
    indexStateCells = await findRedundantIndexStateCells(indexStateTypeScript)
    infoCells = await findRedundantInfoCells(infoCellTypeScript)
  } catch (e) {
    console.error(e)
  }

  if (indexStateCells.length <= 0 && infoCells.length <= 0) {
    console.error('There is no cell need to be recycled.')
    process.exit(1)
  }

  if (argv.dryRun) {
    console.log(`\n=== redundant index cells ===`)
    indexStateCells.forEach(cell => {
      console.log(`  block_height: ${cell.created_at_height}, out_point: ${cell.out_point.tx_hash}-${cell.out_point.index}`)
    })

    console.log(`\n=== redundant info cells ===`)
    infoCells.forEach(cell => {
      console.log(`  index: ${cell.index}, block_height: ${cell.created_at_height}, out_point: ${cell.out_point.tx_hash}-${cell.out_point.index}`)
    })
  } else {
    let totalCapacity = 0
    const inputs: CKBComponents.CellInput[] = []
    const inputFn = cell => {
      totalCapacity += cell.capacity
      inputs.push({
        previousOutput: {
          txHash: cell.out_point.tx_hash,
          index: cell.out_point.index,
        },
        since: '0x0',
      })
    }
    indexStateCells.forEach(inputFn)
    infoCells.forEach(inputFn)

    const configOfType = config[argv.type]

    const outputs: CKBComponents.CellOutput[] = [
      {
        capacity: toHex(totalCapacity - 100000),
        lock: configOfType.PayersLockScript,
        type: null,
      }
    ]

    const rawTx = {
      version: '0x0',
      cellDeps: config.CellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData: ['0x'],
      witnesses: [],
    }
    rawTx.witnesses = rawTx.inputs.map(() => EMPTY_WITNESS_ARGS)

    let signedRawTx
    try {
      await ckb.loadDeps()
      signedRawTx = ckb.signTransaction(configOfType.PayersPrivateKey)(rawTx)
      // console.log('signedRawTx:', inspect(signedRawTx, { depth: 3, colors: true }))
    } catch (e) {
      console.error('load cell deps faild:', e.message)
      process.exit(1)
    }

    try {
      const txHash = await ckb.rpc.sendTransaction(signedRawTx)
      console.log(`Push transaction, tx hash:`, txHash)
      return txHash
    } catch (e) {
      console.error('Send transaction failed:', e.message)
      process.exit(1)
    }
  }
}
