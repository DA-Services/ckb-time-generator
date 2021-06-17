const ALWAYS_SUCCESS_TYPE_ARGS = process.env.ALWAYS_SUCCESS_TYPE_ARGS || '0x'

const AlwaysSuccessLockScript = {
  codeHash: '0xd483925160e4232b2cb29f012e8380b7b612d71cf4e79991476b6bcf610735f6',
  hashType: 'data',
  args: ALWAYS_SUCCESS_TYPE_ARGS,
}

const PayersLockScript = AlwaysSuccessLockScript

const AlwaysSuccessDep = {
  outPoint: { txHash: '0x6cb20b88912311e6bba89a5fcfc53cfebcc39b99c3cce0796ce3e485a5d47011', index: '0x0' },
  depType: 'code',
}

const IndexStateTypeScript = {
  codeHash: '0x57084ccd1e68f78a3b3477df67557049620aa5a5e0ad35239c82f3313865d997',
  hashType: 'type',
  args: '0x',
}

const TimestampIndexStateDep = {
  outPoint: { txHash: '0x9a58067d1c4fadca2577be74d95add7fd3f19dad13b1017837984ecd4fff641d', index: '0x0' },
  depType: 'code',
}

const TimestampInfoTypeScript = {
  codeHash: '0xe4fd6f46ab1fd3d5b377df9e2d4ea77e3b52f53ac3319595bb38d097ea051cfd',
  hashType: 'type',
  args: '0x',
}

const TimestampInfoDep = {
  outPoint: { txHash: '0xcd010a6064892a038556713ba254c73a193b361d782bf436ffd6ee4720689eb0', index: '0x0' },
  depType: 'code',
}

const BlockNumberIndexStateTypeScript = {
  codeHash: '0x6cc39193430aa80afc3daf728e7959acddc7e8fec96e95cc9c63c85f738c1b8f',
  hashType: 'type',
  args: '0x',
}

const BlockNumberIndexStateDep = {
  outPoint: { txHash: '0x2f64766b60b21d574a79be958a6e2af97ddb8c9daf426e2736d6926fd8ea8922', index: '0x0' },
  depType: 'code',
}

const BlockNumberInfoTypeScript = {
  codeHash: '0x5f6a4cc2cd6369dbcf38ddfbc4323cf4695c2e8c20aed572b5db6adc2faf9d50',
  hashType: 'type',
  args: '0x',
}

const BlockNumberInfoDep = {
  outPoint: { txHash: '0x70bfc41d9bfb779e5288fbfe10b12a98f1832c4759bd2b56d26bbe0387be0b14', index: '0x0' },
  depType: 'code',
}

export default {
  CKB_NODE_RPC: 'http://localhost:8114',
  CKB_NODE_INDEXER: 'http://localhost:8116',
  CKB_WS_URL:'ws://localhost:8118',
  ALWAYS_SUCCESS_LOCK_ARGS:'0x',

  BLOCKS_INTERVAL: 3,

  PayersLockScript, // AlwaysSuccessLockScript
  IndexStateDep: TimestampIndexStateDep,
  IndexStateTypeScript: IndexStateTypeScript, // TimestampIndexStateTypeScript
  InfoDep: TimestampInfoDep,
  InfoTypeScript: TimestampInfoTypeScript,

  AlwaysSuccessDep,
  AlwaysSuccessLockScript,
  BlockNumberIndexStateTypeScript,
  BlockNumberIndexStateDep,
  BlockNumberInfoTypeScript,
  BlockNumberInfoDep,

  since: function (timestamp, blockNumber): string|void {}
}