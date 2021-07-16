import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0x6a21bc1b72d1e654f8e2ded400cffa46075494c6',
}

const PayersPrivateKey = '0x6ac31f00f5a8f79534d1bb7b583c9c05fc1d2c7f015b1dc15c9e0e616bf260ea'

const IndexStateTypeScript = {
  codeHash: '0x554cff969f3148e3c620749384004e9692e67c429f621554d139b505a281c7b8',
  hashType: 'type',
  args: '0x01',
}

const InfoTypeScript = {
  codeHash: '0x96248cdefb09eed910018a847cfb51ad044c2d7db650112931760e3ef34a7e9a',
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
