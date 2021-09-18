import { Arguments } from 'yargs'
import WebSocket from 'ws'
import { Logger } from 'winston'
import EventEmitter from 'events'

import config from '../config'
import { SinceFlag, SUM_OF_INFO_CELLS, TIME_1_M, TIME_30_S, TIME_5_S } from '../const'
import { rootLogger } from '../log'
import {
  collectInputs,
  dataToSince, getCkbPrice,
  getTypeScriptOfIndexStateCell,
  getTypeScriptOfInfoCell,
  notifyWithThrottle,
  typeToCellType,
  toHex,
} from '../utils/helper'
import {
  ckb,
  getCells, getLatestTimestamp,
  getTransaction,
  rpcFormat,
} from '../utils/rpc'
import { IndexStateModel } from '../model/index_state_model'
import { InfoModel } from '../model/info_model'
import { EMPTY_WITNESS_ARGS } from '@nervosnetwork/ckb-sdk-utils/lib/const'

async function findIndexStateCell (typeScript: CKBComponents.Script) {
  let indexStateCells = await getCells(typeScript, 'type')

  if (indexStateCells.length > 1) {
    // await notifyWithThrottle('index-state-cells-error', TIME_1_M * 60, 'Found more than one IndexStateCells on-chain, please recycle redundant cells as soon as possible.')
  }

  let cell = indexStateCells[0]
  let model = IndexStateModel.fromHex(cell.output_data)

  if (model.total !== SUM_OF_INFO_CELLS) {
    // await notifyWithThrottle('index-state-cells-error', TIME_1_M * 60, 'Total number of InfoCells is different from code and cell data, please update code as soon as possible.')
  }

  return {
    out_point: cell.out_point,
    output: cell.output,
    model,
  }
}

async function findInfoCell (typeScript: CKBComponents.Script, index: number) {
  let infoCells = await getCells(typeScript, 'type')

  if (infoCells.length > SUM_OF_INFO_CELLS) {
    // await notifyWithThrottle('info-cells-error', TIME_1_M * 60, `Found more than ${SUM_OF_INFO_CELLS} InfoCells on-chain, please recycle redundant cells as soon as possible.`)
  }

  for (const cell of infoCells) {
    let model = InfoModel.fromHex(cell.output_data)
    if (model.index === index) {
      return {
        out_point: cell.out_point,
        output: cell.output,
        model: model,
      }
    }
  }
}

