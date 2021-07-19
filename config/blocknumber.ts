import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0xfed559f2f93e5e7958d8a62b0b148cb18bc484bf',
}

const PayersPrivateKey = ''

const IndexStateTypeScript = {
  codeHash: '0xf47e324a660f35d453ae474a0e12acbfd1adadab72e8fc1ecc0ea7de3c96032a',
  hashType: 'type',
  args: '0x02',
}

const InfoTypeScript = {
  codeHash: '0x2e0e5b790cfb346bddc0e82a70f785e90d1537bbfdbdd25f6a3617cc760f887b',
  hashType: 'type',
  args: '0x02',
}

console.log('using config: blocknumber')

export default {
  infoDataType: INFO_DATA_TYPE.blocknumber,
  IndexStateTypeScript,
  InfoTypeScript,
  PayersLockScript,
  PayersPrivateKey,
}
