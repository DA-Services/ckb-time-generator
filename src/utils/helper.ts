import fetch from 'node-fetch'
import { Logger } from 'winston'

import config from '../config'
import { CellType, EXCHANGES, LOWEST_CELL_CAPACITY, SinceFlag, TIME_1_M } from '../const'
import { getCells, rpcFormat } from './rpc'
import { getCurrentServer } from './env'

export function remove0x (hex: string) {
  if (hex.startsWith('0x')) {
    return hex.substring(2)
  }
  return hex
}

export function toHex(num: number | bigint) {
  return `0x${num.toString(16)}`
}

export function fromHex(hex: string) {
  if (hex.startsWith('0x')) {
    hex = hex.substring(2)
  }
  return BigInt(`0x${hex}`)
}

export function typeToCellType(type: string) {
  switch(type) {
    case 'timestamp':
      return CellType.Timestamp
    case 'blocknumber':
      return CellType.BlockNumber
    case 'quote':
      return CellType.Quote
    default:
      throw new Error(`Can not find cell type from type: ${type}`)
  }
}

export function getTypeScriptOfInfoCell(type: CellType): CKBComponents.Script {
  return {
    ...config.InfoTypeScript,
    args: type,
  }
}

export function getTypeScriptOfIndexStateCell(type: CellType): CKBComponents.Script {
  return {
    ...config.IndexStateTypeScript,
    args: type,
  }
}

export function dataToSince (data: bigint, flag: SinceFlag) {
  let hex: string
  if (flag == SinceFlag.AbsoluteHeight) {
    hex = data.toString(16)
  } else {
    const buf = Buffer.alloc(8)
    buf.writeBigUInt64BE(data as bigint)
    hex = buf.toString('hex')
    hex = flag + hex.slice(2)
  }

  return `0x${hex}`
}


/**
 * get ckb price
 * precision: 1/10000 of 1 cent, 0.000001
 */
export async function getCkbPrice(logger: Logger): Promise<bigint> {
  // Try to get the quote of CKB/USDT from exchanges, break when it is successful at the first time.
  let price = -1;
  for (const exchange of EXCHANGES) {
    try {
      const ticker = await exchange.fetchTicker('CKB/USDT')
      // The close price for last 24 hours, for more details please go to https://docs.ccxt.com/en/latest/manual.html#ticker-structure
      price = ticker.close
      break
    } catch (err) {
      logger.error(`Query the quote from ${exchange.name} failed, try the next exchange.`)
    }
  }

  if (price <= 0) {
    throw new Error('Can not get a valid quote from any of the pre-defined exchange, require manually updating code!')
  }

  return BigInt(Math.floor(price * 100 * 10000))
}

export async function collectInputs (logger: Logger, lockScript: CKBComponents.Script, needCapacity: bigint) {
  const liveCells = await getCells(lockScript, 'lock', {output_data_len_range: ['0x0', '0x1']})

  const addressTotalCapacity = liveCells.map(cell => BigInt(cell.output.capacity)).reduce((prev, curr) => prev + curr, BigInt(0))
  if (addressTotalCapacity <= BigInt(10_000_000_000)) {
    logger.error('The THQ service is about to run out of transaction fee.')
    notifyWithThrottle(logger, 'collect-inputs-warning', TIME_1_M * 10, 'The THQ service is about to run out of transaction fee.', 'Please recharge as soon as possible.')
  }

  const inputs = []
  let totalCapacity = BigInt(0)
  for (const cell of liveCells) {
    inputs.push({
      previousOutput: rpcFormat().toOutPoint(cell.out_point),
      since: '0x0',
    })
    totalCapacity += BigInt(cell.output.capacity)
    if (totalCapacity >= needCapacity + LOWEST_CELL_CAPACITY) {
      break
    }
  }

  if (totalCapacity < needCapacity) {
    throw Error(`capacity not enough.(expected: ${needCapacity}, current: ${totalCapacity})`)
  }

  return { inputs, capacity: totalCapacity }
}

const thresholdSources: { [key: string]: { count: number, startAt: number } } = {};

/**
 * Send notification only when it happens multiple times in period
 *
 * @param {string} source
 * @param {number} max_count
 * @param {number} period
 * @param {string} msg
 * @param {string} how_to_fix
 * @returns {Promise<void>}
 */
export async function notifyWithThreshold(logger: Logger, source: string, max_count: number, period: number, msg: string, how_to_fix = '') {
  const now = Date.now()
  if (thresholdSources[source]) {
    let { count, startAt } = thresholdSources[source];
    if (now - startAt <= period) {
      // Continue counting in a specific period
      count += 1
    } else {
      // Reset counting if out of the period
      count = 1
      startAt = now
    }

    if (count > max_count) {
      // Send notification if it gets out of the max count.
      thresholdSources[source] = null
      await notifyLark(logger, msg, how_to_fix)
    } else {
      // Suppress notification if it still does not reach the max count.
      thresholdSources[source] = { count, startAt }
    }
  } else {
    thresholdSources[source] = {
      count: 1,
      startAt: now
    }
  }
}

const throttleSources = {};
export async function notifyWithThrottle(logger: Logger, source: string, duration: number, msg: string, how_to_fix = '') {
  // Limit notify frequency.
  const now = Date.now()
  if (now - throttleSources[source] <= duration) {
    return
  }
  throttleSources[source] = now

  await notifyLark(logger, msg, how_to_fix)
}

export async function notifyLark(logger: Logger, msg: string, how_to_fix = '', should_at = true) {
  try {
    const content: any[] = [
      [{tag: 'text', un_escaped: true, text: `server: ${getCurrentServer()}`}],
      [{tag: 'text', un_escaped: true, text: `ckb_ws_url: ${config.CkbWsUrl}`}],
      [{tag: 'text', un_escaped: true, text: `reason: ${msg}`}],
      [{tag: 'text', un_escaped: true, text: `how to fix: ${how_to_fix}`}],
    ]
    if (process.env.NODE_ENV === 'mainnet' && should_at) {
      content.push([{tag: 'at', user_id: 'all'}])
      const res = await fetch(`https://open.larksuite.com/open-apis/bot/v2/hook/${config.LarkApiKey}`, {
        method: 'post',
        body: JSON.stringify({
          email: 'xieaolin@gmail.com',
          msg_type: 'post',
          content: {
            post: {
              zh_cn: {
                title: `=== THQ Node 服务告警 (${process.env.NODE_ENV}) ===`,
                content,
              }
            },
          }
        })
      })

      if (res.status >= 400) {
        console.error(`helper: send Lark notify failed, response ${res.status} ${res.statusText}`)
      }
    } else {
      logger.warn(`msg: ${msg}, how_to_fix: ${how_to_fix}`)
    }
  } catch (e) {
    console.error('helper: send Lark notify failed:', e)
  }
}

export function sortLiveCells(cells: IndexerLiveCell[]): IndexerLiveCell[] {
  cells.sort((a, b) => {
    return a.block_number > b.block_number ? 1 : (a.block_number < b.block_number ? -1 : 0)
  })

  return cells
}
