import { Buffer } from 'buffer'

import { remove0x } from '../utils/helper'

const IndexStateDataLength = 1 + 1;

export class IndexStateModel {
  index: number
  total: number

  constructor(index, total) {
    this.index = index
    this.total = total
  }

  increaseIndex() {
    if (this.index + 1 >= this.total) {
      this.index = 0
    } else {
      this.index += 1
    }
  }

  toString() {
    let buf = Buffer.from([this.index, this.total])
    return `0x${buf.toString('hex')}`
  }

  static fromHex(hex: string): IndexStateModel {
    const buf = Buffer.from(remove0x(hex), 'hex')
    if (buf.length != IndexStateDataLength) {
      throw new Error(`IndexState data length error.(expected: ${IndexStateDataLength}, current: ${buf.length})`)
    }

    // Dynamic limit current InfoCell to the maximum index configured by const.ts .
    let index = buf[0] <= buf[1] ? buf[0] : buf[1];
    return new IndexStateModel(index, buf[1])
  }
}
