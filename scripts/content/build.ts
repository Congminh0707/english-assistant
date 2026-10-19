// pnpm content:build [packId]  (mặc định: core-dictionary)
// normalized/*.jsonl → content/.build/<id>/content.db → content/packs/<id>-<version>.eapack
// (.eapack = zip: manifest.json, content.db, LICENSES.md). Chạy validate trước; lỗi → dừng.
import { existsSync } from 'node:fs'
import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  CONTENT_SCHEMA_VERSION,
  LEVEL_CODES,
  PackManifest,
  type Deck,
  type LevelCode,
  type Sentence,
  type Word
} from '../../src/shared/schemas/content'
import { CONTENT_DB_SCHEMA } from './build/schema'
import { ensureDir, log, readJsonl, sha256File, writeJson } from './lib/io'
import { BUILD_DIR, PACKS_DIR, normalizedPath, rawPath } from './lib/paths'
import { writeZip } from './lib/zip'
import { PACKS, type PackConfig } from './packs'
import { SOURCES, isSourceId, sourceInfo } from './sources'
import { validateNormalized } from './validate/normalized'

/** Từ dùng làm mẫu trong content/packs/samples (commit vào git để app dev có dữ liệu thật nhỏ) */
const SAMPLE_WORDS = [
  'go',
  'apple',
  'appointment',
  'computer',
  'bank',
  'beautiful',
  'color',
  'Monday'
]

async function buildDb(
  dbPath: string,
  sourceIds: Set<string>,
  pack: PackConfig
): Promise<Record<string, number>> {
  await rm(dbPath, { force: true })
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF; PRAGMA page_size = 4096;')
  db.exec(CONTENT_DB_SCHEMA)
  const counts: Record<string, number> = {
    words: 0,
    word_forms: 0,
    sentences: 0,
    sentence_words: 0,
    decks: 0,
    sources: 0
  }

  db.exec('BEGIN')
  const insSource = db.prepare(
    'INSERT INTO sources (id, name, url, license, attribution) VALUES (?, ?, ?, ?, ?)'
  )
  for (const id of [...sourceIds].sort()) {
    if (!isSourceId(id)) continue
    const s = sourceInfo(id)
    insSource.run(s.id, s.name, s.url, s.license, s.attribution)
    counts.sources++
  }

  const insWord = db.prepare(
    'INSERT INTO words (id, lemma, pos, ipa_us, ipa_uk, level, freq_rank, lists, vi_short, sensitive, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insForm = db.prepare(
    'INSERT OR IGNORE INTO word_forms (form, word_id, tags) VALUES (?, ?, ?)'
  )
  const insFts = db.prepare('INSERT INTO words_fts (word_id, lemma, vi_meanings) VALUES (?, ?, ?)')
  for await (const w of readJsonl<Word>(normalizedPath('words.jsonl'))) {
    insWord.run(
      w.id,
      w.lemma,
      JSON.stringify(w.pos),
      w.ipa.us ?? null,
      w.ipa.uk ?? null,
      w.level,
      w.freqRank ?? null,
      JSON.stringify(w.lists),
      w.viShort ?? null,
      w.sensitive ? 1 : 0,
      JSON.stringify(w)
    )
    counts.words++
    for (const f of w.forms) {
      const r = insForm.run(f.form.toLowerCase(), w.id, JSON.stringify(f.tags))
      counts.word_forms += Number(r.changes)
    }
    insFts.run(w.id, w.lemma, w.vi.map((v) => v.text).join(' ; '))
  }

  const insSentence = db.prepare(
    'INSERT INTO sentences (id, en, vi, level, audio, source, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insSw = db.prepare(
    'INSERT OR IGNORE INTO sentence_words (word_id, sentence_id) VALUES (?, ?)'
  )
  for await (const s of readJsonl<Sentence>(normalizedPath('sentences.jsonl'))) {
    insSentence.run(
      s.id,
      s.en,
      s.translations[0]?.text ?? null,
      s.level,
      s.audio ?? null,
      JSON.stringify(s.source),
      // wordIds đã nằm trong bảng sentence_words
      JSON.stringify({ ...s, wordIds: undefined })
    )
    counts.sentences++
    for (const wid of s.wordIds) counts.sentence_words += Number(insSw.run(wid, s.id).changes)
  }

  const insDeck = db.prepare(
    'INSERT INTO decks (id, kind, level, tracks, title, word_ids, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for await (const d of readJsonl<Deck>(normalizedPath('decks.jsonl'))) {
    insDeck.run(
      d.id,
      d.kind,
      d.level,
      JSON.stringify(d.tracks),
      JSON.stringify(d.title),
      JSON.stringify(d.wordIds),
      JSON.stringify(d)
    )
    counts.decks++
  }

  const insMeta = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)')
  insMeta.run('pack_id', pack.id)
  insMeta.run('version', pack.version)
  insMeta.run('schema_version', String(CONTENT_SCHEMA_VERSION))
  insMeta.run('license', pack.license)
  insMeta.run('built_at', new Date().toISOString())
  insMeta.run('counts', JSON.stringify(counts))
  db.exec('COMMIT')

  db.exec("INSERT INTO words_fts (words_fts) VALUES ('optimize')")
  db.exec('ANALYZE')
  db.exec('VACUUM')
  const ok = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
  if (ok.integrity_check !== 'ok') throw new Error(`integrity_check: ${ok.integrity_check}`)
  db.close()
  return counts
}

