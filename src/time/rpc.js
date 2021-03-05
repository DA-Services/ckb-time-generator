const fetch = require('node-fetch')
const { CKB_NODE_INDEXER } = require('../utils/config')

const getCells = async (script, type, filter) => {
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
      '0x64',
    ],
  }
  const body = JSON.stringify(payload, null, '  ')
  try {
    let res = await fetch(CKB_NODE_INDEXER, {
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

const collectInputs = (liveCells, needCapacity, since) => {
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
    throw Error('Capacity not enough')
  }
  return { inputs, capacity: sum }
}

module.exports = {
  getCells,
  collectInputs,
}
