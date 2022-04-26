import fetch from 'node-fetch'
import { networkInterfaces } from 'os'

import config from '../config'
import { CellType, LOWEST_CELL_CAPACITY, SinceFlag, TIME_1_M } from '../const'
import { getCells, rpcFormat } from './rpc'
import { rootLogger } from '../log'

export function remove0x (hex: string) {
  if (hex.startsWith('0x')) {
    return hex.substring(2)
  }
  return hex
}

export function toHex(num: number | BigInt) {
  return `0x${num.toString(16)}`
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

export function dataToSince (data: BigInt, flag: SinceFlag) {
  let hex: string
  if (flag == SinceFlag.AbsoluteHeight) {
    hex = data.toString(16)
  } else {
    let buf = Buffer.alloc(8)
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
export async function getCkbPrice(): Promise<BigInt> {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=nervos-network&vs_currencies=usd')
  if (!res.ok) {
    throw new Error(`Fetch coingecko api failed: ${res.status} ${res.statusText}`)
  }

  let raw = '';
  let data = null;
  try {
    raw = await res.text()
    data = JSON.parse(raw)
  } catch (e) {
    e.extra_data = raw
    throw e
  }

  if (data?.['nervos-network']?.usd) {
    return BigInt(data?.['nervos-network']?.usd * 100 * 10000 | 0)
  }

  throw new Error(`Parse quote from the response of coingecko API failed, require manually updating code!`)
}

export async function collectInputs (lockScript: CKBComponents.Script, needCapacity: bigint) {
  const liveCells = await getCells(lockScript, 'lock', {output_data_len_range: ['0x0', '0x1']})

  const addressTotalCapacity = liveCells.map(cell => BigInt(cell.output.capacity)).reduce((prev, curr) => prev + curr, BigInt(0))
  if (addressTotalCapacity <= BigInt(10_000_000_000)) {
    const logger = rootLogger.child({ command: 'update', cell_type: 'unknown' })
    logger.error('The THQ service is about to run out of transaction fee.')
    notifyWithThrottle('collect-inputs-warning', TIME_1_M * 10, 'The THQ service is about to run out of transaction fee.', 'Please recharge as soon as possible.')
  }

  let inputs = []
  let totalCapacity = BigInt(0)
  for (let cell of liveCells) {
    inputs.push({
      previousOutput: rpcFormat().toOutPoint(cell.out_point),
      since: '0x0',
    })
    totalCapacity += BigInt(cell.output.capacity)
    if (totalCapacity >= needCapacity + BigInt(LOWEST_CELL_CAPACITY)) {
      break
    }
  }

  if (totalCapacity < needCapacity) {
    throw Error(`capacity not enough.(expected: ${needCapacity}, current: ${totalCapacity})`)
  }

  return { inputs, capacity: totalCapacity }
}

export async function notifyWecom(msg: string) {
  try {
    let res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${config.WECOM_API_KEY}`, {
      method: 'post',
      body: JSON.stringify({
        msgtype: 'markdown',
        markdown: {
          content: `Service ckb-time-generator error:\n
> Server IP: ${getCurrentIP()}
> CKB WebSocket URL: ${config.CKB_WS_URL}
> Reason: ${msg}`,
          // mentioned_list: ["@all"],
        }
      })
    })
    if (res.status >= 400) {
      console.error(`helper: send Wecom notify failed, response ${res.status} ${res.statusText}`)
    }
  } catch (e) {
    console.error('helper: send Wecom notify failed:', e)
  }
}

let thresholdSources: { [key: string]: { count: number, startAt: number } } = {};

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
export async function notifyWithThreshold(source: string, max_count: number, period: number, msg: string, how_to_fix = '') {
  let now = Date.now()
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
      await notifyLark(msg, how_to_fix)
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

let throttleSources = {};
export async function notifyWithThrottle(source: string, duration: number, msg: string, how_to_fix = '') {
  // Limit notify frequency.
  let now = Date.now()
  if (now - throttleSources[source] <= duration) {
    return
  }
  throttleSources[source] = now

  await notifyLark(msg, how_to_fix)
}

export async function notifyLark(msg: string, how_to_fix = '') {
  try {
    let content: any[] = [
      [{tag: 'text', un_escaped: true, text: `server_ip: ${getCurrentIP()}`}],
      [{tag: 'text', un_escaped: true, text: `ckb_ws_url: ${config.CKB_WS_URL}`}],
      [{tag: 'text', un_escaped: true, text: `reason: ${msg}`}],
      [{tag: 'text', un_escaped: true, text: `how to fix: ${how_to_fix}`}],
    ]
    if (process.env.NODE_ENV === 'production') {
      content.push([{tag: 'at', user_id: 'all'}])
    }

    let res = await fetch(`https://open.larksuite.com/open-apis/bot/v2/hook/${config.LARK_API_KEY}`, {
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
  } catch (e) {
    console.error('helper: send Lark notify failed:', e)
  }
}

export function getCurrentIP() {
  let nets = networkInterfaces()
  let address = 'parse failed';

  for (const name of Object.keys(nets)) {
    if (name.startsWith('eno') || name.startsWith('eth')) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          address = net.address
          break
        }
      }
    }
  }

  return address
}

export function sortLiveCells(cells: IndexerLiveCell[]): IndexerLiveCell[] {
  cells.sort((a, b) => {
    return a.block_number > b.block_number ? 1 : (a.block_number < b.block_number ? -1 : 0)
  })

  return cells
}
