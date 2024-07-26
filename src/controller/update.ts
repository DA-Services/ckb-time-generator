import { Arguments } from 'yargs'
import WebSocket from 'ws'
import { Logger } from 'winston'
import EventEmitter from 'events'

import config from '../config.js'
import { SinceFlag, SUM_OF_INFO_CELLS, TIME_1_M, TIME_30_S, TIME_5_S, THEORETIC_BLOCK_1_M } from '../const.js'
import { rootLogger } from '../log.js'
import {
  collectInputs,
  dataToSince, getCkbPrice,
  getTypeScriptOfIndexStateCell,
  getTypeScriptOfInfoCell,
  notifyWithThrottle,
  typeToCellType,
  toHex,
  notifyLark, notifyWithThreshold, fromHex,
} from '../utils/helper.js'
import {
  ckb,
  getCells, getLatestTimestamp,
  getTransaction,
  rpcFormat,
} from '../utils/rpc.js'
import { getTipBlockNumber } from '../utils/official-rpc.js'
import { IndexStateModel } from '../model/index_state_model.js'
import { InfoModel } from '../model/info_model.js'
import { EMPTY_WITNESS_ARGS } from '@nervosnetwork/ckb-sdk-utils/lib/const.js'

async function findIndexStateCell (logger: Logger, typeScript: CKBComponents.Script) {
  const indexStateCells = await getCells(typeScript, 'type')

  if (indexStateCells.length > 1) {
    // await notifyWithThrottle(logger, 'index-state-cells-error', TIME_1_M * 60, 'Found more than one IndexStateCells on-chain, please recycle redundant cells as soon as possible.')
    logger.warn('Found more than one IndexStateCells on-chain, please recycle redundant cells as soon as possible.')
  }

  const cell = indexStateCells[0]
  const model = IndexStateModel.fromHex(cell.output_data)

  if (model.total !== SUM_OF_INFO_CELLS) {
    // await notifyWithThrottle(logger, 'index-state-cells-error', TIME_1_M * 60, 'Total number of InfoCells is different from code and cell data, please update code as soon as possible.')
    logger.warn('Total number of InfoCells is different from code and cell data, please update code as soon as possible.')
  }

  return {
    out_point: cell.out_point,
    output: cell.output,
    model,
  }
}

async function findInfoCell (logger: Logger, typeScript: CKBComponents.Script, index: number) {
  const infoCells = await getCells(typeScript, 'type')

  if (infoCells.length > SUM_OF_INFO_CELLS) {
    // await notifyWithThrottle(logger, 'info-cells-error', TIME_1_M * 60, `Found more than ${SUM_OF_INFO_CELLS} InfoCells on-chain, please recycle redundant cells as soon as possible.`)
    logger.warn(`Found more than ${SUM_OF_INFO_CELLS} InfoCells on-chain, please recycle redundant cells as soon as possible.`)
  }

  const latestValue = InfoModel.fromHex(infoCells[infoCells.length - 1].output_data).infoData
  let to_update
  for (const cell of infoCells) {
    const model = InfoModel.fromHex(cell.output_data)
    if (model.index === index) {
      to_update = {
        out_point: cell.out_point,
        output: cell.output,
        model: model,
      }
      break
    }
  }

  return {
    latestValue,
    ...to_update
  }
}

