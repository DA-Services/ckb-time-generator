import config from 'config'

interface Dep {
  outPoint: {
    txHash: string,
    index: string,
  },
  depType: 'code',
}

interface Script {
  codeHash: string,
  hashType: 'type',
  args: string,
}

interface Config {
  CKB_NODE_RPC: string
  CKB_NODE_INDEXER: string,
  CKB_WS_URL: string,
  LARK_API_KEY: string,

  loglevel: string,
  env: string,

  // Define the servers and its IP address, mainly used for making notification much more readable in lark.
  servers: any,

  // Transaction fee used for creating and updating cells.
  fee: {
    create: bigint,
    update: bigint,
  },

  CellDeps: Dep[],
  IndexStateTypeScript: Script,
  InfoTypeScript: Script,

  timestamp: {
    PayersLockScript: Script,
    PayersPrivateKey: string,
  },
  blocknumber: {
    PayersLockScript: Script,
    PayersPrivateKey: string,
  },
  quote: {
    PayersLockScript: Script,
    PayersPrivateKey: string,
  }
}

config.fee.create = BigInt(config.fee.create)
config.fee.update = BigInt(config.fee.update)

// console.log('config:', config)
export default config as Config