async function renderLicenses(pack: PackConfig, sourceIds: Set<string>): Promise<string> {
  const lines = [
    `# ${pack.title.en} (${pack.id} ${pack.version}) — licenses & attribution`,
    '',
    `This content pack as a whole is licensed under **${pack.license.replace(/-/g, ' ').replace('CC BY SA 4.0', 'CC BY-SA 4.0')}**`,
    '(https://creativecommons.org/licenses/by-sa/4.0/) because it adapts share-alike material',
    '(Wiktionary, NGSL, TSL, Octanove). Parts from other sources keep their own licenses listed below;',
    'every record in content.db also carries its own `source` (id, url, license, author when known).',
    '',
    'Changes made: entries were filtered to a learner vocabulary, reformatted into a common schema,',
    'linked across sources and tagged with levels; Vietnamese meanings were reordered by frequency.',
    'The data is provided "as is", without warranty of any kind.',
    ''
  ]
  for (const id of [...sourceIds].sort()) {
    if (!isSourceId(id)) continue
    const s = SOURCES[id]
    lines.push(
      `## ${s.name}`,
      '',
      `- Source: ${s.url}`,
      `- License: ${s.license}${'licenseUrl' in s ? ` (${s.licenseUrl})` : ''}`,
      `- Attribution: ${s.attribution}`,
      ''
    )
    if (id === 'cmudict') {
      const path = rawPath('cmudict', 'LICENSE')
      if (!existsSync(path))
        throw new Error('CMUdict LICENSE missing — run pnpm content:fetch cmudict')
      lines.push('```text', (await readFile(path, 'utf8')).trim(), '```', '')
    }
  }
  return lines.join('\n')
}

async function writeSample(pack: PackConfig): Promise<void> {
  const want = new Set(SAMPLE_WORDS.map((w) => `word:en:${w.toLowerCase()}`))
  const words: Word[] = []
  for await (const w of readJsonl<Word>(normalizedPath('words.jsonl')))
    if (want.has(w.id)) words.push(w)
  const exampleIds = new Set(words.flatMap((w) => w.examples.map((e) => `sentence:${e.sourceId}`)))
  const sentences: Sentence[] = []
  for await (const s of readJsonl<Sentence>(normalizedPath('sentences.jsonl')))
    if (exampleIds.has(s.id)) sentences.push(s)
  await writeJson(join(PACKS_DIR, 'samples', `${pack.id}.sample.json`), {
    $comment: `Sample records from ${pack.id} ${pack.version} (generated by pnpm content:build). License: ${pack.license} — see content/packs/samples/README.md`,
    words,
    sentences
  })
}

async function main(): Promise<void> {
  const packId = process.argv[2] ?? 'core-dictionary'
  const pack = PACKS[packId]
  if (!pack) throw new Error(`Unknown pack "${packId}". Known: ${Object.keys(PACKS).join(', ')}`)

  log('validate normalized data…')
  const v = await validateNormalized()
  if (v.errors.length) {
    for (const e of v.errors.slice(0, 30)) console.error('  ✗', e)
    throw new Error(`${v.errors.length} validation errors — fix before building`)
  }

  const workDir = join(BUILD_DIR, pack.id)
  await ensureDir(workDir)
  const dbPath = join(workDir, 'content.db')
  log(`build ${dbPath}`)
  const counts = await buildDb(dbPath, v.sourceIds, pack)

  const levels = new Set<LevelCode>()
  for await (const w of readJsonl<Word>(normalizedPath('words.jsonl'))) levels.add(w.level)
  const manifest = PackManifest.parse({
    id: pack.id,
    version: pack.version,
    schemaVersion: CONTENT_SCHEMA_VERSION,
    title: pack.title,
    levels: LEVEL_CODES.filter((l) => levels.has(l)),
    tracks: pack.tracks,
    license: pack.license,
    requires: [],
    builtAt: new Date().toISOString(),
    counts,
    files: [
      { path: 'content.db', sizeBytes: (await stat(dbPath)).size, sha256: await sha256File(dbPath) }
    ]
  })

  await ensureDir(PACKS_DIR)
  const out = join(PACKS_DIR, `${pack.id}-${pack.version}.eapack`)
  await writeZip(out, [
    { name: 'manifest.json', data: JSON.stringify(manifest, null, 2) + '\n' },
    { name: 'content.db', path: dbPath },
    { name: 'LICENSES.md', data: await renderLicenses(pack, v.sourceIds) }
  ])
  const packSha = await sha256File(out)
  await writeFile(`${out}.sha256`, `${packSha}  ${pack.id}-${pack.version}.eapack\n`)
  await writeSample(pack)

  const mb = (n: number): string => `${(n / 2 ** 20).toFixed(1)} MB`
  log(`✔ ${out}`)
  log(
    `  pack ${mb((await stat(out)).size)} (content.db ${mb(manifest.files[0].sizeBytes)}), sha256 ${packSha}`
  )
  log(
    `  ${Object.entries(counts)
      .map(([k, n]) => `${k}=${n}`)
      .join(' ')}`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
