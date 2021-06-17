import { parseIndex, remove0x } from '../utils/hex'
const SUM_OF_TIME_INFO_CELLS = 12

export class IndexState {
  private index: number

  constructor(index) {
    this.index = index
  }

  getIndex() {
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

  static fromData(data: string): IndexState {
    const temp = remove0x(data)
    if (temp.length != 4) {
      throw new Error('IndexState length error')
    }
    return new IndexState(parseIndex(temp))
  }
}
