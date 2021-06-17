import { parseIndex, remove0x, uint32ToBe, uint64ToBe, uint8ToHex } from '../utils/hex'

// Time info data: index(u8) | timestamp(u64) BigEndian
const TimeInfoDataLength = 2 + 16

export class NumeralInfo {
  private readonly index: number
  private readonly numeralData: BigInt

  constructor(index, numeralData: BigInt) {
    this.index = index
    this.numeralData = numeralData
  }

  getIndex() {
    return this.index
  }

  getNumeralData() {
    return this.numeralData
  }

  toString() {
    return `0x${uint8ToHex(this.index)}${uint64ToBe(this.numeralData)}`
  }

  static fromData(data) {
    const temp = remove0x(data)
    if (temp.length !== TimeInfoDataLength) {
      throw new Error('Info data length error')
    }
    return new NumeralInfo(parseIndex(temp), BigInt(`0x${temp.substring(2, TimeInfoDataLength)}`))
  }
}
