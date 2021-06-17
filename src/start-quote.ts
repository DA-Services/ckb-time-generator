process.env.HOSTNAME = 'quote'
import fetch from 'node-fetch'
import { createCells } from './logic/create'
import { updateCell } from './logic/update'
import { startNumeralGeneratorServer } from './server'
import { getIndexStateCell } from './utils/helper'

async function createOrUpdateNumeralInfoCell () {
  const {indexStateCell} = await getIndexStateCell()

  if (!indexStateCell) {
    console.log('Create Cells Quote')
    await createCells(BigInt(await getCkbPrice()))
  } else {
    console.log('Update Cells Quote')
    await updateCell(await getCkbPrice())
  }
}

void startNumeralGeneratorServer(createOrUpdateNumeralInfoCell)

/**
 * get ckb price
 * precision: 1/10000 of 1 cent, 0.000001
 */
async function getCkbPrice(): Promise<BigInt> {
  const data = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=nervos&vs_currencies=usd').then(res => res.json())
  if (data?.nervos?.usd) {
    return BigInt(data?.nervos?.usd * 100 * 10000 | 0)
  }

  throw new Error(`fetch nervos price error: ${data?.nervos?.usd}`)
}
