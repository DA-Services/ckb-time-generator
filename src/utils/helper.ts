// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import config from '../config'
import { IndexStateModel } from '../model/index_state_model'
import { InfoModel } from '../model/info_model'
import { INFO_CELL_CAPACITY } from './const'
import { parseIndex, toHex, uint32ToBe } from './hex'
import { getCells } from './rpc'
import fetch from 'node-fetch'
import { networkInterfaces } from 'os'

export async function generateIndexStateOutput (args) {
  return {
    capacity: toHex(INFO_CELL_CAPACITY),
    lock: config.PayersLockScript,
    type: {
      ...config.IndexStateTypeScript,
      args,
    },
  }
}

export async function generateInfoOutput (args) {
  return {
    capacity: toHex(INFO_CELL_CAPACITY),
    lock: config.PayersLockScript,
    type: {
      ...config.InfoTypeScript,
      args
    }
  }
}

export async function getIndexStateCell (): Promise<{indexStateCell: CKBComponents.Cell, indexState: IndexStateModel}> {
  const indexStateCells = await getCells(config.IndexStateTypeScript, 'type')

  if (!indexStateCells || indexStateCells.length === 0) {
    console.warn(`helper: The amount of IndexStateCell is 0, will create one.`)
    return {
      indexStateCell: null,
      indexState: null,
    }
  }

  if (indexStateCells.length > 1) {
    console.error(`helper: The amount of IndexStateCell is bigger than 1: ${indexStateCells.length}`)
  }

  const indexStateCell = indexStateCells[0]
  const indexState = IndexStateModel.fromData(indexStateCell.output_data)
  return {
    indexStateCell,
    indexState: indexState
  }
}

export async function getInfoCell (infoCellIndex): Promise<{infoCell: CKBComponents.Cell, infoModel: InfoModel}> {
  let infoCells = await getCells(config.InfoTypeScript, 'type')

  if (infoCells && infoCells.length !== 0) {
    const infoCell = infoCells.find(cell => parseIndex(cell.output_data) === infoCellIndex)

    if (infoCell) {
      const infoModel = InfoModel.fromHex(infoCell.output_data)

      return {
        infoCell,
        infoModel: infoModel,
      }
    }
  }

  return {
    infoCell: null,
    infoModel: null,
  }
}

export const collectInputs = (liveCells, needCapacity, since) => {
  let inputs = []
  let sum = BigInt(0)
  for (let cell of liveCells) {
    inputs.push({
      previousOutput: {
        txHash: cell.out_point.tx_hash,
        index: cell.out_point.index,
      },
      since,
    })
    sum = sum + BigInt(cell.output.capacity)
    if (sum >= needCapacity) {
      break
    }
  }

  if (sum < needCapacity) {
    throw Error(`capacity not enough. (expected: ${needCapacity}, current: ${sum})`)
  }

  return {inputs, capacity: sum}
}

export const generateTimestampSince = timestamp => {
  // TODO temporarily convert bigint to number, should refactor to buffer in the future
  return `0x40000000${uint32ToBe(parseInt(timestamp))}`
}

export const generateBlockNumberSince = (blockNumber: BigInt) => {
  return toHex(blockNumber)
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

export async function notifyLark(msg: string) {
  try {
    let content: any[] = [
      [{tag: 'text', un_escaped: true, text: `server_ip: ${getCurrentIP()}`}],
      [{tag: 'text', un_escaped: true, text: `ckb_ws_url: ${config.CKB_WS_URL}`}],
      [{tag: 'text', un_escaped: true, text: `reason: ${msg}`}],
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
  let address;

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