export async function updateController (argv: Arguments<{ type: string }>) {
  const logger = rootLogger.child({ command: 'update', cell_type: argv.type })
  const cellType = typeToCellType(argv.type)
  const indexStateTypeScript = getTypeScriptOfIndexStateCell(cellType)
  const infoCellTypeScript = getTypeScriptOfInfoCell(cellType)

  const server = new Server(config.CkbWsUrl, logger)
  server.connect()

  // Global variables
  const maxWaitingBlocks = 5
  let waitedBlocks = 0
  let txHash = ''
  let cellData = BigInt(0)

  // The response of coingecko may fail sometimes, so we add a counter to determine if it is require to notice developer.
  server.on('update', (data: RPC.Header) => {
    (async () => {
      if (txHash && waitedBlocks <= maxWaitingBlocks) {
        logger.verbose(`Found pending transaction ${txHash}, check if transaction committed ...`)

        const tx = await getTransaction(txHash)
        // tx maybe null
        if (!tx || tx.txStatus.status !== 'committed') {
          logger.info(`${txHash} is pending, wait for it.`, { cell_data: cellData, tx_hash: txHash, waited_blocks: waitedBlocks })
          waitedBlocks++
          return
        }
      }

      const height = fromHex(data.number)
      if (server.tipHeight - height > config.Notification.maxTolerableBehindBlock) {
        logger.warn(`The CKB node is ${server.tipHeight - height} blocks left behind, stop updating cells.`, { cell_data: cellData, tx_hash: txHash, waited_blocks: waitedBlocks })
        // await notifyWithThrottle(this.logger, 'tip-height', TIME_1_M * 10, 'The CKB node is ${server.tipHeight - height} blocks left behind.', 'Restart the CKB node.')
        return
      }

      // Calculate new outputs_data of IndexStateCell and InfoCell
      let resultOfIndex: { out_point: RPC.OutPoint, output: RPC.CellOutput, model: IndexStateModel }
      try {
        resultOfIndex = await findIndexStateCell(logger, indexStateTypeScript)
      } catch (e) {
        logger.error(`Failed to find IndexStateCells: ${e.toString()}`)
        return
      }

      const { out_point: indexOutPoint, output: indexOutput, model: indexModel } = resultOfIndex
      indexModel.increaseIndex()

      let resultOfInfo: { out_point: RPC.OutPoint, output: RPC.CellOutput, model: InfoModel, latestValue: bigint }
      try {
        resultOfInfo = await findInfoCell(logger, infoCellTypeScript, indexModel.index)
      } catch (e) {
        logger.error(`Failed to find InfoCells: ${e.toString()}`)
        return
      }
      const { out_point: infoOutPoint, output: infoOutput, model: infoModel, latestValue } = resultOfInfo
      let since = '0x0'
      let lockScript
      let privateKey
      switch (argv.type) {
        case 'blocknumber':
          lockScript = config.Blocknumber.PayersLockScript
          privateKey = config.Blocknumber.PayersPrivateKey
          infoModel.infoData = BigInt(data.number)

          // Ensure that the blocknumber continues to increase.
          if (infoModel.infoData <= latestValue) {
            logger.info(`The node has been left behind, skip updating. current(${infoModel.infoData}) <=  latest(${latestValue}) .`, { cell_data: cellData, waited_blocks: waitedBlocks })
            return
          }

          since = dataToSince(infoModel.infoData, SinceFlag.AbsoluteHeight)
          break
        case 'timestamp':
          lockScript = config.Timestamp.PayersLockScript
          privateKey = config.Timestamp.PayersPrivateKey
          try {
            infoModel.infoData = await getLatestTimestamp(data.number)

            // Ensure that the timestamp continues to increase.
            if (infoModel.infoData <= latestValue) {
              logger.info(`The node has been left behind, skip updating. current(${infoModel.infoData}) <=  latest(${latestValue}) .`, { cell_data: cellData, waited_blocks: waitedBlocks })
              return
            }
          } catch (e) {
            await notifyWithThreshold(logger, 'fetch-timestamp-error', THEORETIC_BLOCK_1_M * 5, TIME_1_M * 5, `${e}`, 'Check if CKB node is offline and its JSON RPC is reachable.')
            return
          }
          since = dataToSince(infoModel.infoData, SinceFlag.AbsoluteTimestamp)
          break
        case 'quote':
          lockScript = config.Quote.PayersLockScript
          privateKey = config.Quote.PayersPrivateKey
          try {
            infoModel.infoData = await getCkbPrice(logger)
          } catch (e) {
            logger.error(`Failed to fetch the quote from exchanges, the error is: ${e}`)
            await notifyWithThreshold(logger, 'fetch-quote-error', THEORETIC_BLOCK_1_M * 10, TIME_1_M * 10, `${e}`, 'Check if the coingecko API(https://api.coingecko.com/api/v3/simple/price?ids=nervos-network&vs_currencies=usd) is available.')
            return
          }
          break
      }

      // Save the cell data for logging
      cellData = infoModel.infoData

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
        collected = await collectInputs(logger, lockScript, config.Fee.update)
        inputs = inputs.concat(collected.inputs)
      } catch (e) {
        if (e.toString().includes('capacity')) {
          logger.error(`Collect inputs failed, expected ${config.Fee.update} shannon but only ${collected.capacity} shannon found.`, { cell_data: cellData, waited_blocks: waitedBlocks })
          await notifyWithThreshold(logger, 'collect-inputs-error', THEORETIC_BLOCK_1_M * 5, TIME_1_M * 5, `Collect inputs failed, expected ${config.Fee.update} shannon but only ${collected.capacity} shannon found.`, 'Check if the balance of deploy address is enough.')
        } else {
          logger.error(`Collect inputs error.(${e.toString()})`, { cell_data: cellData, waited_blocks: waitedBlocks })
          await notifyWithThreshold(logger, 'collect-inputs-error', THEORETIC_BLOCK_1_M * 5, TIME_1_M * 5, `Collect inputs error.(${e.toString()})`, 'Check if ckb-indexer is offline and the get_cells interface is reachable.')
        }
        return
      }

      // Build outputs of transaction
      const outputs = [
        rpcFormat().toOutput(indexOutput),
        rpcFormat().toOutput(infoOutput),
      ]

      if (collected.capacity > config.Fee.update) {
        // Change redundant capacity
        outputs.push({
          capacity: toHex(collected.capacity - config.Fee.update),
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
        logger.error(`Load cell_deps from node RPC API failed.(${e})`, { cell_data: cellData, waited_blocks: waitedBlocks })
        await notifyWithThreshold(logger, 'load-cell-deps-error', THEORETIC_BLOCK_1_M * 5, TIME_1_M * 5, `Load cell_deps from node RPC API failed.(${e})`, 'Check if CKB node is offline and its JSON RPC is reachable.')
        return
      }

      let signedRawTx
      try {
        signedRawTx = ckb.signTransaction(privateKey)(rawTx)
      } catch (e) {
        logger.error(`Sign transaction failed.(${e})`, { cell_data: cellData, waited_blocks: waitedBlocks })
        return
      }

      try {
        txHash = await ckb.rpc.sendTransaction(signedRawTx, 'passthrough')
        waitedBlocks = 0

        logger.info(`Push transaction, tx hash: ${txHash}`, { cell_data: cellData, tx_hash: txHash, waited_blocks: waitedBlocks })
      } catch (err) {
        try {
          const data = JSON.parse(err.message)
          switch (data.code) {
            case -302:
            case -1107:
              // These error are caused by cell occupation, could retry automatically.
              logger.info(`Update cell failed, but can be ignored safely.(${data.code}: ${data.message})`, { cell_data: cellData, tx_hash: txHash, waited_blocks: waitedBlocks })
              return
            case -301:
              // Suppress the occupation error
              return
            case -1111:
              // Suppress the RBF rejection error
              return
            default:
              logger.error(`Update cell failed.(${data.code}: ${data.message})`, { cell_data: cellData, tx_hash: txHash, waited_blocks: waitedBlocks })
              await notifyWithThrottle(logger, 'update-error', TIME_1_M * 10, `Update cell failed.(${data.message})`, 'Try to find out what the error message means.')
          }
        } catch (e) {
          logger.error(`Update cell occurred unknown error.(${err})`, { cell_data: cellData, tx_hash: txHash, waited_blocks: waitedBlocks })
          await notifyWithThrottle(logger, 'update-error', TIME_1_M * 10, `Update cell occurred unknown error.(${err})`, 'Try to find out what the error message means.')

        }
      }
    })().catch(_ => {})

    return
  })
}

class Server extends EventEmitter {
  protected url: string
  protected logger: Logger
  protected ws: WebSocket

  protected heartbeatStatus: { id: number, timer: any, history: any[] }
  protected tipHeightStatus: { id: number, timer: any, history: any[] }
  protected eventStatus: { checkTipHeight_notify: any, checkTipHeight_warn: any, history: any[] }
  protected txStatus: { txHash: string, waitedBlocks: number }

  public tipHeight = BigInt(0)

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
    this.tipHeightStatus = { id: 1, timer: null, history: [] }
    this.eventStatus = { checkTipHeight_notify: null, checkTipHeight_warn: null, history: [] }
    this.txStatus = { txHash: '', waitedBlocks: 0 }

    this.checkTipHeight()
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
      if (data.id.startsWith('heartbeat-')) {
        // Received pong message
        this.logger.debug(`Received pong[${data.id}]`)

        const status = this.heartbeatStatus
        const item = status.history.find((item) => {
          return item.id == data.id
        })
        if (item) {
          item.pongAt = Date.now()
        }

        // Send heartbeat every n seconds
        setTimeout(() => this.heartbeat(), TIME_5_S)
      } else {
        this.logger.error(`Unknown message, skip. id: ${data.id}`)
      }
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

      const status = this.eventStatus
      clearTimeout(status.checkTipHeight_notify)
      clearTimeout(status.checkTipHeight_warn)

      this.emit('update', result)

      // This error reports only once if no message received, so DO NOT use notifyWithThrottle to report.
      // The key point here is eventTimeoutLimit, enlarge it is the only way
      status.checkTipHeight_notify = setTimeout(async () => {
        await notifyLark(
          this.logger,
          `There is no new block for ${config.Notification.newBlockNotifyLimit} seconds.`,
          `This problem occasionally occurs and can be safely ignored, a formal warning will be triggered afer ${config.Notification.newBlockWarnLimit} seconds.`,
          false,
        )

      }, config.Notification.newBlockNotifyLimit * 1000)
      status.checkTipHeight_warn = setTimeout(async () => {
        await notifyLark(
          this.logger,
          `There is no new block for ${config.Notification.newBlockWarnLimit} seconds.`,
          'Check if CKB node is offline and the get_tip_header interface is reachable.',
          true,
        )
      }, config.Notification.newBlockWarnLimit * 1000)
    }
  }

  protected async onClose (code: number, reason: string) {
    this.logger.warn(`Connection closed, will retry connecting later.(${code}: ${reason})`)

    setTimeout(() => {
      clearTimeout(this.eventStatus.checkTipHeight_notify)
      clearTimeout(this.eventStatus.checkTipHeight_warn)
      clearTimeout(this.heartbeatStatus.timer)
      this.connect()
    }, TIME_30_S)
  }

  protected async onError (err: Error) {
    this.logger.error(`Connection error occurred.(${err})`)
    // No longer need to notify, because the service will restart automatically when no new block is received for a while.
    // await notifyWithThrottle(this.logger, 'ws-error', TIME_1_M * 10, `Connection error occurred.(${err})`, 'Check if CKB node is offline and the get_tip_header interface is reachable.')
  }

  protected heartbeat () {
    const now = Date.now()
    const status = this.heartbeatStatus

    // ⚠️ Temporarily disable the notification, it is now only used for debugging.
    // The reason is that the server is now monitored by scripts/ckb-node-monit.mjs, this script will
    // clearTimeout(status.timer)
    // status.timer = setTimeout(async () => {
    //   await notifyWithThrottle(this.logger, 'heartbeat', TIME_1_M * 10, 'Connection timeout.', 'Check if CKB node is offline and the get_tip_header interface is reachable.')
    //   this.ws.terminate()
    // }, TIME_30_S)

    // ⚠️ Different method may has performance issue, ensure testing on cloud
    this.ws.send(`{ "id": "heartbeat-${status.id}", "jsonrpc": "2.0", "method": "get_tip_header", "params": [] }`)

    this.logger.debug(`Send ping[${status.id}]`)

    if (status.history.length >= 120) {
      status.history.shift()
    }
    status.history.push({ id: status.id, pingAt: now, pongAt: 0 })
    status.id++
  }

  protected async checkTipHeight () {
    const now = Date.now()
    const status = this.tipHeightStatus

    this.logger.debug(`Try get_tip_block_number from ${config.CkbOfficialNodeRpc}.`)

    let tipHeight = BigInt(0)
    try {
      tipHeight = await getTipBlockNumber()
      this.tipHeight = tipHeight

      if (status.history.length >= 10) {
        status.history.shift()
      }
      status.history.push({ id: status.id, tip_height: tipHeight, at: now })
    } catch (e) {
      // await notifyWithThrottle(this.logger, 'get-tip-height-error', TIME_1_M * 10, `Get tip height failed.(${e})`, 'Check if CKB node is offline and the get_tip_header interface is reachable.')
      this.logger.error(`Get tip height failed.(${e})`)
    }

    status.id++

    clearTimeout(status.timer)
    status.timer = setTimeout(() => this.checkTipHeight(), TIME_5_S * 2)
  }
}
