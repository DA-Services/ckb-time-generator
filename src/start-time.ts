process.env.HOSTNAME = 'time'
import { createCells } from './logic/create'
import { updateCell } from './logic/update'
import { startNumeralGeneratorServer } from './server'
import { getIndexStateCell, getLatestTimestamp } from './utils/helper'

async function createOrUpdateNumeralInfoCell () {
  const {indexStateCell} = await getIndexStateCell()
  if (!indexStateCell) {
    console.log('Create Cells Time')
    await createCells(BigInt(Math.floor(new Date().getTime() / 1000)))
  } else {
    console.log('Update Cells Time')
    await updateCell(await getLatestTimestamp())
  }
}

void startNumeralGeneratorServer(createOrUpdateNumeralInfoCell)
