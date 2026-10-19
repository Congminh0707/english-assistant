import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { strToU8, unzipSync, zipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTENT_DB_SCHEMA } from '../../../scripts/content/build/schema'
import { normalizeQuery } from '@shared/schemas/dictionary'
import { FakeClock } from '../core/Clock'
import { openUserDb, type UserDbConnection } from '../db/client'
import { createContainer, type Container } from '../container'
import { compareVersions } from './ContentPackService'

const MIGRATIONS = resolve('src/main/db/migrations')

/** Tạo gói core-dictionary mẫu (vài từ) đúng định dạng .eapack của pipeline */
function buildFixturePack(dir: string, version = '1.0.0'): string {
  const dbPath = join(dir, `fixture-${version}.db`)
  const db = new Database(dbPath)
  db.exec(CONTENT_DB_SCHEMA)
  const word = (
    id: string,
    lemma: string,
    rank: number,
    vi: string[],
    origin = 'wiktionary'
  ): void => {
    const data = {
      id,
      lemma,
      pos: ['verb'],
      ipa: { us: `/${lemma}/` },
      senses: [{ id: 's1', pos: 'verb', en: `to ${lemma}`, vi: [], tags: [], examples: [] }],
      vi: vi.map((text) => ({ text, origin })),
      examples: [{ en: `I ${lemma} every day.`, vi: 'Ví dụ.', sourceId: 'tatoeba:1' }]
    }
    db.prepare(
      `INSERT INTO words (id, lemma, pos, ipa_us, ipa_uk, level, freq_rank, lists, vi_short, data)
       VALUES (?, ?, '["verb"]', ?, NULL, 'A1_1', ?, '[]', ?, ?)`
    ).run(id, lemma, `/${lemma}/`, rank, vi.join('; ') || null, JSON.stringify(data))
    db.prepare('INSERT INTO words_fts (word_id, lemma, vi_meanings) VALUES (?, ?, ?)').run(
      id,
      lemma,
      vi.join(' ; ')
    )
  }
  word('word:en:go', 'go', 20, ['đi', 'ra đi'])
  word('word:en:apple', 'apple', 900, ['quả táo', 'táo'])
  word('word:en:ponder', 'ponder', 5000, ['suy ngẫm'], 'generated')
  db.prepare(
    `INSERT INTO word_forms (form, word_id, tags) VALUES ('went', 'word:en:go', '["past"]')`
  ).run()
  db.close()

  const bytes = readFileSync(dbPath)
  const manifest = {
    id: 'core-dictionary',
    version,
    schemaVersion: 1,
    title: { vi: 'Từ điển', en: 'Dictionary' },
    levels: [],
    tracks: [],
    license: 'CC-BY-SA-4.0',
    requires: [],
    builtAt: '2026-10-18T00:00:00Z',
    counts: { words: 3 },
    files: [
      {
        path: 'content.db',
        sizeBytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex')
      }
    ]
  }
  const zip = zipSync({
    'manifest.json': strToU8(JSON.stringify(manifest)),
    'content.db': new Uint8Array(bytes),
    'LICENSES.md': strToU8('# Licenses')
  })
  const packPath = join(dir, `core-dictionary-${version}.eapack`)
  writeFileSync(packPath, zip)
  return packPath
}

let tmp: string
let conn: UserDbConnection
let c: Container

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'ea-test-'))
  conn = openUserDb(':memory:', MIGRATIONS)
  c = createContainer(conn, new FakeClock(), { packsDir: join(tmp, 'packs') })
})

afterEach(() => {
  c.packs.closeAll()
  conn.close()
  rmSync(tmp, { recursive: true, force: true })
})

describe('normalizeQuery', () => {
  it('bỏ dấu câu bao quanh và phân loại độ dài', () => {
    expect(normalizeQuery('  “Went,” ')).toEqual({ query: 'Went', kind: 'word' })
    expect(normalizeQuery("don't")).toEqual({ query: "don't", kind: 'word' })
    expect(normalizeQuery('look after')).toEqual({ query: 'look after', kind: 'phrase' })
    expect(normalizeQuery('I went to the market yesterday.').kind).toBe('sentence')
    expect(normalizeQuery(' ... ').kind).toBe('empty')
  })
})

