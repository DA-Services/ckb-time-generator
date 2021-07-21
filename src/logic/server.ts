// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import WebSocket from 'ws'
import config from '../config'
import { getIndexStateCell } from '../utils/helper'
import { createInfoAndIndexStateCells } from './create'
import { SinceFunc, updateInfoAndIndexStateCell } from './update'
import { getTransaction } from '../utils/rpc'

interface ServerParams {
  initInfoData: BigInt,
  updateInfoDataFunc: () => Promise<BigInt>,
  sinceFunc?: SinceFunc,
}

async function createOrUpdateInfoCells({ initInfoData, updateInfoDataFunc, sinceFunc }: ServerParams, indexStateCell: CKBComponents.Cell): Promise<string> {
  try {
    if (!indexStateCell) {
      return await createInfoAndIndexStateCells(initInfoData)
    }
    else {
      return await updateInfoAndIndexStateCell(
        await updateInfoDataFunc(),
        sinceFunc,
      )
    }
  } catch (e) {
    if (e.message.search('"code":-301')) {
      return 'retry'
    } else if (e.mssage.search('capacity not enough')) {
      console.error('Can not find enough live cells from ckb-indexer.')
      return 'retry'
    }

    throw e
  }
}

let timeoutTimer;
export function startGeneratorServer (serverParams: ServerParams) {
  console.log(`ws: connecting to ${config.CKB_WS_URL} ...`)
  let ws = new WebSocket(config.CKB_WS_URL)

  // Retry if connecting timeout.
  timeoutTimer = setTimeout(() => {
    console.warn('ws: connecting timeout, retry connecting.')
    clearTimeout(timeoutTimer)
    startGeneratorServer(serverParams)
  }, 30 * 1000)

  // For debugging purpose, uncomment the following line:
  // const {indexStateCell} = await getIndexStateCell()
  // await createOrUpdateInfoCells(indexStateCell)

  let pingTimer
  let pingId = 1000;
  let pingHistory: { id: number, pingAt: number, pongAt: number }[] = [];
  ws.on('open', () => {
    console.info('ws: connected')
    clearTimeout(timeoutTimer)

    ws.send('{"id": 1, "jsonrpc": "2.0", "method": "subscribe", "params": ["new_tip_header"]}')

    // Repeatedly send ping message
    pingTimer = setInterval(async () => {
      let now = Date.now()
      let lastPing = pingHistory[pingHistory.length - 1]

      if (!lastPing || lastPing?.pongAt > 0) {
        // Last ping has response, continue ping.
        console.log(`ws: send ping[${pingId}]`)
        // Keep ping history for last 600 seconds.
        if (pingHistory.length >= 120) {
          pingHistory.shift()
        }

        ws.send(`{ "id": ${pingId}, "jsonrpc": "2.0", "method": "sync_state", "params": [] }`)
        pingHistory.push({ id: pingId, pingAt: now, pongAt: 0 })

        pingId++
      } else {
        // Last ping has no response, check if it is timeout.
        if ((now - lastPing?.pingAt) > 10 * 1000) {
          // Treat server as timeout if no reponse for 30 seconds.
          console.error('ws: Server timeout, try to reconnect ...')
          clearTimeout(pingTimer)
          ws.terminate()
        }
      }
    }, 5000)
  })

  let prevTxHash = ''
  let waitedBlocks = 0
  ws.on('message', async (response) => {
    // console.log('ws: received message:', response)
    let data
    try {
      data = JSON.parse(response as string)
    } catch (e) {
      console.error('Parse message failed, skip.')
      return
    }

    if (data.id && data.result?.best_known_block_number) {
      // Recived pong message
      console.log(`ws: received pong[${data.id}]`)
      let item = pingHistory.find((item) => {
        return item.id == data.id
      })
      if (item) {
        item.pongAt = Date.now()
      }

    } else if (data.method === 'subscribe' && data.params?.result) {
      // Recived notify message
      let result
      try {
        result = JSON.parse(data.params.result)
      } catch (e) {
        console.error('Parse params of message failed, skip.')
        return
      }

      console.log(`ws: received notify of subscription at height ${result.number} `)
      if (prevTxHash && waitedBlocks <= 5) {
        console.info('onmessage: Checking if latest transaction is committed ...')

        const tx = await getTransaction(prevTxHash)
        // tx maybe null
        if (!tx || tx.txStatus.status !== 'committed') {
          console.info(`onmessage: Latest transaction is not committed, keep waiting for it.(waitedBlock: ${waitedBlocks})`)
          waitedBlocks++
          return
        }
      }
      waitedBlocks = 0

      const {indexStateCell} = await getIndexStateCell()
      const ret = await createOrUpdateInfoCells(serverParams, indexStateCell)
      if (ret === 'retry') {
        prevTxHash = ''
      } else {
        prevTxHash = ret
      }
    }
  })

  ws.on('close', async (code, reason) => {
    console.warn(`ws: disconnected, retry connecting. code: ${code} reason: ${reason}`)
    startGeneratorServer(serverParams)
  })

  return ws
}
