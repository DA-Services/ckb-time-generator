import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0x2228dae340f587647362d31e3f04d7a51f8168dc',
}

const PayersPrivateKey = ''

const IndexStateTypeScript = {
  codeHash: '0xf47e324a660f35d453ae474a0e12acbfd1adadab72e8fc1ecc0ea7de3c96032a',
  hashType: 'type',
  args: '0x01',
}

const InfoTypeScript = {
  codeHash: '0x2e0e5b790cfb346bddc0e82a70f785e90d1537bbfdbdd25f6a3617cc760f887b',
  hashType: 'type',
  args: '0x01',
}

console.log('using config: timestamp')

export default {
  infoDataType: INFO_DATA_TYPE.timestamp,
  IndexStateTypeScript,
  InfoTypeScript,
  PayersLockScript,
  PayersPrivateKey,
}
