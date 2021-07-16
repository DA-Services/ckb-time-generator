import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '',
  hashType: 'type',
  args: '',
}

const PayersPrivateKey = ''

const CellDeps = [
  // index-state-cell-type & info-cell-type, this need to be updated every time the contracts changed
  {
    outPoint: { txHash: '0x81cc4a241bd376071de687a60c1dc27761c2d2604999447bad82451ec80e6ec4', index: '0x0' },
    depType: 'depGroup',
  },
  // ckb signall lock
  {
    outPoint: { txHash: '0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37', index: '0x0' },
    depType: 'depGroup',
  },
]

const IndexStateTypeScript = {
  codeHash: '',
  hashType: 'type',
  args: '0x',
}

const InfoTypeScript = {
  codeHash: '',
  hashType: 'type',
  args: '0x',
}

// ⚠️ rebuild is required for dev:* scripts, because node-config do not recognise typescript files.
console.log('using config: default')

export default {
  CKB_NODE_RPC: 'http://127.0.0.1:8114',
  CKB_NODE_INDEXER: 'http://127.0.0.1:8116',
  CKB_WS_URL: 'ws://127.0.0.1:8118',

  infoDataType: INFO_DATA_TYPE.arbitrage,

  PayersLockScript, // currently AlwaysSuccessLockScript, should be changed to our own lock script to prevent others' attack todo:
  PayersPrivateKey,
  CellDeps,
  IndexStateTypeScript,
  InfoTypeScript,
}
