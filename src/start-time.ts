import { createCells } from './logic/create'
import { updateCell } from './logic/update'
import { startNumeralGeneratorServer } from './server'
import { getIndexStateCell, getLatestTimestamp } from './utils/helper'

async function createOrUpdateNumeralInfoCell () {
  const {indexStateCell} = await getIndexStateCell()
  if (!indexStateCell) {
    await createCells(BigInt(Math.floor(new Date().getTime() / 1000)))
  } else {
    await updateCell(await getLatestTimestamp())
  }
}

void startNumeralGeneratorServer(createOrUpdateNumeralInfoCell)
