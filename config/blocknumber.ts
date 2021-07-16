import { INFO_DATA_TYPE } from '../src/utils/const'

const PayersLockScript = {
  codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  hashType: 'type',
  args: '0xa897829e60ee4e3fb0e4abe65549ec4a5ddafad7',
}

const PayersPrivateKey = '0x5d7332d197151cee989f106a2549a2b68c789953f1d768e56bd1516df231a053'

const IndexStateTypeScript = {
  codeHash: '0x554cff969f3148e3c620749384004e9692e67c429f621554d139b505a281c7b8',
  hashType: 'type',
  args: '0x02',
}

const InfoTypeScript = {
  codeHash: '0x96248cdefb09eed910018a847cfb51ad044c2d7db650112931760e3ef34a7e9a',
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
