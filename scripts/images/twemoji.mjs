// Tải SVG Twemoji (CC-BY 4.0, jdecked/twemoji) cho các hình bổ sung trong src/shared/pictureExtras.ts.
//   node scripts/images/twemoji.mjs   → src/renderer/shared/assets/pictures/twemoji/<id>.svg
// Chỉ tải file chưa có; in ra id nào không tải được (emoji không có trong bản Twemoji) để sửa danh sách.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const OUT = resolve('src/renderer/shared/assets/pictures/twemoji')
const BASE = 'https://raw.githubusercontent.com/jdecked/twemoji/main/assets/svg'
mkdirSync(OUT, { recursive: true })

// Đọc danh sách từ file TS bằng regex (script thuần Node, không cần biên dịch)
const src = readFileSync(resolve('src/shared/pictureExtras.ts'), 'utf8')
const items = [
  ...src.matchAll(/^\s{2}(\w+): \{ en: '[^']*', vi: '[^']*', code: '([0-9a-f-]+)' \}/gm)
].map((m) => ({ id: m[1], code: m[2] }))
let ok = 0
const missing = []
for (const { id, code } of items) {
  const file = join(OUT, `${id}.svg`)
  if (existsSync(file)) {
    ok++
    continue
  }
  const res = await fetch(`${BASE}/${code}.svg`, {
    headers: { 'User-Agent': 'english-assistant-twemoji/1.0' }
  })
  if (!res.ok) {
    missing.push(`${id} (${code}): HTTP ${res.status}`)
    continue
  }
  writeFileSync(file, await res.text())
  ok++
}
console.log(`Twemoji: ${ok}/${items.length} file`)
if (missing.length) console.log('Không tải được:\n' + missing.join('\n'))
