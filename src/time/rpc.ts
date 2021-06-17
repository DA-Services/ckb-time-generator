// @ts-ignore
import { CKBComponents } from '@nervosnetwork/ckb-types'
import fetch from 'node-fetch'
import config from '../config'

/**
 *
 * @param script
 * @param type 'type'|'lock'
 * @param filter
 */
export async function getCells (script: CKBComponents.Script, type, filter?): Promise<CKBComponents.Cell[]> {
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
      '0x200',
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
    res = await res.json()
    return res.result.objects
  } catch (error) {
    console.error('error', error)
  }
}

