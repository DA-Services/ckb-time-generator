process.env.HOSTNAME = 'timestamp'
// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import { startGeneratorServer } from './logic/server'
import { generateTimestampSince } from './utils/helper'
import { getLatestTimestamp } from './utils/rpc'

async function start() {
  await startGeneratorServer({
    initInfoData: BigInt(Math.floor(Date.now() / 1000)),
    updateInfoDataFunc: getLatestTimestamp,
    sinceFunc: (timestamp, blockNumber): string => generateTimestampSince(timestamp)
  })
}

void start()
