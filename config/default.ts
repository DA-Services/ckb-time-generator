import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0xec17aa5219aa210e73605c06c5414860e0c5e8e4',
}

const PayersPrivateKey = ''

const CellDeps = [
  // index-state-cell-type & info-cell-type, this need to be updated every time the contracts changed
  {
    outPoint: { txHash: '0x79874d992c6b353338e21d0c2a2e88083b049ad08b7a3e46d36eef2a98ee08bd', index: '0x0' },
    depType: 'depGroup',
  },
  // ckb signall lock
  {
    outPoint: { txHash: '0x419014a3e2067ef4b4cf3cd75d0c4382df4bf9718cbed63d308edb01654846c9', index: '0x0' },
    depType: 'depGroup',
  },
]

const IndexStateTypeScript = {
  codeHash: '0x6a9a78dca5d74ff96ffad1e0bc52e22afe68e3b088334b25bcbedef725f76cd2',
  hashType: 'type',
  args: '0x',
}

const InfoTypeScript = {
  codeHash: '0x8ebe174552f3cddded1fcb4e427562e5a535f3d32f1d5f0ea0cf4578ffaf63ca',
  hashType: 'type',
  args: '0x',
}

// ⚠️ rebuild is required for dev:* scripts, because node-config do not recognise typescript files.
console.log('using config: default')

export default {
  CKB_NODE_RPC: 'http://127.0.0.1:8114',
  CKB_NODE_INDEXER: 'http://127.0.0.1:8116',
  CKB_WS_URL: 'ws://127.0.0.1:8118',

  BLOCKS_INTERVAL: 3,

  infoDataType: INFO_DATA_TYPE.arbitrage,

  PayersLockScript, // currently AlwaysSuccessLockScript, should be changed to our own lock script to prevent others' attack todo:
  PayersPrivateKey,
  CellDeps,
  IndexStateTypeScript,
  InfoTypeScript,
}
