// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import WebSocket from 'ws'
import config from '../config'
import { getIndexStateCell } from '../utils/helper'
import { createInfoAndIndexStateCells } from './create'
import { SinceFunc, updateInfoAndIndexStateCell } from './update'

interface ServerParams {
  initInfoData: BigInt,
  updateInfoDataFunc: () => Promise<BigInt>,
  sinceFunc?: SinceFunc,
}

export async function startGeneratorServer ({ initInfoData, updateInfoDataFunc, sinceFunc }: ServerParams) {
  console.log(`Connecting to ${config.CKB_WS_URL}`)

  let ws = new WebSocket(config.CKB_WS_URL)

  async function createOrUpdateInfoCells(indexStateCell: CKBComponents.Cell) {
    if (!indexStateCell) {
      console.log('Create Cells')
      await createInfoAndIndexStateCells(initInfoData)
    }
    else {
      console.log('Update Cells')
      await updateInfoAndIndexStateCell(
        await updateInfoDataFunc(),
        sinceFunc,
      )
    }
  }

  ws.on('open', function open () {
    console.log('Start Server')

    ws.send('{"id": 2, "jsonrpc": "2.0", "method": "subscribe", "params": ["new_tip_header"]}')
  })

  ws.on('message', async function incoming (data) {
    console.log('onmessage', data)

    if (JSON.parse(data).params) {
      const tipNumber = JSON.parse(JSON.parse(data).params.result).number

      console.info('New Block', tipNumber)

      if (parseInt(tipNumber, 16) % config.BLOCKS_INTERVAL === 0) {
        const {indexStateCell} = await getIndexStateCell()
        await createOrUpdateInfoCells(indexStateCell)
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
