require('dotenv').config()

const CKB_NODE_RPC = process.env.CKB_NODE_RPC || 'http://localhost:8114'
const CKB_NODE_INDEXER = process.env.CKB_NODE_INDEXER || 'http://localhost:8116'
const CKB_WS_URL = process.env.CKB_WS_URL || 'ws://localhost:8118'

// address: ckt1qt2g8yj3vrjzx2evk20szt5rszmmvykhrn6w0xv3ga4khnmpqu6lvuqp5us
const AlwaysSuccessLockScript = {
  codeHash: '0xd483925160e4232b2cb29f012e8380b7b612d71cf4e79991476b6bcf610735f6',
  hashType: 'data',
  args: '0x',
}

const AlwaysSuccessDep = {
  outPoint: { txHash: '0x6cb20b88912311e6bba89a5fcfc53cfebcc39b99c3cce0796ce3e485a5d47011', index: '0x0' },
  depType: 'code',
}

const TimestampIndexStateTypeScript = {
  codeHash: '0x57084ccd1e68f78a3b3477df67557049620aa5a5e0ad35239c82f3313865d997',
  hashType: 'type',
  args: '0x',
}

const TimestampIndexStateDep = {
  outPoint: { txHash: '0x9a58067d1c4fadca2577be74d95add7fd3f19dad13b1017837984ecd4fff641d', index: '0x0' },
  depType: 'code',
}

const TimestampInfoTypeScript = {
  codeHash: '0x234ad0fdf1cd271d421eb0f4b18b6b62f540bf8f0e858e234aa8656888dab8d1',
  hashType: 'type',
  args: '0x',
}

const TimestampInfoDep = {
  outPoint: { txHash: '0xf3c13ffbaa1d34b8fac6cd848fa04db2e6b4e2c967c3c178295be2e7cdd77164', index: '0x0' },
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
  codeHash: '0x9e609ff599d702c3574c2f4e9ef5a1a995d87612a1fa600bc55f11c199746894',
  hashType: 'type',
  args: '0x',
}

const BlockNumberInfoDep = {
  outPoint: { txHash: '0x711bb5cec27b3a5c00da3a6dc0772be8651f7f92fd9bf09d77578b29227c1748', index: '0x0' },
  depType: 'code',
}

module.exports = {
  CKB_NODE_RPC,
  CKB_NODE_INDEXER,
  CKB_WS_URL,
  AlwaysSuccessLockScript,
  AlwaysSuccessDep,
  TimestampIndexStateTypeScript,
  TimestampIndexStateDep,
  TimestampInfoTypeScript,
  TimestampInfoDep,
  BlockNumberIndexStateTypeScript,
  BlockNumberIndexStateDep,
  BlockNumberInfoTypeScript,
  BlockNumberInfoDep,
}
