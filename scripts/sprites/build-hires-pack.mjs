// Đóng gói sprite 288px thành gói tải thêm (docs/05 §11, docs/15 §6c).
//   1. SPRITE_SCALE=3 SPRITE_OUT=content/.build/sprites-hires node scripts/sprites/make-characters.mjs   (~45 phút)
//   2. node scripts/sprites/build-hires-pack.mjs [phiên-bản]   → content/.build/pet-sprites-hires-<ver>.zip + .sha256
// Cần Python + Pillow (đổi PNG → WebP lossless). In ra size + sha256 để điền vào src/main/sprites/packSpec.ts.
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { zipSync } from 'fflate'

const ID = 'pet-sprites-hires'
const FRAME = 288
const version = process.argv[2] ?? '1.0.0'
const src = resolve('content/.build/sprites-hires')
const webp = resolve('content/.build/sprites-hires-webp')

rmSync(webp, { recursive: true, force: true })
mkdirSync(webp, { recursive: true })
const py = spawnSync('python', ['scripts/sprites/png2webp.py', src, webp], { stdio: 'inherit' })
if (py.status !== 0) throw new Error('png2webp.py lỗi (cần Python + Pillow)')

const files = {}
const names = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else {
      const rel = relative(webp, p).split(sep).join('/')
      files[rel] = new Uint8Array(readFileSync(p))
      names.push(rel)
    }
  }
}
walk(webp)
const sheets = names.filter((n) => n.endsWith('/sheet.webp')).length
if (sheets !== 25) throw new Error(`Cần 25 sheet (5 nhân vật × 5 giai đoạn), có ${sheets}`)

const manifest = { id: ID, version, frame: FRAME, files: names }
files['manifest.json'] = new TextEncoder().encode(JSON.stringify(manifest))
// WebP đã nén sẵn: không nén lại thêm (level 0) để giải nén nhanh
const zip = zipSync(files, { level: 0 })
const out = resolve(`content/.build/${ID}-${version}.zip`)
writeFileSync(out, zip)
const sha256 = createHash('sha256').update(zip).digest('hex')
writeFileSync(`${out}.sha256`, `${sha256}  ${ID}-${version}.zip\n`)
console.log(
  `${out}\n  size: ${zip.length} (${(zip.length / 1024 / 1024).toFixed(1)} MB)\n  sha256: ${sha256}\n  ${names.length} file`
)
