// Xuất bảng tổng hợp hình từ vector (src/renderer/shared/art/pictures/*.ts) ra PNG để soi và sửa (docs/19 §5.5).
// Node đóng gói trang (esbuild), rồi Electron ẩn (canvas thật, vector-sheet-capture.cjs) chụp ra PNG; userData ở thư mục tạm — không đụng dữ liệu app.
//   pnpm pictures:sheet --out sheet.png              (mọi file)
//   pnpm pictures:sheet --file sea --out sea.png     (một file pictures/sea.ts)
//   pnpm pictures:sheet --ids cat,dog --out x.png    (chọn id)
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { build } = require(require.resolve('esbuild', { paths: [require.resolve('vite')] }))

const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const out = resolve(arg('out') ?? 'vector-sheet.png')
const onlyFile = arg('file')
const onlyIds = arg('ids')?.split(',')
const dir = resolve('src/renderer/shared/art/pictures')
const files = readdirSync(dir).filter(
  (f) => f.endsWith('.ts') && (!onlyFile || f === `${onlyFile}.ts`)
)
if (!files.length) {
  console.error(`Không có file hình nào (${onlyFile ?? 'tất cả'})`)
  process.exit(1)
}

const tmp = mkdtempSync(join(tmpdir(), 'vector-sheet-'))

const entry = [
  ...files.map(
    (f, i) =>
      `import { PICTURES as m${i} } from ${JSON.stringify(join(dir, f).replace(/\\/g, '/'))}`
  ),
  `const all = Object.assign({}, ${files.map((_, i) => `m${i}`).join(', ')})`,
  `const ids = ${JSON.stringify(onlyIds ?? null)} ?? Object.keys(all)`,
  `const grid = document.getElementById('grid')`,
  `const draw = (paint, size) => { const cv = document.createElement('canvas'); cv.width = size; cv.height = size;`,
  `  const c = cv.getContext('2d'); c.scale(size / 256, size / 256); paint(c); return cv }`,
  `for (const id of ids) { const paint = all[id]; if (!paint) continue`,
  `  const card = document.createElement('div'); card.className = 'card'`,
  `  try { card.appendChild(draw(paint, 184)); const s = document.createElement('div'); s.className = 'small';`,
  `    s.appendChild(draw(paint, 64)); s.appendChild(draw(paint, 40)); card.appendChild(s) }`,
  `  catch (e) { card.append('LỖI: ' + e.message) }`,
  `  const l = document.createElement('div'); l.className = 'label'; l.textContent = id; card.appendChild(l); grid.appendChild(card) }`,
  `window.__count = grid.children.length`
].join('\n')

const bundle = await build({
  stdin: { contents: entry, resolveDir: dir, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'iife',
  target: 'chrome120'
})
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#eef6ff;font-family:system-ui,sans-serif;color:#3b2a3a}
#grid{display:grid;grid-template-columns:repeat(6,200px);gap:12px}
.card{background:#fff;border-radius:18px;padding:8px;text-align:center}
.card canvas{display:block;margin:0 auto}.small{display:flex;gap:8px;justify-content:center;align-items:end}
.small canvas{margin:0}.label{font-weight:700;font-size:15px}</style>
<div id="grid"></div><script>${bundle.outputFiles[0].text}</script>`
const page = join(tmp, 'sheet.html')
writeFileSync(page, html)

const electron = require('electron')
const r = spawnSync(
  electron,
  [resolve('scripts/pictures/vector-sheet-capture.cjs'), page, out, tmp],
  {
    stdio: 'inherit'
  }
)
process.exit(r.status ?? 1)
