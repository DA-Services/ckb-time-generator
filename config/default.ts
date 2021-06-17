import { INFO_DATA_TYPE } from '../src/utils/const'

const AlwaysSuccessLockScript = {
  codeHash: '0xd483925160e4232b2cb29f012e8380b7b612d71cf4e79991476b6bcf610735f6',
  hashType: 'data',
  args: '0x',
}

const PayersLockScript = AlwaysSuccessLockScript

const AlwaysSuccessDep = {
  outPoint: {
    txHash: '0x6cb20b88912311e6bba89a5fcfc53cfebcc39b99c3cce0796ce3e485a5d47011',
    index: '0x0'
  },
  depType: 'code',
}

const IndexStateTypeScript = {
  codeHash: '0x76c781c3b8d9ed0b69726dded5bb7d063d6f7d70dc0b495d87c475cbad9165e1',
  hashType: 'type',
  args: '0x',
}

const IndexStateDep = {
  outPoint: { txHash: '0xcb9b40b606b0e2382f2008a47e807b60d2ff262ea9df7502ca009feb72ded923', index: '0x0' },
  depType: 'code',
}

const InfoTypeScript = {
  codeHash: '0x7a6db6793ecf341f8f5289bc164d4a417c5adb99ab86a750230d7d14e73768e7',
  hashType: 'type',
  args: '0x',
}

const InfoDep = {
  outPoint: { txHash: '0x1bc39fc942746cf961f338c33626bfea999c96eb06334541859426580643fd51', index: '0x0' },
  depType: 'code',
}

console.log('using config: default')

export default {
  CKB_NODE_RPC: 'http://localhost:8114',
  CKB_NODE_INDEXER: 'http://localhost:8116',
  CKB_WS_URL:'ws://localhost:8118',
  ALWAYS_SUCCESS_LOCK_ARGS:'0x',

  BLOCKS_INTERVAL: 3,

  infoDataType: INFO_DATA_TYPE.arbitrage,

  PayersLockScript, // currently AlwaysSuccessLockScript, should be changed to our own lock script to prevent others' attack todo:

  AlwaysSuccessDep,
  AlwaysSuccessLockScript,

  IndexStateDep: IndexStateDep,
  IndexStateTypeScript: IndexStateTypeScript,

  InfoDep: InfoDep,
  InfoTypeScript: InfoTypeScript,
}