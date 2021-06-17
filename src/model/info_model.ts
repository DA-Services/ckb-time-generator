import config from '../config'
import { parseIndex, remove0x, uint32ToBe, uint64ToBe, uint8ToHex } from '../utils/hex'

// Info data: index(u8) | type(u8) | timestamp(u64) BigEndian
const InfoDataHexLength = (1 + 1 + 8) * 2

export class InfoModel {
  private readonly index: number
  private readonly infoData: BigInt

  constructor(index, infoData: BigInt) {
    this.index = index
    this.infoData = infoData
  }

  getIndex() {
    return this.index
  }

  getInfoData() {
    return this.infoData
  }

  toString() {
    return `0x${uint8ToHex(this.index)}${config.infoDataType}${uint64ToBe(this.infoData)}`
  }

  static fromData(data) {
    const temp = remove0x(data)
    if (temp.length !== InfoDataHexLength) {
      throw new Error(`Info data length error: ${temp.length} ${temp}`)
    }
    return new InfoModel(parseIndex(temp), BigInt(`0x${temp.substring(2, InfoDataHexLength)}`))
  }
}
