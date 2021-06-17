import { generateTimestampInfoSince } from '../src/utils/helper'

export default {
  BLOCKS_INTERVAL: 3,
  since: function (timestamp, blockNumber): string|void {
    return generateTimestampInfoSince(timestamp)
  }
}