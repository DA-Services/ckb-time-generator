const { uint8ToHex, uin32ToBe, remove0x } = require('../utils/hex')

class TimeInfo {
  constructor(index, timestamp) {
    this.index = index
    this.timestamp = timestamp
  }

  getTimeIndex() {
    return this.index
  }

  getTimestamp() {
    return this.timestamp
  }

  toString() {
    return `0x${uint8ToHex(this.index)}${uin32ToBe(this.timestamp)}`
  }

  // Time info data: index(u8) | timestamp(u32) or block number(u64)
  // For example: 0x00603109e4
  static fromData(data) {
    const temp = remove0x(data)
    if (temp.length() !== 10) {
      throw new Error('Time info data length error')
    }
    return new TimeInfo(parseInt(temp.substring(2, 10), 16), parseInt(temp.substring(0, 2), 16))
  }
}

module.exports = {
  TimeInfo,
}
