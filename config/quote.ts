import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0xc45a83ea851eae30307ff47918ca3d2dabca7e52',
}

const PayersPrivateKey = ''

console.log('using config: quote')

export default {
  infoDataType: INFO_DATA_TYPE.arbitrage,
  PayersLockScript,
  PayersPrivateKey,
}
