import { INFO_DATA_TYPE } from '../src/utils/const'

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
  codeHash: '0xf47e324a660f35d453ae474a0e12acbfd1adadab72e8fc1ecc0ea7de3c96032a',
  hashType: 'type',
  args: '0x',
}

const InfoTypeScript = {
  codeHash: '0x2e0e5b790cfb346bddc0e82a70f785e90d1537bbfdbdd25f6a3617cc760f887b',
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
  LARK_API_KEY: '',

  infoDataType: INFO_DATA_TYPE.arbitrage,

  CellDeps,
  IndexStateTypeScript,
  InfoTypeScript,

  timestamp: {
    PayersLockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      hashType: 'type',
      args: '0x2228dae340f587647362d31e3f04d7a51f8168dc',
    },
    PayersPrivateKey: '',
  },
  blocknumber: {
    PayersLockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      hashType: 'type',
      args: '0xfed559f2f93e5e7958d8a62b0b148cb18bc484bf',
    },
    PayersPrivateKey: '',
  },
  quote: {
    PayersLockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      hashType: 'type',
      args: '0xc45a83ea851eae30307ff47918ca3d2dabca7e52',
    },
    PayersPrivateKey: '',
  }
}
