import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0xfed559f2f93e5e7958d8a62b0b148cb18bc484bf',
}

const PayersPrivateKey = ''

console.log('using config: blocknumber')

export default {
  infoDataType: INFO_DATA_TYPE.blocknumber,
  PayersLockScript,
  PayersPrivateKey,
}
