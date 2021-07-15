import { remove0x } from '../utils/hex'
import { Buffer } from 'buffer'

const IndexStateDataLength = 1 + 1;

export class IndexStateModel {
  private index: number
  private sum_of_info_cells: number

  constructor(index, sum_of_info_cells) {
    this.index = index
    this.sum_of_info_cells = sum_of_info_cells
  }

  getIndex() {
    return this.index
  }

  getSumOfInfoCells() {
    return this.sum_of_info_cells
  }

  toString() {
    let buf = Buffer.from([this.index, this.sum_of_info_cells])
    return `0x${buf.toString('hex')}`
  }

  increaseIndex() {
    let nextIndex = this.index + 1
    if (nextIndex === this.sum_of_info_cells) {
      nextIndex = 0
    }
    return new IndexStateModel(nextIndex, this.sum_of_info_cells)
  }

  static fromData(hex: string): IndexStateModel {
    const buf = Buffer.from(remove0x(hex), 'hex')
    if (buf.length != IndexStateDataLength) {
      throw new Error(`IndexState data length error.(expected: ${IndexStateDataLength}, current: ${buf.length})`)
    }
    return new IndexStateModel(buf[0], buf[1])
  }
}
