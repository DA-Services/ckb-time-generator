import { generateBlockNumberInfoSince } from '../src/utils/helper'

export default {
  BLOCKS_INTERVAL: 2,

  since: function (timestamp, blockNumber): string|void {
    return generateBlockNumberInfoSince(blockNumber)
  }
}