process.env.HOSTNAME = 'block'
import { createCells } from './logic/create'
import { updateCell } from './logic/update'
import { startNumeralGeneratorServer } from './server'
import { getIndexStateCell, getLatestBlockNumber } from './utils/helper'

async function createOrUpdateNumeralInfoCell () {
  const {indexStateCell} = await getIndexStateCell()
  if (!indexStateCell) {
    console.log('Create Cells Block')
    await createCells(BigInt(await getLatestBlockNumber()))
  } else {
    console.log('Update Cells Block')
    await updateCell(await getLatestBlockNumber())
  }
}

void startNumeralGeneratorServer(createOrUpdateNumeralInfoCell)
