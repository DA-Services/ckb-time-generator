const CellDeps = [
  // index-state-cell-type & info-cell-type, this need to be updated every time the contracts changed
  // {
  //   outPoint: { txHash: '0x73d85dde3923672f0b157f0ba119e891065ecdf6d07d024be6240b8da68600a5', index: '0x0' },
  //   depType: 'depGroup',
  // },
  // index-state-cell-type
  {
    outPoint: { txHash: '0xe9116d651c371662b6e29e2102422e23f90656b8619df82c48b782ff4db43a37', index: '0x0' },
    depType: 'code',
  },
  // info-cell-type
  {
    outPoint: { txHash: '0x5fe11c5033f7494667f23ae8759762f196105eb3240d26a65f805831b4b26a16', index: '0x0' },
    depType: 'code',
  },
  // ckb signall lock
  {
    outPoint: { txHash: '0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c', index: '0x0' },
    depType: 'depGroup',
  },
]

const IndexStateTypeScript = {
  codeHash: '0x3a468d53352eb855521dabed0dc7036929bfe72766ad58f801edfbae564f7b43',
  hashType: 'type',
  args: '0x',
}

const InfoTypeScript = {
  codeHash: '0x9e537bf5b8ec044ca3f53355e879f3fd8832217e4a9b41d9994cf0c547241a79',
  hashType: 'type',
  args: '0x',
}

export default {
  CKB_NODE_RPC: 'http://127.0.0.1:8114',
  CKB_NODE_INDEXER: 'http://127.0.0.1:8116',
  CKB_WS_URL: 'ws://127.0.0.1:28114',
  WECOM_API_KEY: '',
  LARK_API_KEY: '',

  loglevel: 'info',

  fee: {
    create: BigInt(1000),
    update: BigInt(1000),
  },

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
