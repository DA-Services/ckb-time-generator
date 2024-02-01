import CKB from '@nervosnetwork/ckb-sdk-core'

import config from '../config'
import { fromHex } from './helper'

export const officialCkb = new CKB(config.CkbOfficialNodeRpc)

export async function getTipBlockNumber (): Promise<bigint> {
  return fromHex(await officialCkb.rpc.getTipBlockNumber())
}
