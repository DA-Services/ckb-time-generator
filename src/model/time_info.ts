import { remove0x, uint32ToBe, uint64ToBe, uint8ToHex } from '../utils/hex'

export class TimestampInfo {
  private readonly index: number
  private readonly timestamp: number

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
    return `0x${uint8ToHex(this.index)}${uint32ToBe(this.timestamp)}`
  }

  // Time info data: index(u8) | timestamp(u32) BigEndian
  static fromData(data) {
    const temp = remove0x(data)
    if (temp.length !== 10) {
      throw new Error('Time info data length error')
    }
    return new TimestampInfo(parseInt(temp.substring(0, 2), 16), parseInt(temp.substring(2, 10), 16))
  }
}

export class BlockNumberInfo {
  private readonly index: number
  private readonly blockNumber: number

  constructor(index, blockNumber) {
    this.index = index
    this.blockNumber = blockNumber
  }

  getTimeIndex() {
    return this.index
  }

  getBlockNumber() {
    return this.blockNumber
  }

  toString() {
    return `0x${uint8ToHex(this.index)}${remove0x(uint64ToBe(this.blockNumber))}`
  }

  // Time info data: index(u8) | block number(u64) BigEndian
  static fromData(data) {
    const temp = remove0x(data)
    if (temp.length !== 18) {
      throw new Error('Time info data length error')
    }
    return new BlockNumberInfo(parseInt(temp.substring(0, 2), 16), BigInt(`0x${temp.substring(2, 18)}`))
  }
}
