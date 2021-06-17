import WebSocket from 'ws'
import config from './config'

export async function startNumeralGeneratorServer (createOrUpdateNumeralInfoCell: Function) {
  let ws = new WebSocket(config.CKB_WS_URL)

  ws.on('open', function open () {
    console.log('Start Server: ws opened')

    ws.send('{"id": 2, "jsonrpc": "2.0", "method": "subscribe", "params": ["new_tip_header"]}')
  })

  ws.on('message', async function incoming (data) {
    console.log('onmessage', data)

    if (JSON.parse(data).params) {
      const tipNumber = JSON.parse(JSON.parse(data).params.result).number

      console.info('New Block', tipNumber)

      if (parseInt(tipNumber, 16) % config.BLOCKS_INTERVAL === 0) {
        await createOrUpdateNumeralInfoCell()
      }
    }
  })

  ws.on('close', async function close (code, reason) {
    console.info('Websocket Close', code, reason)

    await createOrUpdateNumeralInfoCell()
    await startNumeralGeneratorServer(createOrUpdateNumeralInfoCell)
  })
}
