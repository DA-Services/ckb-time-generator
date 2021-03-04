require('dotenv').config()

const CKB_NODE_RPC = process.env.CKB_NODE_RPC || 'http://localhost:8114'
const CKB_NODE_INDEXER = process.env.CKB_NODE_INDEXER || 'http://localhost:8116'

const TIME_INFO_UPDATE_INTERVAL = 60

// address: ckt1qt2g8yj3vrjzx2evk20szt5rszmmvykhrn6w0xv3ga4khnmpqu6lvuqp5us
const AlwaysSuccessLockScript = {
  codeHash: '0xd483925160e4232b2cb29f012e8380b7b612d71cf4e79991476b6bcf610735f6',
  hashType: 'data',
  args: '0x',
}

let AlwaysSuccessDep = {
  outPoint: { txHash: '0x6cb20b88912311e6bba89a5fcfc53cfebcc39b99c3cce0796ce3e485a5d47011', index: '0x0' },
  depType: 'code',
}

let TimeIndexStateTypeScript = {
  codeHash: '0xb9eb6d06878a12ddd9922680ba115587eba0a283b852588ecc5133c5d34c17ea',
  hashType: 'type',
  args: '0x',
}

const TimeIndexStateDep = {
  outPoint: { txHash: '0x24f2866e13a050a6cf2cb289856902554dbfe33c28721231c531ad0f9619c53d', index: '0x0' },
  depType: 'code',
}

let TimeInfoTypeScript = {
  codeHash: '0x970cb785e77973d6da6def4f3172ce1847952864cdcceb5b884a8b82bd3b8794',
  hashType: 'type',
  args: '0x',
}

const TimeInfoDep = {
  outPoint: { txHash: '0x930b84d18818f48ca6b0365f111bd352bbba121a23b472b8d9d6400e66cc47c5', index: '0x0' },
  depType: 'code',
}

module.exports = {
  CKB_NODE_RPC,
  CKB_NODE_INDEXER,
  TIME_INFO_UPDATE_INTERVAL,
  AlwaysSuccessLockScript,
  AlwaysSuccessDep,
  TimeIndexStateTypeScript,
  TimeIndexStateDep,
  TimeInfoTypeScript,
  TimeInfoDep,
}
