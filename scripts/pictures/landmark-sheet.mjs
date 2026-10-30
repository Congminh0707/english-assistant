// Xuất bảng tổng hợp 12 công trình voxel (đúng bitmap dùng trên bản đồ game) ra PNG để soi và sửa (docs/19 §5.4).
//   pnpm landmarks:sheet --out sheet.png [--ids hanoi-turtle-tower,...]
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { build } = require(require.resolve('esbuild', { paths: [require.resolve('vite')] }))
const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const out = resolve(arg('out') ?? 'landmark-sheet.png')
const onlyIds = arg('ids')?.split(',')
const tmp = mkdtempSync(join(tmpdir(), 'landmark-sheet-'))
const bitmap = resolve('src/renderer/study/kids/game/landmarkBitmap.ts').replaceAll('\\', '/')
const index = resolve('src/shared/voxels/landmarks/index.ts').replaceAll('\\', '/')
const entry = [
  `import { landmarkBitmap } from ${JSON.stringify(bitmap)}`,
  `import { LANDMARK_IDS } from ${JSON.stringify(index)}`,
  `const ids = ${JSON.stringify(onlyIds ?? null)} ?? LANDMARK_IDS`,
  `const grid = document.getElementById('grid')`,
  `for (const id of ids) { const card = document.createElement('div'); card.className = 'card'`,
  `  try { const bmp = landmarkBitmap(id); const big = document.createElement('canvas'); big.width = 380; big.height = 330`,
  `    const c = big.getContext('2d'); c.imageSmoothingQuality = 'high'; const k = Math.min(380 / bmp.width, 330 / bmp.height)`,
  `    c.fillStyle = '#9fdc72'; c.fillRect(0, 0, 380, 330); c.drawImage(bmp, (380 - bmp.width * k) / 2, 330 - bmp.height * k, bmp.width * k, bmp.height * k); card.appendChild(big)`,
  `    const s = document.createElement('canvas'); s.width = 190; s.height = 175; const d = s.getContext('2d'); d.imageSmoothingQuality = 'high'`,
  `    const k2 = Math.min(190 / bmp.width, 175 / bmp.height); d.fillStyle = '#9fdc72'; d.fillRect(0, 0, 190, 175); d.drawImage(bmp, (190 - bmp.width * k2) / 2, 175 - bmp.height * k2, bmp.width * k2, bmp.height * k2); card.appendChild(s) }`,
  `  catch (e) { card.append('LỖI: ' + e.message) }`,
  `  const l = document.createElement('div'); l.className = 'label'; l.textContent = id; card.appendChild(l); grid.appendChild(card) }`,
  `window.__count = grid.children.length`
].join('\n')
const bundle = await build({
  stdin: { contents: entry, resolveDir: resolve('.'), loader: 'ts' },
  bundle: true,
  write: false,
  format: 'iife',
  target: 'chrome120',
  alias: { '@shared': resolve('src/shared') }
})
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#eef6ff;font-family:system-ui,sans-serif;color:#3b2a3a}
#grid{display:grid;grid-template-columns:repeat(3,400px);gap:12px}
.card{background:#fff;border-radius:18px;padding:8px;text-align:center}
.card canvas{display:block;margin:0 auto 6px}.label{font-weight:700;font-size:15px}</style>
<div id="grid"></div><script>${bundle.outputFiles[0].text}</script>`
const page = join(tmp, 'sheet.html')
writeFileSync(page, html)
const r = spawnSync(require('electron'), [resolve('scripts/pictures/vector-sheet-capture.cjs'), page, out, tmp], { stdio: 'inherit' })
process.exit(r.status ?? 1)
