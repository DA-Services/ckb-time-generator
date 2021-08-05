import CKB from '@nervosnetwork/ckb-sdk-core'
// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import fetch from 'node-fetch'
import config from '../config'

export const ckb = new CKB(config.CKB_NODE_RPC)

/**
 *
 * @param script
 * @param type 'type'|'lock'
 * @param filter
 */
export async function getCells (script: CKBComponents.Script, type, filter?): Promise<IndexerLiveCell[]> {
  let payload = {
    id: 1,
    jsonrpc: '2.0',
    method: 'get_cells',
    params: [
      {
        script: {
          code_hash: script.codeHash,
          hash_type: script.hashType,
          args: script.args,
        },
        script_type: type,
        filter: filter,
      },
      'asc',
      '0xff',
    ],
  }

  const body = JSON.stringify(payload, null, '  ')
  try {
    let res = await fetch(config.CKB_NODE_INDEXER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })
    let data = await res.json()

    if (data.error) {
      throw new Error(`get_cells response error.(code: ${data.error.code}, message: ${data.error.message})`)
    }

    return data.result.objects

  } catch (error) {
    console.error('error', error)
  }
}

export async function getTransaction(txHash: string): Promise<CKBComponents.TransactionWithStatus> {
  return ckb.rpc.getTransaction(txHash)
}

export async function getBlockNumber(blockNumber: string | bigint): Promise<CKBComponents.Block> {
  return ckb.rpc.getBlockByNumber(blockNumber)
}

export async function getLatestBlockNumber () {
  const number = await ckb.rpc.getTipBlockNumber()
  return BigInt(number)
}

export async function getLatestTimestamp () {
  const tipBlockNumber = await getLatestBlockNumber()
  //The median block time calculated from the past 37 blocks timestamp
  const number = tipBlockNumber - BigInt(18)
  const {timestamp} = await ckb.rpc.getHeaderByNumber(number)
  return BigInt(Math.floor(parseInt(timestamp) / 1000))
}