export async function updateController (argv: Arguments<{ type: string }>) {
  const logger = rootLogger.child({ command: 'update', cell_type: argv.type })
  const cellType = typeToCellType(argv.type)
  const indexStateTypeScript = getTypeScriptOfIndexStateCell(cellType)
  const infoCellTypeScript = getTypeScriptOfInfoCell(cellType)

  const server = new Server(config.CKB_WS_URL, logger)
  server.connect()

  const maxWaitingBlocks = 5
  let waitedBlocks = 0
  let txHash = ''
  // The response of coingecko may fail sometimes, so we add a counter to determine if it is require to notice developer.
  const maxCoingeckoApiFailure = 5
  let coingeckoApiFailure = 0
  server.on('update', async (data: RPC.Header) => {
    if (txHash && waitedBlocks <= maxWaitingBlocks) {
      logger.verbose('Found pending transaction, check if transaction committed ...', { txHash: txHash })

      const tx = await getTransaction(txHash)
      // tx maybe null
      if (!tx || tx.txStatus.status !== 'committed') {
        logger.info('Previous transaction is pending, wait for it.', { txHash: txHash })
        waitedBlocks++
        return
      }
    }

    // Calculate new outputs_data of IndexStateCell and InfoCell
    let resultOfIndex: { out_point: RPC.OutPoint, output: RPC.CellOutput, model: IndexStateModel }
    try {
      resultOfIndex = await findIndexStateCell(indexStateTypeScript)
    } catch (e) {
      logger.error(`Failed to find IndexStateCells: ${e.toString()}`)
    }

    let { out_point: indexOutPoint, output: indexOutput, model: indexModel } = resultOfIndex
    indexModel.increaseIndex()

    let resultOfInfo: { out_point: RPC.OutPoint, output: RPC.CellOutput, model: InfoModel }
    try {
      resultOfInfo = await findInfoCell(infoCellTypeScript, indexModel.index)
    } catch (e) {
      logger.error(`Failed to find InfoCells: ${e.toString()}`)
    }
    let { out_point: infoOutPoint, output: infoOutput, model: infoModel } = resultOfInfo
    let since = '0x0'
    let lockScript = config[argv.type].PayersLockScript
    switch (argv.type) {
      case 'blocknumber':
        infoModel.infoData = BigInt(data.number)
        since = dataToSince(infoModel.infoData, SinceFlag.AbsoluteHeight)
        break
      case 'timestamp':
        try {
          infoModel.infoData = await getLatestTimestamp(data.number)
        } catch (e) {
          await notifyWithThrottle('fetch-timestamp-error', TIME_1_M * 10, `${e}`)
          return
        }
        since = dataToSince(infoModel.infoData, SinceFlag.AbsoluteTimestamp)
        break
      case 'quote':
        try {
          infoModel.infoData = await getCkbPrice()
          // Reset failure count to 0.
          coingeckoApiFailure = 0
        } catch (e) {
          if (e.toString().includes('invalid json')) {
            // Count failures for warning developers if it is over frequent.
            coingeckoApiFailure += 1;
            logger.error(`Failed to parse the response from coingecko as JSON, the raw data is: ${e.extra_data}`)
            if (coingeckoApiFailure > maxCoingeckoApiFailure) {
              await notifyWithThrottle('fetch-quote-error', TIME_1_M * 10, `Failed to parse the response from coingecko as JSON too many times.`)
            }
          } else {
            await notifyWithThrottle('fetch-quote-error', TIME_1_M * 10, `${e}`)
          }
          return
        }
        break
    }

    // Build inputs of transaction
    let inputs = []
    inputs.push({
      previousOutput: rpcFormat().toOutPoint(indexOutPoint),
      since: '0x0',
    })
    inputs.push({
      previousOutput: rpcFormat().toOutPoint(infoOutPoint),
      since,
    })

    let collected
    try {
      collected = await collectInputs(lockScript, config.fee.update)
      inputs = inputs.concat(collected.inputs)
    } catch (e) {
      if (e.toString().includes('capacity')) {
        logger.error(`Collect inputs failed, expected ${config.fee.update} shannon but only ${collected.capacity} shannon found.`)
        await notifyWithThrottle('collect-inputs-error', TIME_1_M * 10, `Collect inputs failed, expected ${config.fee.update} shannon but only ${collected.capacity} shannon found.`)
      } else {
        logger.error(`Collect inputs error.(${e.toString()})`)
        await notifyWithThrottle('collect-inputs-error', TIME_1_M * 10, `Collect inputs error.(${e.toString()})`)
      }
      return
    }

    // Build outputs of transaction
    const outputs = [
      rpcFormat().toOutput(indexOutput),
      rpcFormat().toOutput(infoOutput),
    ]

    if (collected.capacity > config.fee.update) {
      // Change redundant capacity
      outputs.push({
        capacity: toHex(collected.capacity - config.fee.update),
        lock: lockScript,
        type: null,
      })
    }

    // Build outputs_data of transaction
    const outputsData = [
      indexModel.toString(),
      infoModel.toString(),
    ]

    if (outputs.length > 2) {
      // Keep outputs_data has the same length with outputs
      for (let i = 2; i < outputs.length; i++) {
        outputsData.push('0x')
      }
    }

    // Build and sign transaction
    const rawTx = {
      version: '0x0',
      cellDeps: config.CellDeps,
      headerDeps: [],
      inputs,
      outputs,
      outputsData,
      witnesses: inputs.map((_, _i) => EMPTY_WITNESS_ARGS)
    }

    // Sign and push transaction
    try {
      await ckb.loadDeps()
    } catch (e) {
      logger.error(`Load cell_deps from node RPC API failed.(${e})`)
      await notifyWithThrottle('load-cell-deps-error', TIME_1_M * 10, `Load cell_deps from node RPC API failed.(${e})`)
      return
    }

    let signedRawTx
    try {
      signedRawTx = ckb.signTransaction(config[argv.type].PayersPrivateKey)(rawTx)
    } catch (e) {
      logger.error(`Sign transaction failed.(${e})`)
      await notifyWithThrottle('sign-transaction-error', TIME_1_M * 10, `Sign transaction failed.(${e})`)
      return
    }

    try {
      txHash = await ckb.rpc.sendTransaction(signedRawTx, 'passthrough')
      waitedBlocks = 0

      logger.info(`Push transaction, tx hash: ${txHash}`)
    } catch (err) {
      try {
        let data = JSON.parse(err.message)
        switch (data.code) {
          case -301:
          case -302:
          case -1107:
            // These error are caused by cell occupation, could retry automatically.
            logger.warn(`Update cell failed.(${data.message})`, { code: data.code })
            return
          default:
            logger.error(`Update cell failed.(${data.message})`, { code: data.code })
            await notifyWithThrottle('update-error', TIME_1_M * 10, `Update cell failed.(${data.message})`)
        }
      } catch (e) {
        logger.error(`Update cell occurred unknown error.(${err})`)
        await notifyWithThrottle('update-error', TIME_1_M * 10, `Update cell occurred unknown error.(${err})`)

      }
    }
  })
}

