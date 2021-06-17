export const remove0x = hex => {
  if (hex.startsWith('0x')) {
    return hex.substring(2)
  }
  return hex
}

function ArrayBufferToHex (arrayBuffer: ArrayBuffer): string {
  return Array.prototype.map.call(
    new Uint8Array(arrayBuffer),
    (x: number) => ('00' + x.toString(16)).slice(-2),
  ).join('')
}

export function uint32ToBe (u32: number) {
  let buffer = new ArrayBuffer(4)
  let view = new DataView(buffer)
  view.setUint32(0, u32, false)
  return ArrayBufferToHex(buffer)
}

export function uint64ToBe (u64: BigInt) {
  if (typeof u64 !== 'bigint') {
    throw new Error('u64 must be bigint')
  }
  const val = remove0x(u64.toString(16))
  return `${'0'.repeat(16 - val.length)}${val}`
}

export function uint8ToHex (u8: number) {
  let buffer = new ArrayBuffer(1)
  let view = new DataView(buffer)
  view.setUint8(0, u8)
  return ArrayBufferToHex(buffer)
}

export function toHex(num: number | BigInt) {
  return `0x${num.toString(16)}`
}

/**
 * parse the first 2 bytes data to number
 * @param data
 */
export function parseIndex(data: string): number {
  return parseInt(remove0x(data).slice(0, 2), 16)
}