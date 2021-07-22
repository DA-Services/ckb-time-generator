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
    outPoint: { txHash: '0x73d85dde3923672f0b157f0ba119e891065ecdf6d07d024be6240b8da68600a5', index: '0x0' },
    depType: 'depGroup',
  },
  // ckb signall lock
  {
    outPoint: { txHash: '0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', index: '0x0' },
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
  CKB_NODE_RPC: 'http://172.31.97.75:8114',
  CKB_NODE_INDEXER: 'http://172.31.97.75:8116',
  CKB_WS_URL: 'ws://172.31.97.75:8118',
  WECOM_API_KEY: '',

  infoDataType: INFO_DATA_TYPE.arbitrage,

  PayersLockScript, // currently AlwaysSuccessLockScript, should be changed to our own lock script to prevent others' attack todo:
  PayersPrivateKey,
  CellDeps,
  IndexStateTypeScript,
  InfoTypeScript,
}
