// CAREFUL: This config will replace local.ts !!!

const CellDeps = [
  // index-state-cell-type & info-cell-type, this need to be updated every time the contracts changed
  {
    outPoint: { txHash: '0xd48ebd7c52ee3793ccaeef9ab40c29281c1fc4e901fb52b286fc1af74532f1cb', index: '0x0' },
    depType: 'depGroup',
  },
  // ckb signall lock
  {
    outPoint: { txHash: '0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37', index: '0x0' },
    depType: 'depGroup',
  },
]

const IndexStateTypeScript = {
  codeHash: '0x554cff969f3148e3c620749384004e9692e67c429f621554d139b505a281c7b8',
  hashType: 'type',
  args: '0x',
}

const InfoTypeScript = {
  codeHash: '0x96248cdefb09eed910018a847cfb51ad044c2d7db650112931760e3ef34a7e9a',
  hashType: 'type',
  args: '0x',
}

export default {
  WECOM_API_KEY: 'a30a921c-b94c-4b8e-9e69-fb7b065379c2',
  LARK_API_KEY: 'f1b445d7-811a-498c-86db-63deef080c5f',

  loglevel: 'info',

  CellDeps,
  IndexStateTypeScript,
  InfoTypeScript,

  timestamp: {
    PayersLockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      hashType: 'type',
      args: '0x6a21bc1b72d1e654f8e2ded400cffa46075494c6',
    },
  },
  blocknumber: {
    PayersLockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      hashType: 'type',
      args: '0xa897829e60ee4e3fb0e4abe65549ec4a5ddafad7',
    },
  },
  quote: {
    PayersLockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      hashType: 'type',
      args: '0xb12e3692d401c331f6d1f1efcb24d510296c4a6a',
    },
  }
}
