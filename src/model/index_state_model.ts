import { remove0x } from '../utils/hex'
import { Buffer } from 'buffer'
import { SUM_OF_INFO_CELLS } from '../utils/const'

const IndexStateDataLength = 1 + 1;

export class IndexStateModel {
  private index: number

  constructor(index) {
    this.index = index
  }

  getIndex() {
    return this.index
  }

  getSumOfInfoCells() {
    return SUM_OF_INFO_CELLS
  }

  toString() {
    let buf = Buffer.from([this.index, SUM_OF_INFO_CELLS])
    return `0x${buf.toString('hex')}`
  }

  increaseIndex() {
    let nextIndex = this.index + 1
    if (nextIndex >= SUM_OF_INFO_CELLS) {
      nextIndex = 0
    }
    return new IndexStateModel(nextIndex)
  }

  static fromData(hex: string): IndexStateModel {
    const buf = Buffer.from(remove0x(hex), 'hex')
    if (buf.length != IndexStateDataLength) {
      throw new Error(`IndexState data length error.(expected: ${IndexStateDataLength}, current: ${buf.length})`)
    }
    // Dynamic limit current InfoCell to the maximum index configured by const.ts .
    let index = buf[0] <= SUM_OF_INFO_CELLS ? buf[0] : SUM_OF_INFO_CELLS;
    return new IndexStateModel(index)
  }
}
