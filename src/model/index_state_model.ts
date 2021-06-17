import { SUM_OF_INFO_CELLS } from '../utils/const'
import { parseIndex, remove0x } from '../utils/hex'

export class IndexStateModel {
  private index: number

  constructor(index) {
    this.index = index
  }

  getIndex() {
    return this.index
  }

  toString() {
    return `0x${Buffer.from([this.index, SUM_OF_INFO_CELLS]).toString('hex')}`
  }

  increaseIndex() {
    this.index++
    if (this.index === SUM_OF_INFO_CELLS) {
      this.index = 0
    }
    return this
  }

  static fromData(data: string): IndexStateModel {
    const temp = remove0x(data)
    if (temp.length != 4) {
      throw new Error('IndexState length error')
    }
    return new IndexStateModel(parseIndex(temp))
  }
}
