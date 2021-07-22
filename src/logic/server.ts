// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import WebSocket from 'ws'
import config from '../config'
import { getIndexStateCell, notifyWecom } from '../utils/helper'
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

let pingTimer;
let eventPingTimer;

let shouldNotify = false;
let pingId = 1000;
let pingHistory: { id: number, pingAt: number, pongAt: number }[] = [];
function heartbeat(ws: WebSocket) {
  if (pingTimer) {
    clearTimeout(pingTimer)
	}

  pingTimer = setTimeout(() => {
    let now = Date.now()
    let lastPing = pingHistory[pingHistory.length - 1]

    if (!lastPing || lastPing?.pongAt > 0) {
      // Last ping has response, continue ping.
      console.log(`ws: send ping[${pingId}]`)
      // Keep ping history for last 600 seconds.
      if (pingHistory.length >= 120) {
        pingHistory.shift()
      }

      // ⚠️ Different method may has performance issue, ensure testing on cloud
      ws.send(`{ "id": ${pingId}, "jsonrpc": "2.0", "method": "get_tip_header", "params": [] }`)
      pingHistory.push({ id: pingId, pingAt: now, pongAt: 0 })

      pingId++
    } else {
      // Last ping has no response, check if it is timeout.
      if ((now - lastPing?.pingAt) > 10 * 1000) {
        // Treat server as timeout if no reponse for 30 seconds.
        console.error('ws: Server timeout, try to reconnect ...')
        if (shouldNotify) {
          shouldNotify = false
          notifyWecom(`Websocket ping CKB node ${config.CKB_WS_URL} timeout, try to reconnect ...`)
        }

        clearTimeout(pingTimer)
        clearTimeout(eventPingTimer)
        ws.terminate()
      }
    }

    heartbeat(ws)
  }, 5000)
}

function eventHeartbeat(ws) {
  console.log(`ws: received event pong`)

  if (eventPingTimer) {
    clearTimeout(eventPingTimer)
  }

  eventPingTimer = setTimeout(() => {
    if (shouldNotify) {
      shouldNotify = false
      notifyWecom(`Websocket has no event from CKB node ${config.CKB_WS_URL} for 60 seconds, try to reconnect ...`)
    }

    clearTimeout(pingTimer)
    clearTimeout(eventPingTimer)
    ws.terminate()
  }, 60000)
}

let timeoutTimer;
export function startGeneratorServer (serverParams: ServerParams) {
  let ws: WebSocket;

  console.log(`ws: connecting to ${config.CKB_WS_URL} ...`)
  ws = new WebSocket(config.CKB_WS_URL)

  pingId = 1000;
  pingHistory = [];

  // Retry if connecting timeout.
  timeoutTimer = setTimeout(() => {
    console.warn('ws: connecting timeout, retry connecting.')
    clearTimeout(timeoutTimer)
    startGeneratorServer(serverParams)
  }, 30 * 1000)

  // For debugging purpose, uncomment the following line:
  // const {indexStateCell} = await getIndexStateCell()
  // await createOrUpdateInfoCells(indexStateCell)

  ws.on('open', () => {
    console.info('ws: connected')
    clearTimeout(timeoutTimer)
    shouldNotify = true

    ws.send('{"id": 1, "jsonrpc": "2.0", "method": "subscribe", "params": ["new_tip_header"]}')

    heartbeat(ws)
    eventHeartbeat(ws)
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

    if (data.id && data.result?.number) {
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
      eventHeartbeat(ws)

      let result
      try {
        result = JSON.parse(data.params.result)
      } catch (e) {
        console.error('ws: parse params of message failed, skip.')
        return
      }

      console.log(`ws: received notify of subscription at height ${result.number} `)
      if (prevTxHash && waitedBlocks <= 5) {
        console.info('ws: checking if latest transaction is committed ...')

        const tx = await getTransaction(prevTxHash)
        // tx maybe null
        if (!tx || tx.txStatus.status !== 'committed') {
          console.info(`ws: last transaction is not committed, keep waiting for it.(waitedBlock: ${waitedBlocks})`)
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

  ws.on('close', (code, reason) => {
    console.warn(`ws: disconnected, retry connecting. code: ${code} reason: ${reason}`)
    setTimeout(() => {
      startGeneratorServer(serverParams)
    }, 10000)
  })

  ws.on('error', (err) => {
    console.error(`ws: connect to ${config.CKB_WS_URL} failed. error message: ${err}`, )
    if (shouldNotify) {
      shouldNotify = false
      notifyWecom(`Websocket connection of node ${config.CKB_WS_URL} occurred error: ${err}`)
    }
  })

  return ws
}
