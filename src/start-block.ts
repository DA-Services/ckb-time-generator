import { createCells } from './logic/create'
import { updateCell } from './logic/update'
import { startNumeralGeneratorServer } from './server'
import { getIndexStateCell, getLatestBlockNumber } from './utils/helper'

async function createOrUpdateNumeralInfoCell () {
  const {indexStateCell} = await getIndexStateCell()
  if (!indexStateCell) {
    await createCells(BigInt(await getLatestBlockNumber()))
  } else {
    await updateCell(await getLatestBlockNumber())
  }
}

void startNumeralGeneratorServer(createOrUpdateNumeralInfoCell)
