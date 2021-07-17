process.env.HOSTNAME = 'quote'
// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import fetch from 'node-fetch'
import { startGeneratorServer } from './logic/server'

/**
 * get ckb price
 * precision: 1/10000 of 1 cent, 0.000001
 */
async function getCkbPrice(): Promise<BigInt> {
  const data = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=nervos-network&vs_currencies=usd').then(res => res.json())
  if (data?.['nervos-network']?.usd) {
    return BigInt(data?.['nervos-network']?.usd * 100 * 10000 | 0)
  }

  throw new Error(`fetch nervos price error: ${data?.nervos?.usd}`)
}

async function start() {
  await startGeneratorServer({
    initInfoData: await getCkbPrice(),
    updateInfoDataFunc: getCkbPrice
  })
}

void start()
