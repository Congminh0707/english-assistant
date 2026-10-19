// pnpm content:lookup [từ...] [--pack file.eapack]
// Demo tra từ trên pack đã build — cùng thuật toán DictionaryService của app nên dùng:
//   1) khớp lemma  2) khớp dạng đã chia (word_forms)  3) FTS: tiền tố tiếng Anh / tra ngược tiếng Việt
import { existsSync } from 'node:fs'
import { readdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Word } from '../../src/shared/schemas/content'
import { ensureDir } from './lib/io'
import { BUILD_DIR, PACKS_DIR } from './lib/paths'
import { readZipEntry } from './lib/zip'

const DEMO = ['went', 'apple', 'better', 'colour', 'appointments', 'táo', 'ngan hang']

interface WordRow {
  id: string
  lemma: string
  level: string
  ipa_us: string | null
  ipa_uk: string | null
  vi_short: string | null
  freq_rank: number | null
  data: string
}

interface Hit {
  row: WordRow
  via: string
}

async function openPack(packArg?: string): Promise<DatabaseSync> {
  let pack = packArg
  if (!pack) {
    const files = (await readdir(PACKS_DIR)).filter(
      (f) => f.startsWith('core-dictionary-') && f.endsWith('.eapack')
    )
    if (!files.length) throw new Error('No core-dictionary pack — run pnpm content:build')
    pack = join(PACKS_DIR, files.sort().at(-1)!)
  }
  const dir = join(BUILD_DIR, 'lookup')
  const dbPath = join(dir, 'content.db')
  if (!existsSync(dbPath) || (await stat(dbPath)).mtimeMs < (await stat(pack)).mtimeMs) {
    await ensureDir(dir)
    await writeFile(dbPath, await readZipEntry(pack, 'content.db'))
  }
  console.log(`pack: ${pack}\n`)
  return new DatabaseSync(dbPath, { readOnly: true })
}

function lookup(db: DatabaseSync, input: string): Hit[] {
  const q = input.trim()
  const cols = 'w.id, w.lemma, w.level, w.ipa_us, w.ipa_uk, w.vi_short, w.freq_rank, w.data'
  const exact = db
    .prepare(`SELECT ${cols} FROM words w WHERE w.lemma = ? COLLATE NOCASE ORDER BY w.freq_rank`)
    .all(q) as unknown as WordRow[]
  const forms = db
    .prepare(
      `SELECT ${cols}, f.tags FROM word_forms f JOIN words w ON w.id = f.word_id WHERE f.form = ? ORDER BY w.freq_rank`
    )
    .all(q.toLowerCase()) as unknown as (WordRow & { tags: string })[]
  const hits: Hit[] = [
    ...exact.map((row) => ({ row, via: 'lemma' })),
    ...forms
      .filter((f) => !exact.some((e) => e.id === f.id))
      .map((row) => ({
        row,
        via: `form of ${row.lemma} (${(JSON.parse(row.tags) as string[]).join(', ') || 'family'})`
      }))
  ]
  if (hits.length) {
    // Cùng quy tắc với DictionaryService: từ tra là dạng biến tố của từ gốc khác và mục riêng của nó
    // không thuộc danh sách chuẩn nào (came, apples) → hiện từ gốc trước
    const INFLECTION = [
      'past',
      'participle',
      'present',
      'plural',
      'third-person',
      'gerund',
      'comparative',
      'superlative'
    ]
    const inflected = hits.filter(
      (h) => h.via.startsWith('form of') && INFLECTION.some((t) => h.via.includes(t))
    )
    if (!inflected.length) return hits
    const isStrong = (h: Hit): boolean =>
      h.via === 'lemma' && (JSON.parse(h.row.data) as Word).lists.length > 0
    const strong = hits.filter(isStrong)
    const weak = hits.filter((h) => h.via === 'lemma' && !isStrong(h))
    const rest = hits.filter(
      (h) => !strong.includes(h) && !weak.includes(h) && !inflected.includes(h)
    )
    return [...strong, ...inflected, ...weak, ...rest]
  }
  // Không khớp tiếng Anh → tìm nghĩa tiếng Việt (FTS bỏ dấu: 'tao' khớp 'táo', 'tạo', 'tảo')
  // hoặc tiền tố tiếng Anh. Xếp hạng: nghĩa trùng khớp nguyên văn > chứa đúng dấu > còn lại; rồi theo tần suất.
  const phrase = `"${q.replace(/"/g, '')}"`
  const rows = db
    .prepare(
      `SELECT ${cols}, words_fts.vi_meanings AS vi_all FROM words_fts JOIN words w ON w.id = words_fts.word_id
       WHERE words_fts MATCH ? ORDER BY bm25(words_fts) LIMIT 50`
    )
    .all(`vi_meanings : ${phrase} OR lemma : ${phrase}*`) as unknown as (WordRow & {
    vi_all: string
  })[]
  const needle = q.toLowerCase()
  const score = (r: WordRow & { vi_all: string }): number => {
    const meanings = r.vi_all.toLowerCase().split(' ; ')
    if (meanings.includes(needle)) return 2
    return meanings.some((m) => ` ${m} `.includes(` ${needle} `)) ? 1 : 0
  }
  return rows
    .map((row) => ({ row, s: score(row) }))
    .sort((a, b) => b.s - a.s || (a.row.freq_rank ?? 1e9) - (b.row.freq_rank ?? 1e9))
    .slice(0, 5)
    .map(({ row }) => ({ row, via: 'search' }))
}

function examples(db: DatabaseSync, word: Word): { en: string; vi?: string }[] {
  const out: { en: string; vi?: string }[] = word.examples.map((e) => ({ en: e.en, vi: e.vi }))
  if (out.length < 2) {
    const more = db
      .prepare(
        `SELECT s.en, s.vi FROM sentence_words sw JOIN sentences s ON s.id = sw.sentence_id
         WHERE sw.word_id = ? ORDER BY s.vi IS NULL, length(s.en) LIMIT 3`
      )
      .all(word.id) as { en: string; vi: string | null }[]
    for (const m of more)
      if (!out.some((o) => o.en === m.en)) out.push({ en: m.en, vi: m.vi ?? undefined })
  }
  return out.slice(0, 2)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const packIdx = args.indexOf('--pack')
  const packArg = packIdx >= 0 ? args[packIdx + 1] : undefined
  const words = args.filter((a, i) => !a.startsWith('--') && (packIdx < 0 || i !== packIdx + 1))
  const db = await openPack(packArg)
  for (const input of words.length ? words : DEMO) {
    const hits = lookup(db, input)
    console.log(`▶ ${input}`)
    if (!hits.length) console.log('  (không tìm thấy)')
    for (const { row, via } of hits.slice(0, 3)) {
      const w = JSON.parse(row.data) as Word
      const ipa = [row.ipa_us && `US ${row.ipa_us}`, row.ipa_uk && `UK ${row.ipa_uk}`]
        .filter(Boolean)
        .join('  ')
      console.log(
        `  ${row.lemma}  [${w.pos.join(', ')}]  level ${row.level}  rank ${row.freq_rank ?? '-'}  — ${via}`
      )
      if (ipa) console.log(`    ${ipa}`)
      console.log(`    vi: ${row.vi_short ?? '(chưa có nghĩa tiếng Việt)'}`)
      if (w.senses[0]) console.log(`    en: ${w.senses[0].en}`)
      for (const ex of examples(db, w))
        console.log(`    ex: ${ex.en}${ex.vi ? `  →  ${ex.vi}` : ''}`)
    }
    console.log()
  }
  db.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
