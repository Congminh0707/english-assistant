// pnpm content:fetch [source...] [--force]
// Tải dữ liệu thô vào content/raw/<source>/, ghi url/ngày/kích thước/sha256 vào
// content/raw/sources.lock.json và sinh lại content/raw/SOURCES.md.
import { createWriteStream, existsSync } from 'node:fs'
import { readFile, rename, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import Bunzip from 'seek-bzip'
import { RAW_DIR, rawPath } from './lib/paths'
import { ensureDir, log, readJson, sha256File, writeJson } from './lib/io'
import { SOURCES, SOURCE_IDS, isSourceId, type SourceId } from './sources'

interface LockFile {
  url: string
  file: string
  bytes: number
  sha256: string
  downloadedAt: string
}
type Lock = Record<string, { files: LockFile[] }>

const LOCK_PATH = join(RAW_DIR, 'sources.lock.json')

async function download(url: string, dest: string): Promise<{ bytes: number; sha256: string }> {
  const res = await fetch(url, { headers: { 'user-agent': 'english-assistant-content-pipeline' } })
  if (!res.ok || !res.body) throw new Error(`GET ${url} → HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length') ?? 0)
  const hash = createHash('sha256')
  let bytes = 0
  let nextReport = 50 << 20
  const meter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      hash.update(chunk)
      bytes += chunk.length
      if (bytes >= nextReport) {
        // content-length là kích thước đã nén khi server gửi gzip → chỉ hiện % khi hợp lý
        const pct = total && bytes <= total ? ` (${((bytes / total) * 100).toFixed(0)}%)` : ''
        log(`  ${(bytes / 2 ** 20).toFixed(0)} MB${pct}`)
        nextReport += 50 << 20
      }
      cb(null, chunk)
    }
  })
  const tmp = `${dest}.part`
  await pipeline(
    Readable.fromWeb(res.body as import('node:stream/web').ReadableStream),
    meter,
    createWriteStream(tmp)
  )
  await rename(tmp, dest)
  return { bytes, sha256: hash.digest('hex') }
}

async function fetchSource(id: SourceId, lock: Lock, force: boolean): Promise<void> {
  const def = SOURCES[id]
  await ensureDir(join(RAW_DIR, id))
  const entries: LockFile[] = []
  for (const f of def.files) {
    const dest = rawPath(id, f.file)
    const prev = lock[id]?.files.find((x) => x.file === f.file)
    if (!force && prev && existsSync(dest)) {
      log(
        `${id}/${f.file}: already downloaded ${prev.downloadedAt.slice(0, 10)} — skip (--force to refetch)`
      )
      entries.push(prev)
    } else {
      log(`${id}/${f.file}: downloading ${f.url}`)
      const { bytes, sha256 } = await download(f.url, dest)
      entries.push({
        url: f.url,
        file: f.file,
        bytes,
        sha256,
        downloadedAt: new Date().toISOString()
      })
      log(`${id}/${f.file}: ${(bytes / 2 ** 20).toFixed(1)} MB sha256=${sha256.slice(0, 12)}…`)
    }
    if ('bunzip' in f && f.bunzip) {
      const out = dest.replace(/\.bz2$/, '')
      if (force || !existsSync(out) || (await stat(out)).mtimeMs < (await stat(dest)).mtimeMs) {
        log(`${id}/${f.file}: bunzip → ${out.split(/[\\/]/).pop()}`)
        await writeFile(out, Bunzip.decode(await readFile(dest)))
      }
    }
  }
  lock[id] = { files: entries }
}

function renderSourcesMd(lock: Lock): string {
  const lines = [
    '# content/raw — nguồn dữ liệu thô',
    '',
    '> File này được sinh bởi `pnpm content:fetch` từ `scripts/content/sources.ts` + `content/raw/sources.lock.json`.',
    '> Dữ liệu thô **không** commit (xem `.gitignore`); chỉ commit file này để biết chính xác đã tải gì, khi nào, checksum nào.',
    '> Chính sách license: [docs/08-content-sources.md](../../docs/08-content-sources.md).',
    ''
  ]
  for (const id of SOURCE_IDS) {
    const def = SOURCES[id]
    lines.push(`## \`${id}\` — ${def.name}`, '')
    lines.push(`- Trang nguồn: ${def.url}`)
    lines.push(`- License: \`${def.license}\`${'licenseUrl' in def ? ` (${def.licenseUrl})` : ''}`)
    lines.push(`- Ghi công: ${def.attribution}`, '')
    const files = lock[id]?.files ?? []
    if (!def.files.length) {
      lines.push('_Nguồn nội bộ — không có dữ liệu tải về._', '')
      continue
    }
    if (!files.length) {
      lines.push('_Chưa tải._', '')
      continue
    }
    lines.push('| File | URL | Ngày tải (UTC) | Kích thước | sha256 |', '|---|---|---|---|---|')
    for (const f of files) {
      lines.push(
        `| \`${f.file}\` | ${f.url} | ${f.downloadedAt.slice(0, 16).replace('T', ' ')} | ${f.bytes.toLocaleString('en-US')} B | \`${f.sha256}\` |`
      )
    }
    lines.push('')
  }
  return lines.join('\n')
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const wanted = args.filter((a) => !a.startsWith('--'))
  for (const w of wanted)
    if (!isSourceId(w)) throw new Error(`Unknown source "${w}". Known: ${SOURCE_IDS.join(', ')}`)
  const ids = wanted.length ? (wanted as SourceId[]) : SOURCE_IDS

  await ensureDir(RAW_DIR)
  const lock: Lock = existsSync(LOCK_PATH) ? await readJson<Lock>(LOCK_PATH) : {}
  for (const id of ids) {
    await fetchSource(id, lock, force)
    await writeJson(LOCK_PATH, lock) // lưu sau từng nguồn để lỡ hỏng giữa chừng vẫn giữ được phần đã tải
  }
  await writeFile(join(RAW_DIR, 'SOURCES.md'), renderSourcesMd(lock), 'utf8')
  // Kiểm tra lại checksum của file đã có (phát hiện file bị sửa tay)
  for (const id of ids) {
    for (const f of lock[id]?.files ?? []) {
      if (f.bytes < 200 << 20 && (await sha256File(rawPath(id, f.file))) !== f.sha256) {
        throw new Error(`Checksum mismatch for ${id}/${f.file} — rerun with --force`)
      }
    }
  }
  log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
