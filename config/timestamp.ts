import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0x2228dae340f587647362d31e3f04d7a51f8168dc',
}

const PayersPrivateKey = ''

console.log('using config: timestamp')

export default {
  infoDataType: INFO_DATA_TYPE.timestamp,
  PayersLockScript,
  PayersPrivateKey,
}