describe('ContentPackService', () => {
  it('so sánh phiên bản', () => {
    expect(compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0)
    expect(compareVersions('1.2.0', '1.10.0')).toBeLessThan(0)
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0)
  })

  it('cài gói đi kèm một lần, kiểm tra sha256, nâng cấp khi có bản mới', async () => {
    const bundled = join(tmp, 'bundled')
    rmSync(bundled, { recursive: true, force: true })
    mkdirSync(bundled)
    buildFixturePack(bundled, '1.0.0')

    expect(await c.packs.ensureBundled(bundled)).toEqual(['core-dictionary'])
    expect(await c.packs.ensureBundled(bundled)).toEqual([]) // đã cài rồi
    expect(c.packs.list()[0].version).toBe('1.0.0')

    buildFixturePack(bundled, '1.1.0')
    expect(await c.packs.ensureBundled(bundled)).toEqual(['core-dictionary'])
    expect(c.packs.list()[0].version).toBe('1.1.0')
  })

  it('từ chối gói bị hỏng (sha256 không khớp)', async () => {
    const pack = buildFixturePack(tmp)
    const files = unzipSync(readFileSync(pack))
    files['content.db'][100] ^= 0xff // làm hỏng 1 byte
    writeFileSync(pack, zipSync(files))
    await expect(c.packs.install(pack)).rejects.toThrow(/PACK_CORRUPT/)
    expect(c.packs.list()).toHaveLength(0)
  })
})

describe('DictionaryService + VocabService', () => {
  beforeEach(async () => {
    await c.packs.install(buildFixturePack(tmp))
  })

  it('báo thiếu gói khi chưa cài', () => {
    const fresh = createContainer(openUserDb(':memory:', MIGRATIONS), new FakeClock(), {
      packsDir: join(tmp, 'other')
    })
    expect(fresh.dictionary.lookup('go').packMissing).toBe(true)
  })

  it('tra theo từ gốc, dạng đã chia và nghĩa tiếng Việt', () => {
    const exact = c.dictionary.lookup('Go')
    expect(exact.entries[0]).toMatchObject({ lemma: 'go', via: 'lemma', vi: ['đi', 'ra đi'] })
    expect(exact.entries[0].examples[0]).toEqual({ en: 'I go every day.', vi: 'Ví dụ.' })

    const form = c.dictionary.lookup('went.')
    expect(form.entries[0]).toMatchObject({ lemma: 'go', via: 'form', formTags: ['past'] })

    const reverse = c.dictionary.lookup('táo')
    expect(reverse.entries[0]).toMatchObject({ lemma: 'apple', via: 'search' })
    expect(c.dictionary.lookup('tao').entries[0]?.lemma).toBe('apple') // bỏ dấu vẫn tìm được
  })

  it('đánh dấu nghĩa do AI sinh, không tra cả câu', () => {
    expect(c.dictionary.lookup('ponder').entries[0].viGenerated).toBe(true)
    expect(c.dictionary.lookup('go').entries[0].viGenerated).toBe(false)
    const sentence = c.dictionary.lookup('I went to the market yesterday')
    expect(sentence).toMatchObject({ kind: 'sentence', entries: [] })
  })

  it('lưu từ: tạo thẻ SRS một lần, +1 XP cho từ mới, đánh dấu đã lưu khi tra lại', () => {
    const xpBefore = c.pet.get().totalXp
    expect(c.vocab.save({ contentId: 'word:en:go', text: 'go', context: 'I went home.' })).toEqual({
      isNew: true,
      cardCreated: true
    })
    expect(c.vocab.save({ contentId: 'word:en:go', text: 'Go' })).toEqual({
      isNew: false,
      cardCreated: false
    })
    expect(c.pet.get().totalXp).toBe(xpBefore + 1)
    const res = c.dictionary.lookup('went', (ids) => c.vocab.savedContentIds(ids))
    expect(res.entries[0].saved).toBe(true)
  })
})
