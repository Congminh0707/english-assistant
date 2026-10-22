// pnpm content:stats [--pack path/to/file.eapack] [--json]
// In số liệu THỰC của pack đã build (mặc định: bản mới nhất trong content/packs) để cập nhật docs
// (docs/09 §10.3, docs/14, README…). Mỗi lần build pack mới → chạy lệnh này và sửa số trong docs.
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { CURATED_DIR, PACKS_DIR } from './lib/paths'
import { readZipEntry } from './lib/zip'

const TOP = 10_000

interface WordData {
  vi?: Array<{ origin?: string }>
  review?: { status?: string }
}

async function latestPack(): Promise<string> {
  const files = (await readdir(PACKS_DIR)).filter((f) => /^core-dictionary-.*\.eapack$/.test(f))
  const key = (f: string): number[] =>
    (/-(\d+)\.(\d+)\.(\d+)\.eapack$/.exec(f) ?? []).slice(1).map(Number)
  files.sort((a, b) => {
    const [ka, kb] = [key(a), key(b)]
    for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return (kb[i] ?? 0) - (ka[i] ?? 0)
    return 0
  })
  if (!files[0]) throw new Error('Chưa có pack nào trong content/packs — chạy pnpm content:build')
  return join(PACKS_DIR, files[0])
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const packIdx = args.indexOf('--pack')
  const pack = packIdx >= 0 && args[packIdx + 1] ? args[packIdx + 1]! : await latestPack()
  const dir = await mkdtemp(join(tmpdir(), 'eapack-stats-'))
  try {
    const dbPath = join(dir, 'content.db')
    await writeFile(dbPath, await readZipEntry(pack, 'content.db'))
    const db = new DatabaseSync(dbPath, { readOnly: true })
    const one = (sql: string): number => Number((db.prepare(sql).get() as { n: number }).n)

    const out: Record<string, number | string> = {
      pack: pack.split(/[\\/]/).pop()!,
      packMB: +((await stat(pack)).size / 1024 / 1024).toFixed(1),
      dbMB: +((await stat(dbPath)).size / 1024 / 1024).toFixed(1),
      words: one('SELECT COUNT(*) n FROM words'),
      wordForms: one('SELECT COUNT(*) n FROM word_forms'),
      sentences: one('SELECT COUNT(*) n FROM sentences'),
      sentencesWithVi: one("SELECT COUNT(*) n FROM sentences WHERE vi IS NOT NULL AND vi <> ''"),
      sentenceWords: one('SELECT COUNT(*) n FROM sentence_words'),
      decks: one('SELECT COUNT(*) n FROM decks'),
      withIpaUs: one("SELECT COUNT(*) n FROM words WHERE ipa_us IS NOT NULL AND ipa_us <> ''"),
      sensitive: one('SELECT COUNT(*) n FROM words WHERE sensitive = 1'),
      withViShort: one(
        "SELECT COUNT(*) n FROM words WHERE vi_short IS NOT NULL AND vi_short <> ''"
      ),
      top10k: one(`SELECT COUNT(*) n FROM words WHERE freq_rank <= ${TOP}`),
      top10kWithVi: one(
        `SELECT COUNT(*) n FROM words WHERE freq_rank <= ${TOP} AND vi_short IS NOT NULL AND vi_short <> ''`
      ),
      outsideTop10k: one(
        `SELECT COUNT(*) n FROM words WHERE freq_rank IS NULL OR freq_rank > ${TOP}`
      ),
      outsideTop10kWithVi: one(
        `SELECT COUNT(*) n FROM words WHERE (freq_rank IS NULL OR freq_rank > ${TOP}) AND vi_short IS NOT NULL AND vi_short <> ''`
      )
    }
    out.top10kNoVi = Number(out.top10k) - Number(out.top10kWithVi)
    out.outsideTop10kNoVi = Number(out.outsideTop10k) - Number(out.outsideTop10kWithVi)

    // Nghĩa Việt do AI sinh (origin "generated") và trạng thái duyệt — đọc từ JSON đầy đủ
    let generated = 0
    let generatedTop = 0
    const status: Record<string, number> = {}
    const rows = db.prepare('SELECT freq_rank r, data FROM words').all() as Array<{
      r: number | null
      data: string
    }>
    for (const row of rows) {
      const w = JSON.parse(row.data) as WordData
      const s = w.review?.status ?? 'none'
      status[s] = (status[s] ?? 0) + 1
      const gen = (w.vi ?? []).some((v) => v.origin === 'generated')
      if (gen) {
        generated++
        if (row.r !== null && row.r <= TOP) generatedTop++
      }
    }
    // File curated: số mục sinh nghĩa theo trạng thái duyệt (draft cần duyệt trước `validate --release`)
    const cur = JSON.parse(
      await readFile(join(CURATED_DIR, 'vocab', 'vi-generated.json'), 'utf8')
    ) as {
      entries:
        Record<string, { review?: { status?: string } }> | Array<{ review?: { status?: string } }>
    }
    const curated = Array.isArray(cur.entries) ? cur.entries : Object.values(cur.entries)
    out.curatedViGenerated = curated.length
    for (const e of curated) {
      const k = `curatedVi_${e.review?.status ?? 'none'}`
      out[k] = Number(out[k] ?? 0) + 1
    }
    out.viGenerated = generated
    out.viGeneratedTop10k = generatedTop
    for (const [k, v] of Object.entries(status)) out[`review_${k}`] = v

    if (args.includes('--json')) console.log(JSON.stringify(out, null, 2))
    else for (const [k, v] of Object.entries(out)) console.log(`${k.padEnd(22)} ${v}`)
    db.close()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
