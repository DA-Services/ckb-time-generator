export const remove0x = hex => {
  if (hex.startsWith('0x')) {
    return hex.substring(2)
  }
  return hex
}

const ArrayBufferToHex = arrayBuffer => {
  return Array.prototype.map.call(new Uint8Array(arrayBuffer), x => ('00' + x.toString(16)).slice(-2)).join('')
}

export const uint64ToBe = u64 => {
  if (typeof u64 !== 'bigint') {
    throw new Error('u64 must be bigint')
  }
  const val = remove0x(u64.toString(16))
  return `${'0'.repeat(16 - val.length)}${val}`
}

export const uint32ToBe = u32 => {
  let buffer = new ArrayBuffer(4)
  let view = new DataView(buffer)
  view.setUint32(0, u32, false)
  return ArrayBufferToHex(buffer)
}

export const uint8ToHex = u8 => {
  let buffer = new ArrayBuffer(1)
  let view = new DataView(buffer)
  view.setUint8(0, u8)
  return ArrayBufferToHex(buffer)
}
