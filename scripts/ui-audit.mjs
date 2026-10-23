// pnpm ui:audit — kiểm tra giao diện có tuân thủ docs/18-ui-rules.md không (không cần thư viện).
// Lỗi (exit 1): emoji dùng làm icon trong template · kiểu pixel cũ (var(--px) solid var(--c-border)) ·
//   khối có viền/nền mà thiếu border-radius · tự định nghĩa lại .btn trong component.
// Cảnh báo: mã màu hex cứng trong <style> (nên dùng token).
// Phạm vi: cửa sổ Học tập (src/renderer/study) + component dùng chung. Popup/mascot giữ kiểu pixel nên không quét.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const SCAN = [
  'src/renderer/study',
  'src/renderer/shared/components',
  'src/renderer/mascot/components',
  'src/renderer/popup'
]
// Component pixel art cố ý giữ kiểu pixel
const PIXEL_OK = new Set([
  'PxPanel.vue',
  'PxBar.vue',
  'PixelBadge.vue',
  'PixelPicture.vue',
  'PicText.vue',
  'TraceCanvas.vue',
  // Dùng chung với popup/mascot: kiểu viền đọc biến (--px, --c-border) nên tự khớp từng cửa sổ
  'TtsIndicator.vue'
])
const EMOJI = /[\u{1F300}-\u{1FAFF}☀-➿⭐✅❌⬆⬇▶⏱♻]️?/gu
// Không cần bo: thanh/ô lưới/lớp phủ/khung toàn trang
const NO_RADIUS =
  /(bar|seg|dot|cell|fill|track|swatch|tick|thumb|progress|canvas|grid|layer|sprite|overlay|backdrop|^\.study$|^\.side$|^\.content$|^50%$|^code$|^th$|^td$|^mark$)/i

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.vue')) out.push(p)
  }
  return out
}

const errors = []
const warnings = []
const err = (f, msg) => errors.push(`${relative(ROOT, f).split(sep).join('/')}: ${msg}`)
const warn = (f, msg) => warnings.push(`${relative(ROOT, f).split(sep).join('/')}: ${msg}`)

for (const f of SCAN.flatMap((d) => walk(join(ROOT, d)))) {
  const base = f.split(sep).pop()
  if (PIXEL_OK.has(base)) continue
  const kids = f.split(sep).includes('kids')
  const src = readFileSync(f, 'utf8').replace(/\r\n/g, '\n')
  const t0 = src.indexOf('<template>')
  const s0 = src.indexOf('<style')
  const tpl = t0 >= 0 ? src.slice(t0, s0 > 0 ? s0 : undefined) : ''
  const css = s0 >= 0 ? src.slice(s0) : ''

  const emoji = [...new Set([...tpl.matchAll(EMOJI)].map((m) => m[0]))]
  if (emoji.length) err(f, `emoji trong template (${emoji.join(' ')}) — dùng <UiIcon name="…" />`)

  if (/var\(--px\) solid var\(--c-border\)/.test(css))
    err(f, 'còn kiểu viền pixel cũ var(--px) solid var(--c-border)')

  for (const m of css.matchAll(/(?:^|\n)([^{}@\n][^{}]*)\{([^{}]*)\}/g)) {
    const sel = m[1].trim()
    const body = m[2]
    if (!kids && /^\.btn(\.|:|,|$)/.test(sel))
      err(f, `tự định nghĩa lại ${sel} — dùng lớp .btn dùng chung (shared/styles/ui.css)`)
    // Giao diện trẻ em có bán kính riêng trong kids.css (nút .k-*) nên không kiểm bán kính ở đây
    if (kids || /border-radius/.test(body)) continue
    const parts = sel.split(',').map((x) => x.trim())
    if (parts.length !== 1) continue
    const p = parts[0]
    if (!/^(\.[\w-]+|kbd|\.[\w-]+ kbd)$/.test(p) || NO_RADIUS.test(p)) continue
    const hasBg = /background(-color)?:\s*(?!none|transparent|inherit)/.test(body)
    const hasBorder = /(^|\n)\s*border:\s*(?!none|0)/.test(body)
    if (hasBg || hasBorder)
      err(f, `${p} có nền/viền nhưng thiếu border-radius (token --r-sm/md/lg/pill)`)
  }

  const hex = new Set([...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase()))
  hex.delete('#fff')
  hex.delete('#ffffff')
  if (hex.size) warn(f, `mã màu cứng ${[...hex].join(', ')} — nên dùng token màu`)
}

for (const w of warnings) console.log(`⚠ ${w}`)
for (const e of errors) console.log(`✗ ${e}`)
console.log(`ui:audit — ${errors.length} lỗi, ${warnings.length} cảnh báo`)
process.exit(errors.length ? 1 : 0)
