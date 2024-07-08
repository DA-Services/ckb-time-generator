import ckbCore from '@nervosnetwork/ckb-sdk-core'

import config from '../config.js'
import { fromHex } from './helper.js'

export const officialCkb = new ckbCore.default(config.CkbOfficialNodeRpc)

export async function getTipBlockNumber (): Promise<bigint> {
  return fromHex(await officialCkb.rpc.getTipBlockNumber())
}
