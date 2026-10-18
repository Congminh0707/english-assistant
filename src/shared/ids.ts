/**
 * UUID v7: 48 bit thời gian (ms) + ngẫu nhiên → sắp xếp được theo thời gian tạo, hợp cho đồng bộ về sau
 * (docs/10-data-model.md#2). Dùng Web Crypto nên chạy được cả main lẫn renderer.
 */
export function uuidv7(now = Date.now()): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let ts = now
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256
    ts = Math.floor(ts / 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70 // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
