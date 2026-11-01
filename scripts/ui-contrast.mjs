// pnpm ui:contrast — đo tỉ lệ tương phản WCAG của các cặp token chữ/nền trong tokens.css (sáng + tối).
// Chữ thường cần ≥ 4,5; chữ lớn/icon/viền cần ≥ 3. Thoát mã 1 nếu có cặp chữ trượt.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(ROOT, 'src/renderer/shared/styles/tokens.css'), 'utf8')

function block(selector) {
  const start = css.indexOf(selector)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]))
}
const light = block(':root {')
const dark = { ...light, ...block(":root[data-theme='dark']") }

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// [chữ, nền, ngưỡng]
const PAIRS = [
  ['c-ink', 'c-bg', 4.5], ['c-ink', 'c-surface', 4.5], ['c-ink', 'c-surface-2', 4.5],
  ['c-ink-soft', 'c-bg', 4.5], ['c-ink-soft', 'c-surface', 4.5], ['c-ink-soft', 'c-surface-2', 4.5],
  ['c-on-primary', 'c-primary', 4.5], ['c-on-primary', 'c-primary-strong', 4.5],
  ['c-primary', 'c-surface', 4.5], ['c-primary', 'c-primary-soft', 4.5],
  ['c-success', 'c-surface', 4.5], ['c-success', 'c-success-soft', 4.5],
  ['c-warning', 'c-surface', 4.5], ['c-warning', 'c-warning-soft', 4.5],
  ['c-danger', 'c-surface', 4.5], ['c-danger', 'c-danger-soft', 4.5],
  ['c-xp', 'c-surface', 4.5], ['c-xp', 'c-xp-soft', 4.5]
]

let fails = 0
for (const [name, theme] of [['sáng', light], ['tối', dark]]) {
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(theme[fg], theme[bg])
    if (r < min) {
      const hard = !fg.includes('line')
      if (hard) fails++
      console.log(`${hard ? '✖' : '⚠'} ${name}: ${fg} ${theme[fg]} / ${bg} ${theme[bg]} = ${r.toFixed(2)} (cần ≥ ${min})`)
    }
  }
}
console.log(`ui:contrast — ${fails} cặp chữ trượt`)
process.exit(fails ? 1 : 0)
