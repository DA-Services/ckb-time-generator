require('dotenv').config()

const CKB_NODE_RPC = process.env.CKB_NODE_RPC || 'http://localhost:8114'
const CKB_NODE_INDEXER = process.env.CKB_NODE_INDEXER || 'http://localhost:8116'
const CKB_WS_URL = process.env.CKB_WS_URL || 'ws://localhost:8118'
const ALWAYS_SUCCESS_LOCK_ARGS = process.env.ALWAYS_SUCCESS_LOCK_ARGS || '0x'

const AlwaysSuccessLockScript = {
  codeHash: '0xd483925160e4232b2cb29f012e8380b7b612d71cf4e79991476b6bcf610735f6',
  hashType: 'data',
  args: ALWAYS_SUCCESS_LOCK_ARGS,
}

const AlwaysSuccessDep = {
  outPoint: { txHash: '0x6cb20b88912311e6bba89a5fcfc53cfebcc39b99c3cce0796ce3e485a5d47011', index: '0x0' },
  depType: 'code',
}

const TimestampIndexStateTypeScript = {
  codeHash: '0x3e0391edb163f72aa2982aa34ab44ab17ad96304acb824c944458c8f27f5542f',
  hashType: 'type',
  args: '0x',
}

const TimestampIndexStateDep = {
  outPoint: { txHash: '0x3a161f18adb54c6fb9b0fabf826ceaaa029d2707b62156f8415476f7aa71f45f', index: '0x0' },
  depType: 'code',
}

const TimestampInfoTypeScript = {
  codeHash: '0xd78423449320291c41adcce741276c47df1dbb0bca212d0017db66297be88f19',
  hashType: 'type',
  args: '0x',
}

const TimestampInfoDep = {
  outPoint: { txHash: '0xc0f2b262c8dbd5c8da3376cf81f3d3c69582fefcc3eba36e88f708c1a4d505fe', index: '0x0' },
  depType: 'code',
}

const BlockNumberIndexStateTypeScript = {
  codeHash: '0x76c781c3b8d9ed0b69726dded5bb7d063d6f7d70dc0b495d87c475cbad9165e1',
  hashType: 'type',
  args: '0x',
}

const BlockNumberIndexStateDep = {
  outPoint: { txHash: '0xcb9b40b606b0e2382f2008a47e807b60d2ff262ea9df7502ca009feb72ded923', index: '0x0' },
  depType: 'code',
}

const BlockNumberInfoTypeScript = {
  codeHash: '0x212dfa132279685e5d6faef8c1069c8d46d1f1d63f3e0a9ddbd7efc962e968a4',
  hashType: 'type',
  args: '0x',
}

const BlockNumberInfoDep = {
  outPoint: { txHash: '0xfee800f26400f6280efe85e1884e88554d55c4f9c2598aa67b47a00baee63647', index: '0x0' },
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
