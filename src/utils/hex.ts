export const remove0x = hex => {
  if (hex.startsWith('0x')) {
    return hex.substring(2)
  }
  return hex
}

export function ArrayBufferToHex (arrayBuffer: ArrayBuffer): string {
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
