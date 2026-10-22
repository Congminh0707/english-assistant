// Bộ giải msgpack tối thiểu (đủ cho file wordfreq: mảng, map, chuỗi, số nguyên, nil, bool, float)
export function decodeMsgpack(buf: Buffer): unknown {
  let pos = 0
  const str = (n: number): string => {
    const s = buf.toString('utf8', pos, pos + n)
    pos += n
    return s
  }
  const arr = (n: number): unknown[] => Array.from({ length: n }, read)
  const map = (n: number): Record<string, unknown> => {
    const o: Record<string, unknown> = {}
    for (let i = 0; i < n; i++) o[String(read())] = read()
    return o
  }
  function read(): unknown {
    const b = buf[pos++]
    if (b <= 0x7f) return b
    if (b >= 0xe0) return b - 0x100
    if (b >= 0xa0 && b <= 0xbf) return str(b & 0x1f)
    if (b >= 0x90 && b <= 0x9f) return arr(b & 0x0f)
    if (b >= 0x80 && b <= 0x8f) return map(b & 0x0f)
    const u = (n: number, read_: () => number): number => {
      const v = read_()
      pos += n
      return v
    }
    switch (b) {
      case 0xc0:
        return null
      case 0xc2:
        return false
      case 0xc3:
        return true
      case 0xca:
        return u(4, () => buf.readFloatBE(pos))
      case 0xcb:
        return u(8, () => buf.readDoubleBE(pos))
      case 0xcc:
        return u(1, () => buf.readUInt8(pos))
      case 0xcd:
        return u(2, () => buf.readUInt16BE(pos))
      case 0xce:
        return u(4, () => buf.readUInt32BE(pos))
      case 0xd0:
        return u(1, () => buf.readInt8(pos))
      case 0xd1:
        return u(2, () => buf.readInt16BE(pos))
      case 0xd2:
        return u(4, () => buf.readInt32BE(pos))
      case 0xd9:
        return str(u(1, () => buf.readUInt8(pos)))
      case 0xda:
        return str(u(2, () => buf.readUInt16BE(pos)))
      case 0xdb:
        return str(u(4, () => buf.readUInt32BE(pos)))
      case 0xdc:
        return arr(u(2, () => buf.readUInt16BE(pos)))
      case 0xdd:
        return arr(u(4, () => buf.readUInt32BE(pos)))
      case 0xde:
        return map(u(2, () => buf.readUInt16BE(pos)))
      case 0xdf:
        return map(u(4, () => buf.readUInt32BE(pos)))
      default:
        throw new Error(`msgpack: kiểu 0x${b.toString(16)} chưa hỗ trợ tại ${pos - 1}`)
    }
  }
  return read()
}
