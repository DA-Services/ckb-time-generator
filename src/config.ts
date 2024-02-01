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
  CkbNodeRpc: string
  CkbNodeIndexer: string,
  CkbOfficialNodeRpc: string,
  CkbWsUrl: string,
  LarkApiKey: string,

  Loglevel: string,
  Env: string,

  // Define the servers and its IP address, mainly used for making notification much more readable in lark.
  Servers: any,

  // Transaction fee used for creating and updating cells.
  Fee: {
    create: bigint,
    update: bigint,
  },

  Notification: {
    maxTolerableBehindBlock: number,
    newBlockNotifyLimit: number,
    newBlockWarnLimit: number,
  },

  CellDeps: Dep[],
  IndexStateTypeScript: Script,
  InfoTypeScript: Script,

  Timestamp: {
    PayersLockScript: Script,
    PayersPrivateKey: string,
  },
  Blocknumber: {
    PayersLockScript: Script,
    PayersPrivateKey: string,
  },
  Quote: {
    PayersLockScript: Script,
    PayersPrivateKey: string,
  }
}

config.Fee.create = BigInt(config.Fee.create)
config.Fee.update = BigInt(config.Fee.update)

// console.log('config:', config)
export default config as Config