class Server extends EventEmitter {
  protected url: string
  protected logger: Logger
  protected ws: WebSocket

  protected heartbeatStatus: { id: number, timer: any, history: any[] }
  protected eventStatus: { timer: any, history: any[] }
  protected txStatus: { txHash: string, waitedBlocks: number }

  protected eventTimeoutLimit = TIME_1_M * 3

  constructor (url: string, logger: Logger) {
    super()

    this.url = url
    this.logger = logger
  }

  connect () {
    this.logger.info(`ws: connecting to ${this.url} ...`)
    const ws = new WebSocket(this.url)

    ws.on('open', () => this.onOpen())
    ws.on('message', (message) => this.onMessage(message))
    ws.on('close', (code, reason) => this.onClose(code, reason))
    ws.on('error', (e) => this.onError(e))

    this.ws = ws
    this.heartbeatStatus = { id: 1, timer: null, history: [] }
    this.eventStatus = { timer: null, history: [] }
    this.txStatus = { txHash: '', waitedBlocks: 0 }
  }

  protected async onOpen () {
    this.logger.info('Connection established.')

    this.ws.send('{"id": 1, "jsonrpc": "2.0", "method": "subscribe", "params": ["new_tip_header"]}')
    this.heartbeat()
  }

  protected async onMessage (message: WebSocket.Data) {
    let data
    try {
      data = JSON.parse(message as string)
    } catch (e) {
      this.logger.error('Parse message failed, skip.')
      return
    }

    if (data.id && data.result?.number) {
      // Received pong message
      this.logger.debug(`Received pong[${data.id}]`)

      let status = this.heartbeatStatus
      let item = status.history.find((item) => {
        return item.id == data.id
      })
      if (item) {
        item.pongAt = Date.now()
      }

      // Send heartbeat every n seconds
      setTimeout(() => this.heartbeat(), TIME_5_S)
    } else if (data.method === 'subscribe' && data.params?.result) {
      // Received new block message
      let result
      try {
        result = JSON.parse(data.params.result)
      } catch (e) {
        this.logger.error('Parse params of message failed, skip.')
        return
      }

      this.logger.debug(`Received new block[${BigInt(result.number)}]`)

      let status = this.eventStatus
      clearTimeout(status.timer)

      this.emit('update', result)

      status.timer = setTimeout(async () => {
        this.logger.error(`There is no new block for ${this.eventTimeoutLimit} seconds.`)
        await notifyWithThrottle('event-timeout', TIME_1_M * 10, `There is no new block for ${this.eventTimeoutLimit} seconds.`)
      }, this.eventTimeoutLimit)
    }
  }

  protected async onClose (code: number, reason: string) {
    this.logger.warn('Connection closed, will retry connecting later.', { code, reason })

    setTimeout(() => {
      clearTimeout(this.eventStatus.timer)
      clearTimeout(this.heartbeatStatus.timer)
      this.connect()
    }, TIME_30_S)
  }

  protected async onError (err: Error) {
    this.logger.error(`Connection error occurred.(${err})`)
    await notifyWithThrottle('ws-error', TIME_1_M * 10, `Connection error occurred.(${err})`)
  }

  protected heartbeat () {
    let now = Date.now()
    let status = this.heartbeatStatus

    clearTimeout(status.timer)
    status.timer = setTimeout(async () => {
      await notifyWithThrottle('heartbeat', TIME_1_M, 'Connection timeout.')
      this.ws.terminate()
    }, TIME_30_S)

    // ⚠️ Different method may has performance issue, ensure testing on cloud
    this.ws.send(`{ "id": ${status.id}, "jsonrpc": "2.0", "method": "get_tip_header", "params": [] }`)

    this.logger.debug(`Send ping[${status.id}]`)

    if (status.history.length >= 120) {
      status.history.shift()
    }
    status.history.push({ id: status.id, pingAt: now, pongAt: 0 })
    status.id++
  }
}
