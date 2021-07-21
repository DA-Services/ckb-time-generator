process.env.HOSTNAME = 'blocknumber'
// @ts-ignore
import { startGeneratorServer } from './logic/server'
import { generateBlockNumberSince} from './utils/helper'
import { getLatestBlockNumber } from './utils/rpc'

async function start() {
  await startGeneratorServer({
    initInfoData: await getLatestBlockNumber(),
    updateInfoDataFunc: getLatestBlockNumber,
    sinceFunc: (timestamp, blockNumber) => generateBlockNumberSince(blockNumber)
  })
}

void start()
