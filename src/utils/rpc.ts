import CKB from '@nervosnetwork/ckb-sdk-core'
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
        with_data: true,
      },
      'asc',
      '0x64',
    ],
  }

  const body = JSON.stringify(payload, null, '  ')
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
}

export async function getTransaction(txHash: string): Promise<CKBComponents.TransactionWithStatus> {
  return ckb.rpc.getTransaction(txHash)
}

export async function getBlockNumber(blockNumber: string | bigint): Promise<CKBComponents.Block> {
  return ckb.rpc.getBlockByNumber(blockNumber)
}

export async function getTipHeader() {
  return ckb.rpc.getTipHeader()
}

export async function getHeaderByNumber (number: string | bigint) {
  return ckb.rpc.getHeaderByNumber(number)
}

export async function getLatestTimestamp (number: string | bigint) {
  //The median block time calculated from the past 37 blocks timestamp
  const medianNumber = BigInt(number) - BigInt(18)
  const { timestamp } = await ckb.rpc.getHeaderByNumber(medianNumber)
  return BigInt(timestamp) / BigInt(1000)
}

export function rpcFormat () {
  return ckb.rpc.resultFormatter
}
