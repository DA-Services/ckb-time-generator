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

export async function startGeneratorServer ({ initInfoData, updateInfoDataFunc, sinceFunc }: ServerParams) {
  console.log(`Connecting to ${config.CKB_WS_URL}`)

  let ws = new WebSocket(config.CKB_WS_URL)

  async function createOrUpdateInfoCells(indexStateCell: CKBComponents.Cell): Promise<string> {
    if (!indexStateCell) {
      return await createInfoAndIndexStateCells(initInfoData)
    }
    else {
      return await updateInfoAndIndexStateCell(
        await updateInfoDataFunc(),
        sinceFunc,
      )
    }
  }

  // For debugging purpose, uncomment the following line:
  // const {indexStateCell} = await getIndexStateCell()
  // await createOrUpdateInfoCells(indexStateCell)

  ws.on('open', function open () {
    console.log('Start Server')

    ws.send('{"id": 2, "jsonrpc": "2.0", "method": "subscribe", "params": ["new_tip_header"]}')
  })

  let prevTxHash = ''
  let waitedBlocks = 0
  ws.on('message', async function incoming (data) {
    console.log('onmessage', data)

    if (JSON.parse(data).params) {
      const tipNumber = JSON.parse(JSON.parse(data).params.result).number
      console.info('onmessage: New block:', tipNumber)

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
      const ret = await createOrUpdateInfoCells(indexStateCell)
      if (ret === 'retry') {
        console.info('onmessage: Some cells are occupied, try again later.')
        prevTxHash = ''
        return
      } else {
        prevTxHash = ret
      }
    }
  })

  ws.on('close', async function close (code, reason) {
    console.info('Websocket Close', code, reason)

    const {indexStateCell} = await getIndexStateCell()
    await createOrUpdateInfoCells(indexStateCell)
    await startGeneratorServer({
      initInfoData,
      updateInfoDataFunc,
      sinceFunc
    })
  })
}
