import { Buffer } from 'buffer'
import { remove0x } from '../utils/helper'

// Info data: index(u8) | type(u8) | timestamp(u64) BigEndian
const InfoDataLength = 1 + 1 + 8;

export class InfoModel {
  index: number
  dataType: number
  infoData: bigint

  constructor(index, dataType, infoData: bigint) {
    this.index = index
    this.dataType = dataType
    this.infoData = infoData
  }

  toString() {
    const buf = Buffer.allocUnsafe(InfoDataLength)
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

    const data = buf.readBigUInt64BE(2);
    return new InfoModel(buf[0], buf[1], data as bigint)
  }
}
