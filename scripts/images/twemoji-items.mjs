// Tải SVG Twemoji (CC-BY 4.0, jdecked/twemoji) cho emoji của đồ ăn, phụ kiện, nhân vật trong cửa hàng.
//   node scripts/images/twemoji-items.mjs   → src/renderer/shared/assets/items/<codepoint>.svg
// Đọc emoji từ src/shared/{pet,shop,characters}.ts; chỉ tải file chưa có; in ra emoji không tải được.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const OUT = resolve('src/renderer/shared/assets/items')
const BASE = 'https://raw.githubusercontent.com/jdecked/twemoji/main/assets/svg'
mkdirSync(OUT, { recursive: true })

// Tên file = codepoint, bỏ FE0F (khớp cách Twemoji đặt tên và hàm itemEmojiCode ở renderer)
const code = (e) =>
  [...e]
    .map((c) => c.codePointAt(0))
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join('-')

const emojis = new Set()
for (const f of ['pet', 'shop', 'characters']) {
  const src = readFileSync(resolve(`src/shared/${f}.ts`), 'utf8')
  for (const m of src.matchAll(/emoji: '([^']+)'/g)) emojis.add(m[1])
}

let ok = 0
const missing = []
for (const e of emojis) {
  const name = code(e)
  const file = join(OUT, `${name}.svg`)
  if (existsSync(file)) {
    ok++
    continue
  }
  const headers = { 'User-Agent': 'english-assistant-twemoji/1.0' }
  let res = await fetch(`${BASE}/${name}.svg`, { headers })
  // Chuỗi ZWJ (vd 🏴‍☠️) giữ FE0F ở cuối trong tên file Twemoji; lưu lại dưới tên đã bỏ FE0F
  if (!res.ok) res = await fetch(`${BASE}/${name}-fe0f.svg`, { headers })
  if (!res.ok) {
    missing.push(`${e} (${name}): HTTP ${res.status}`)
    continue
  }
  writeFileSync(file, await res.text())
  ok++
}
console.log(`Twemoji vật phẩm: ${ok}/${emojis.size} file`)
if (missing.length) console.log('Không tải được:\n' + missing.join('\n'))
