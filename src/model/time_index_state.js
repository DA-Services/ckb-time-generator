const { remove0x } = require('../utils/hex')
const SUM_OF_TIME_INFO_CELLS = 12

class TimeIndexState {
  constructor(index) {
    this.index = index
  }

  getTimeIndex() {
    return this.index
  }

  toString() {
    return `0x${Buffer.from([this.index, SUM_OF_TIME_INFO_CELLS]).toString('hex')}`
  }

  increaseIndex() {
    this.index++
    if (this.index === SUM_OF_TIME_INFO_CELLS) {
      this.index = 0
    }
    return this
  }

  static fromData(data) {
    const temp = remove0x(data)
    if (temp.length != 4) {
      throw new Error('Time info data length error')
    }
    return new TimeIndexState(parseInt(temp.substring(0, 2), 16))
  }
}

module.exports = {
  TimeIndexState,
}
