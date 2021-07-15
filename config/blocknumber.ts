import { INFO_DATA_TYPE } from '../src/utils/const'

const IndexStateTypeScript = {
  codeHash: '0x6a9a78dca5d74ff96ffad1e0bc52e22afe68e3b088334b25bcbedef725f76cd2',
  hashType: 'type',
  args: '0x02',
}

const InfoTypeScript = {
  codeHash: '0x8ebe174552f3cddded1fcb4e427562e5a535f3d32f1d5f0ea0cf4578ffaf63ca',
  hashType: 'type',
  args: '0x02',
}

console.log('using config: blocknumber')

export default {
  BLOCKS_INTERVAL: 2,

  infoDataType: INFO_DATA_TYPE.blocknumber,
  IndexStateTypeScript,
  InfoTypeScript,
}
