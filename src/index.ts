import WebSocket from 'ws'
import config from './config'
import { createCells } from './time/create'
import { updateCell } from './time/update'
import { getIndexStateCell, getLatestBlockNumber, getLatestTimestamp } from './time/helper'

const startNumeralGeneratorServer = async () => {
  let ws = new WebSocket(config.CKB_WS_URL)

  ws.on('open', function open() {
    ws.send('{"id": 2, "jsonrpc": "2.0", "method": "subscribe", "params": ["new_tip_header"]}')
  })

  ws.on('message', async function incoming(data) {
    if (JSON.parse(data).params) {
      const tipNumber = JSON.parse(JSON.parse(data).params.result).number
      console.info('New Block', tipNumber)
      if (parseInt(tipNumber, 16) % config.BLOCKS_INTERVAL === 0) {
        await createOrUpdateNumeralInfoCell()
      }
    }
  })

  ws.on('close', async function close(code, reason) {
    console.info('Websocket Close', code, reason)
    await createOrUpdateNumeralInfoCell()
    await startNumeralGeneratorServer()
  })
}

const createOrUpdateNumeralInfoCell = async () => {
  const { indexStateCell } = await getIndexStateCell()
  if (!indexStateCell) {
    await createCells(BigInt(Math.floor(new Date().getTime() / 1000))) // todo:
    // await createCells(BigInt(await getLatestBlockNumber())) // todo:
  } else {
    await updateCell(await getLatestTimestamp()) // todo:
    // await updateCell(await getLatestBlockNumber()) // todo:
  }
}

void startNumeralGeneratorServer()
