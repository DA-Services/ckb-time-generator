import { Buffer } from 'buffer'
import { remove0x } from '../utils/hex'

// Info data: index(u8) | type(u8) | timestamp(u64) BigEndian
const InfoDataLength = 1 + 1 + 8;

export class InfoModel {
  private readonly index: number
  private readonly dataType: number
  private readonly infoData: BigInt

  constructor(index, dataType, infoData: BigInt) {
    this.index = index
    this.dataType = dataType
    this.infoData = infoData
  }

  getIndex() {
    return this.index
  }

  getDataType() {
    return this.dataType
  }

  getInfoData() {
    return this.infoData
  }

  toString() {
    let buf = Buffer.allocUnsafe(InfoDataLength)
    buf.writeUInt8(this.index, 0)
    buf.writeUInt8(this.dataType, 1)
    buf.writeBigUInt64BE(this.infoData as bigint, 2)

    return `0x${buf.toString('hex')}`
  }

  static fromHex(hex: string) {
    const buf = Buffer.from(remove0x(hex), 'hex')

    if (buf.length !== InfoDataLength) {
      throw new Error(`Info data length error.(expected: ${InfoDataLength}, current: ${buf.length})`)
    }

    let data = buf.readBigUInt64BE(2);
    return new InfoModel(buf[0], buf[1], data as BigInt)
  }
}
