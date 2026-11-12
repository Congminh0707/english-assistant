import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { strToU8, unzipSync, zipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTENT_DB_SCHEMA } from '../../../scripts/content/build/schema'
import { normalizeQuery } from '@shared/schemas/dictionary'
import type { PlacementResult } from '@shared/schemas/placement'
import type { Exercise, PracticeAnswer, PracticeSummary } from '@shared/schemas/practice'
import { FakeClock } from '../core/Clock'
import { openUserDb, type UserDbConnection } from '../db/client'
import { FreeWritingRepository } from '../db/repositories/FreeWritingRepository'
import { createContainer, type Container } from '../container'
import { compareVersions } from './ContentPackService'
import { computeStreak } from '../services/StudyService'

const MIGRATIONS = resolve('src/main/db/migrations')

const PRACTICE_WORDS: Array<[string, string, string]> = [
  ['school', 'trường học', 'noun'],
  ['dog', 'con chó', 'noun'],
  ['book', 'cuốn sách', 'noun'],
  ['house', 'ngôi nhà', 'noun'],
  ['water', 'nước', 'noun'],
  ['friend', 'người bạn', 'noun'],
  ['garden', 'khu vườn', 'noun'],
  ['eat', 'ăn', 'verb'],
  ['run', 'chạy', 'verb'],
  ['read', 'đọc', 'verb'],
  ['big', 'to lớn', 'adjective'],
  ['happy', 'hạnh phúc', 'adjective']
]
/** [câu tiếng Anh, bản dịch, các từ trong câu] — câu cuối chứa từ nhạy cảm (crap) */
const PRACTICE_SENTENCES: Array<[string, string, string[]]> = [
  [
    'My friend has a big dog at home.',
    'Bạn tôi có một con chó lớn ở nhà.',
    ['friend', 'big', 'dog']
  ],
  [
    'We read a good book every night.',
    'Chúng tôi đọc một cuốn sách hay mỗi tối.',
    ['read', 'book']
  ],
  ['The children run to the school together.', 'Bọn trẻ cùng chạy đến trường.', ['run', 'school']],
  ['Please give me some water to drink.', 'Làm ơn cho tôi ít nước để uống.', ['water']],
  ['They are happy in their small house.', 'Họ hạnh phúc trong ngôi nhà nhỏ.', ['happy', 'house']],
  ['I eat breakfast with my family daily.', 'Tôi ăn sáng cùng gia đình mỗi ngày.', ['eat']],
  [
    'He wants to read the book again today.',
    'Anh ấy muốn đọc lại cuốn sách hôm nay.',
    ['read', 'book']
  ],
  [
    'The old house has a very big garden.',
    'Ngôi nhà cũ có một khu vườn rất lớn.',
    ['house', 'big', 'garden']
  ],
  ['Tom goes to school with his friend.', 'Tom đi học cùng bạn.', ['school', 'friend']],
  [
    'My dog likes to run in the garden.',
    'Con chó của tôi thích chạy trong vườn.',
    ['dog', 'run', 'garden']
  ],
  [
    'Every morning she reads a book about animals.',
    'Mỗi sáng cô ấy đọc một cuốn sách về động vật.',
    ['book']
  ],
  [
    'The big school is near my house.',
    'Ngôi trường lớn ở gần nhà tôi.',
    ['big', 'school', 'house']
  ],
  [
    'We drink water and eat fruit daily.',
    'Chúng tôi uống nước và ăn trái cây mỗi ngày.',
    ['water', 'eat']
  ],
  [
    'A happy friend is a good friend.',
    'Một người bạn vui vẻ là người bạn tốt.',
    ['happy', 'friend']
  ],
  [
    'This crap is not good for the garden.',
    'Thứ bẩn này không tốt cho khu vườn.',
    ['crap', 'garden']
  ]
]

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
    origin = 'wiktionary',
    lists: string[] = [],
    pos = 'verb'
  ): void => {
    const data = {
      id,
      lemma,
      pos: [pos],
      ipa: { us: `/${lemma}/` },
      senses: [{ id: 's1', pos, en: `to ${lemma}`, vi: [], tags: [], examples: [] }],
      vi: vi.map((text) => ({ text, origin })),
      examples: [{ en: `I ${lemma} every day.`, vi: 'Ví dụ.', sourceId: 'tatoeba:1' }]
    }
    db.prepare(
      `INSERT INTO words (id, lemma, pos, ipa_us, ipa_uk, level, freq_rank, lists, vi_short, data)
       VALUES (?, ?, ?, ?, NULL, 'A1_1', ?, ?, ?, ?)`
    ).run(
      id,
      lemma,
      JSON.stringify([pos]),
      `/${lemma}/`,
      rank,
      JSON.stringify(lists),
      vi.join('; ') || null,
      JSON.stringify(data)
    )
    db.prepare('INSERT INTO words_fts (word_id, lemma, vi_meanings) VALUES (?, ?, ?)').run(
      id,
      lemma,
      vi.join(' ; ')
    )
  }
  word('word:en:go', 'go', 20, ['đi', 'ra đi'], 'wiktionary', ['ngsl'])
  word('word:en:apple', 'apple', 900, ['quả táo', 'táo'])
  word('word:en:ponder', 'ponder', 5000, ['suy ngẫm'], 'generated')
  // Mục riêng hiếm của một dạng biến tố (giống 'came' trong dữ liệu thật) + mục riêng thuộc danh sách chuẩn
  word('word:en:went', 'went', 3000, ['(nghĩa hiếm)'])
  word('word:en:left', 'left', 150, ['trái', 'bên trái'], 'wiktionary', ['ngsl'])
  word('word:en:leave', 'leave', 120, ['rời đi'], 'wiktionary', ['ngsl'])
  // Từ và câu cho bài luyện tập (không thuộc danh sách chuẩn nên không ảnh hưởng "từ của khoảnh khắc")
  for (const [lemma, vi, pos] of PRACTICE_WORDS) {
    word(`word:en:${lemma}`, lemma, 300 + lemma.length, [vi], 'wiktionary', [], pos)
  }
  const insSentence = db.prepare(
    `INSERT INTO sentences (id, en, vi, level, audio, source, data) VALUES (?, ?, ?, 'A1_1', NULL, '{}', '{}')`
  )
  const insLink = db.prepare('INSERT INTO sentence_words (word_id, sentence_id) VALUES (?, ?)')
  PRACTICE_SENTENCES.forEach(([en, vi, words], i) => {
    const id = `sentence:tatoeba:${9000 + i}`
    insSentence.run(id, en, vi)
    for (const w of words) insLink.run(`word:en:${w}`, id)
  })
  // Từ nhạy cảm: ẩn ở profile trẻ em
  word('word:en:crap', 'crap', 4000, ['đồ tồi'])
  db.prepare("UPDATE words SET sensitive = 1 WHERE id = 'word:en:crap'").run()
  const form = db.prepare('INSERT INTO word_forms (form, word_id, tags) VALUES (?, ?, ?)')
  form.run('went', 'word:en:go', '["past"]')
  form.run('left', 'word:en:leave', '["past"]')
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

/** Tổng XP đã ghi sổ cho một lý do (không lẫn thưởng nhiệm vụ) */
const xpByReason = (reason: string): number =>
  Number(
    (
      conn.sqlite
        .prepare('SELECT coalesce(sum(amount), 0) AS n FROM xp_events WHERE reason = ?')
        .get(reason) as { n: number }
    ).n
  )

/** Các test cũ giả định ôn theo hạn và không ẩn từ vừa ôn; ôn ngẫu nhiên/ẩn từ có test riêng */
function legacyReview(container: Container): void {
  container.settings.set('review.order', 'mixed')
  container.settings.set('review.hideMinutes', 0)
}

let tmp: string
let conn: UserDbConnection
let c: Container

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'ea-test-'))
  conn = openUserDb(':memory:', MIGRATIONS)
  c = createContainer(conn, new FakeClock(), { packsDir: join(tmp, 'packs') })
  legacyReview(c)
})

afterEach(() => {
  c.packs.closeAll()
  conn.close()
  rmSync(tmp, { recursive: true, force: true })
})

describe('normalizeQuery', () => {
  it('bỏ dấu câu bao quanh và phân loại độ dài', () => {
    expect(normalizeQuery('  “Went,” ')).toEqual({ query: 'Went', kind: 'word', truncated: false })
    expect(normalizeQuery("don't")).toEqual({ query: "don't", kind: 'word', truncated: false })
    expect(normalizeQuery('look after')).toEqual({
      query: 'look after',
      kind: 'phrase',
      truncated: false
    })
    expect(normalizeQuery('I went to the market yesterday.').kind).toBe('sentence')
    expect(normalizeQuery(' ... ').kind).toBe('empty')
    // Văn bản dài: giữ tới 1200 ký tự (không cắt ở 200) và báo đã cắt
    const long = normalizeQuery('word '.repeat(400))
    expect(long.query.length).toBeLessThanOrEqual(1200)
    expect(long.query.length).toBeGreaterThan(1000)
    expect(long.truncated).toBe(true)
    expect(normalizeQuery('word '.repeat(100)).truncated).toBe(false)
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

    // 'went' có mục riêng hiếm (không thuộc danh sách chuẩn) → từ gốc 'go' lên trước
    const form = c.dictionary.lookup('went.')
    expect(form.entries[0]).toMatchObject({ lemma: 'go', via: 'form', formTags: ['past'] })
    expect(form.entries[1]).toMatchObject({ lemma: 'went', via: 'lemma' })

    // 'left' có mục riêng thuộc NGSL → giữ đầu, 'leave' theo sau
    expect(c.dictionary.lookup('left').entries.map((e) => e.lemma)).toEqual(['left', 'leave'])

    const reverse = c.dictionary.lookup('táo')
    expect(reverse.entries[0]).toMatchObject({ lemma: 'apple', via: 'search' })
    expect(c.dictionary.lookup('tao').entries[0]?.lemma).toBe('apple') // bỏ dấu vẫn tìm được
  })

  it('đánh dấu nghĩa do AI sinh, không tra cả câu', () => {
    expect(c.dictionary.lookup('ponder').entries[0].viGenerated).toBe(true)
    expect(c.dictionary.lookup('go').entries[0].viGenerated).toBe(false)
    // Gõ sai chính tả → gợi ý từ gần giống; từ không giống gì thì không gợi ý
    expect(c.dictionary.lookup('gardn').suggestions).toContain('garden')
    expect(c.dictionary.lookup('qzxwv').suggestions).toEqual([])
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

describe('SrsService + MicroLearningService', () => {
  let clock: FakeClock

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
    c.settings.set('learning.level', 'A1_1')
  })

  it('không có thẻ đến hạn → giới thiệu từ mới đúng trình độ, chưa lưu', () => {
    c.vocab.save({ contentId: 'word:en:left', text: 'left' })
    c.vocab.save({ contentId: 'word:en:leave', text: 'leave' })
    clock.advance(-60_000) // thẻ vừa tạo chưa đến hạn
    const quiz = c.micro.next()
    expect(quiz?.kind).toBe('new')
    if (quiz?.kind === 'new') {
      expect(quiz.lemma).toBe('go') // từ duy nhất cùng level, thuộc danh sách chuẩn, chưa lưu
      expect(quiz.vi[0]).toBe('đi')
    }
  })

  it('hỏi ôn thẻ đến hạn: trả lời đúng nhanh → lịch ôn lùi về sau, +2 XP, ghi nhật ký', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const quiz = c.micro.next()
    expect(quiz?.kind).toBe('review')
    if (quiz?.kind !== 'review') return
    expect(quiz.lemma).toBe('go')
    // Lựa chọn dùng tối đa 2 nghĩa đầu (cùng định dạng với màn ôn): 'đi; ra đi'
    expect(quiz.choices.some((x) => x.split('; ').includes('đi'))).toBe(true)
    expect(new Set(quiz.choices).size).toBe(quiz.choices.length)

    const xpBefore = xpByReason('card.reviewed')
    const res = c.micro.answer(
      quiz.id,
      quiz.choices.findIndex((x) => x.split('; ').includes('đi')),
      2000
    )
    expect(res.correct).toBe(true)
    expect(res.correctText.split('; ')).toContain('đi')
    expect(res.intervalDays).toBeGreaterThan(0)
    expect(xpByReason('card.reviewed')).toBe(xpBefore + 2)
    expect(c.srs.dueCount()).toBe(0)
    expect(conn.sqlite.prepare('SELECT rating, source FROM srs_reviews').all()).toEqual([
      { rating: 3, source: 'mascot' }
    ])
    // Không trả lời được 2 lần cùng một câu hỏi
    expect(() => c.micro.answer(quiz.id, 0, 1000)).toThrow(/NOT_FOUND/)
  })

  it('trả lời sai → "Quên" (rating 1), thẻ quay lại sớm', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const quiz = c.micro.next()
    if (quiz?.kind !== 'review') throw new Error('expected review quiz')
    const wrong = quiz.choices.findIndex((ch) => !ch.split('; ').includes('đi'))
    const res = c.micro.answer(quiz.id, wrong, 1500)
    expect(res.correct).toBe(false)
    expect(res.intervalDays).toBeLessThan(1)
    expect(conn.sqlite.prepare('SELECT rating FROM srs_reviews').get()).toEqual({ rating: 1 })
  })
})

describe('StudyService', () => {
  let clock: FakeClock

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
  })

  it('trang chủ: đếm thẻ, ôn hôm nay, streak', () => {
    expect(c.study.overview()).toMatchObject({ dueCount: 0, totalCards: 0, streakDays: 0 })
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    c.vocab.save({ contentId: 'word:en:leave', text: 'leave' })
    expect(c.study.overview()).toMatchObject({ dueCount: 2, totalCards: 2, reviewedToday: 0 })

    const { card } = c.study.next()
    c.study.rate(card!.cardId, 3, 1500)
    expect(c.study.overview()).toMatchObject({
      dueCount: 1,
      reviewedToday: 1,
      streakDays: 1,
      packMissing: false
    })
  })

  it('phiên ôn: lấy thẻ kèm nghĩa + khoảng cách dự kiến, chấm điểm ghi nguồn "study"', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go', context: 'Let us go home.' })
    const first = c.study.next()
    expect(first.dueCount).toBe(1)
    expect(first.card).toMatchObject({ lemma: 'go', isNew: true, context: 'Let us go home.' })
    expect(first.card?.vi[0]).toBe('đi')
    const [again, , good, easy] = first.card!.intervals
    expect(again).toBeLessThan(good)
    expect(good).toBeLessThanOrEqual(easy)

    const xpBefore = xpByReason('card.reviewed')
    const res = c.study.rate(first.card!.cardId, 4, 900)
    expect(res.dueCount).toBe(0)
    expect(res.intervalDays).toBeGreaterThan(0)
    expect(xpByReason('card.reviewed')).toBe(xpBefore + 2)
    expect(conn.sqlite.prepare('SELECT rating, source FROM srs_reviews').all()).toEqual([
      { rating: 4, source: 'study' }
    ])
    expect(c.study.next().card).toBeNull()
  })

  it('xoá từ: ngừng ôn, biến khỏi sổ từ; lưu lại thì dùng lại thẻ cũ', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    expect(c.study.words().map((w) => w.lemma)).toEqual(['go'])
    expect(c.study.removeWord('word:en:go')).toBe(true)
    expect(c.study.words()).toEqual([])
    expect(c.study.overview()).toMatchObject({ dueCount: 0, totalCards: 0 })
    expect(c.dictionary.lookup('go', (ids) => c.vocab.savedContentIds(ids)).entries[0].saved).toBe(
      false
    )

    const again = c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    expect(again.cardCreated).toBe(true)
    expect(c.study.words()).toHaveLength(1)
    expect(conn.sqlite.prepare('SELECT count(*) AS n FROM srs_cards').get()).toEqual({ n: 1 })
  })
})

describe('computeStreak', () => {
  it('tính ngày liên tiếp, hôm nay chưa ôn vẫn giữ streak', () => {
    expect(computeStreak([], '2026-03-10')).toBe(0)
    expect(computeStreak(['2026-03-10', '2026-03-09', '2026-03-08'], '2026-03-10')).toBe(3)
    expect(computeStreak(['2026-03-09', '2026-03-08'], '2026-03-10')).toBe(2)
    expect(computeStreak(['2026-03-10', '2026-03-08'], '2026-03-10')).toBe(1)
    expect(computeStreak(['2026-03-08'], '2026-03-10')).toBe(0)
  })
})

describe('Lọc từ nhạy cảm cho profile trẻ em', () => {
  beforeEach(async () => {
    await c.packs.install(buildFixturePack(tmp))
  })

  it('tra từ: người lớn thấy, trẻ em không thấy', () => {
    expect(c.dictionary.lookup('crap').entries.map((e) => e.lemma)).toEqual(['crap'])
    expect(c.dictionary.lookup('crap', undefined, { childSafe: true }).entries).toEqual([])
    // Tra ngược theo nghĩa tiếng Việt cũng bị ẩn
    expect(c.dictionary.lookup('đồ tồi', undefined, { childSafe: true }).entries).toEqual([])
    // Từ bình thường vẫn tra được
    expect(c.dictionary.lookup('go', undefined, { childSafe: true }).entries).toHaveLength(1)
  })

  it('câu hỏi ôn: đáp án nhiễu không lấy nghĩa của từ nhạy cảm khi là profile trẻ em', () => {
    for (let i = 0; i < 30; i++) {
      const data = c.dictionary.quizData('word:en:go', { childSafe: true })
      expect(data?.distractors).not.toContain('đồ tồi')
    }
    const seen = new Set<string>()
    for (let i = 0; i < 60; i++) {
      for (const d of c.dictionary.quizData('word:en:go')?.distractors ?? []) seen.add(d)
    }
    expect(seen.has('đồ tồi')).toBe(true)
  })

  it('profile trẻ em: cờ isChild lưu theo profile đang dùng', () => {
    const kid = c.profiles.create({ name: 'Bé', track: 'primary', isChild: true })
    c.profiles.switchTo(kid.id)
    expect(c.profiles.active().isChild).toBe(true)
  })
})

describe('MissionService', () => {
  let clock: FakeClock

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
    c.settings.set('learning.dailyGoal', 5)
  })

  it('tiến độ bắt đầu từ 0, chưa có nhiệm vụ nào xong', () => {
    const state = c.missions.state()
    expect(state.goal).toBe(5)
    expect(state.missions.map((m) => [m.id, m.progress, m.target, m.done])).toEqual([
      ['review', 0, 5, false],
      ['learn', 0, 3, false],
      ['clear', 0, 1, false]
    ])
    expect(state.allDone).toBe(false)
  })

  it('lưu 3 từ mới → xong nhiệm vụ "học", thưởng đúng một lần', () => {
    const events: string[] = []
    c.bus.on('mission.completed', (e) => events.push(e.id))
    const xp0 = c.pet.get().totalXp
    for (const [id, text] of [
      ['word:en:go', 'go'],
      ['word:en:apple', 'apple'],
      ['word:en:ponder', 'ponder']
    ]) {
      c.vocab.save({ contentId: id, text })
    }
    expect(events).toEqual(['learn'])
    // 3 từ × 1 XP + thưởng nhiệm vụ 10 XP
    expect(c.pet.get().totalXp).toBe(xp0 + 3 + 10)
    expect(c.pet.get().coins).toBeGreaterThanOrEqual(5)

    c.missions.evaluate() // gọi lại không thưởng thêm
    expect(c.pet.get().totalXp).toBe(xp0 + 13)
  })

  it('từ lưu từ cùng một câu không bị hỏi liên tiếp khi còn thẻ khác', () => {
    const context = 'Let us go home and leave now.'
    c.vocab.save({ contentId: 'word:en:go', text: 'go', context })
    c.vocab.save({ contentId: 'word:en:leave', text: 'leave', context })
    c.vocab.save({ contentId: 'word:en:apple', text: 'apple' })
    const first = c.study.next().card!
    expect(c.study.next().card!.cardId).toBe(first.cardId) // hỏi lại thì vẫn là thẻ đó
    c.study.rate(first.cardId, 3, 1000)
    const second = c.study.next().card!
    expect(first.context).toBe(context)
    expect(second.context).toBeNull() // thẻ từ cùng câu bị đẩy lại sau
  })

  it('nhiệm vụ đã xong thì thanh tiến độ không tụt lại khi có thẻ mới đến hạn', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    for (let i = 0; i < 5; i++) {
      const { card } = c.study.next()
      if (!card) break
      c.study.rate(card.cardId, 3, 1000)
    }
    const clear = (): [number, number, boolean] => {
      const m = c.missions.state().missions.find((x) => x.id === 'clear')!
      return [m.progress, m.target, m.done]
    }
    expect(clear()).toEqual([1, 1, true])
    // Lưu từ mới → có thẻ mới đến hạn (dueCount > 0) nhưng nhiệm vụ đã thưởng vẫn đầy thanh
    c.vocab.save({ contentId: 'word:en:apple', text: 'apple' })
    expect(c.srs.dueCount()).toBeGreaterThan(0)
    expect(clear()).toEqual([1, 1, true])
  })

  it('làm đủ ba nhiệm vụ → thưởng thêm, tính từng ngày', () => {
    const events: string[] = []
    c.bus.on('mission.completed', (e) => events.push(e.id))
    const ids = ['go', 'apple', 'ponder', 'left', 'leave']
    for (const w of ids) c.vocab.save({ contentId: `word:en:${w}`, text: w })
    for (let i = 0; i < 5; i++) {
      const { card } = c.study.next()
      c.study.rate(card!.cardId, 3, 1000)
    }
    expect(events).toEqual(['learn', 'review', 'clear', 'all'])
    const state = c.missions.state()
    expect(state.allDone).toBe(true)
    expect(state.bonus.done).toBe(true)
    expect(state.missions.every((m) => m.done)).toBe(true)

    // Sang ngày hôm sau: nhiệm vụ làm mới
    clock.advance(24 * 3_600_000)
    const next = c.missions.state()
    expect(next.allDone).toBe(false)
    expect(next.missions.every((m) => m.progress === 0 || m.id === 'clear')).toBe(true)
  })
})

describe('Hồ sơ & bài kiểm tra đầu vào', () => {
  beforeEach(async () => {
    await c.packs.install(buildFixturePack(tmp))
  })

  it('onboarding: đổi tên, mục tiêu học (trẻ em) và tên thú cưng của hồ sơ đầu tiên', () => {
    expect(c.settings.get('app.onboarded')).toBe(false)
    const info = c.profiles.setup({ name: 'Lan', track: 'primary', petName: 'Mimi' })
    expect(info).toMatchObject({ name: 'Lan', track: 'primary', isChild: true, petName: 'Mimi' })
    expect(c.settings.get('app.onboarded')).toBe(true)
    expect(c.pet.get().name).toBe('Mimi')
    expect(c.profiles.active().isChild).toBe(true)
    expect(c.profiles.list()).toHaveLength(1)
  })

  it('tạo thêm hồ sơ và chuyển qua lại, mỗi hồ sơ có thú cưng riêng', () => {
    const first = c.profiles.active()
    const second = c.profiles.createFromInput({ name: 'Bố', track: 'toeic', petName: 'Kuro' })
    expect(second).toMatchObject({ isChild: false, active: false, petName: 'Kuro' })
    expect(c.profiles.listInfo().map((p) => [p.name, p.active])).toEqual([
      ['Bạn', true],
      ['Bố', false]
    ])
    c.profiles.switchTo(second.id)
    expect(c.pet.get().name).toBe('Kuro')
    c.profiles.switchTo(first.id)
    expect(c.pet.get().name).toBe('Bi')
  })

  it('sửa hồ sơ: đổi tên, mục tiêu học (track → chế độ trẻ em) và tên thú cưng; chỉ trường được gửi mới đổi', () => {
    const first = c.profiles.active()

    const renamed = c.profiles.update({ id: first.id, name: 'Minh' })
    expect(renamed).toMatchObject({ name: 'Minh', track: 'general', isChild: false, petName: 'Bi' })

    const kid = c.profiles.update({ id: first.id, track: 'primary', petName: 'Mít Ướt' })
    expect(kid).toMatchObject({ name: 'Minh', track: 'primary', isChild: true, petName: 'Mít Ướt' })
    expect(c.profiles.active().isChild).toBe(true) // bộ nhớ đệm hồ sơ đang dùng được làm mới
    expect(c.pet.get().name).toBe('Mít Ướt')

    // Sửa hồ sơ KHÔNG đang dùng: không đụng hồ sơ đang dùng
    const second = c.profiles.createFromInput({ name: 'Bố', track: 'toeic', petName: 'Kuro' })
    const edited = c.profiles.update({ id: second.id, name: 'Ba', petName: 'Đen' })
    expect(edited).toMatchObject({ name: 'Ba', petName: 'Đen', active: false })
    expect(c.profiles.active().name).toBe('Minh')
    expect(c.pet.get().name).toBe('Mít Ướt')

    expect(() => c.profiles.update({ id: 'không-có', name: 'X' })).toThrow()
  })

  it('kiểm tra đầu vào: xen kẽ từ vựng/ngữ pháp/đọc hiểu, chấm ở main, lưu trình độ từng kỹ năng', () => {
    const meaning: Record<string, string> = { go: 'đi', left: 'trái', leave: 'rời đi' }
    let question = c.placement.start()
    expect(question).not.toBeNull()
    expect(question?.total).toBe(20)

    const kinds = new Set<string>()
    const lemmas: string[] = []
    let result = null as PlacementResult | null
    let guard = 0
    while (question && guard++ < 30) {
      kinds.add(question.kind)
      let pick = 0
      if (question.kind === 'vocab') {
        lemmas.push(question.lemma)
        const target = meaning[question.lemma]
        pick = question.choices.findIndex((x) => x.split('; ').includes(target))
        expect(pick).toBeGreaterThanOrEqual(0)
      } else {
        // Ngữ pháp / đọc hiểu: có câu hỏi, đủ lựa chọn; đáp án đúng chỉ ở main nên chọn tạm đáp án đầu
        expect(question.prompt).toBeTruthy()
        expect(question.choices.length).toBeGreaterThanOrEqual(2)
        if (question.kind === 'reading') expect(question.passage).toBeTruthy()
        if (question.kind === 'listening') expect(question.say).toBeTruthy()
      }
      const res = c.placement.answer(question.sessionId, question.id, pick)
      if (question.kind === 'vocab') expect(res.correct).toBe(true)
      question = res.next
      result = res.result
    }
    // Gói mẫu chỉ có 3 từ vựng → không lặp từ; ngân hàng ngữ pháp/đọc hiểu bù cho các câu còn lại
    expect(new Set(lemmas).size).toBe(lemmas.length)
    expect(kinds).toEqual(new Set(['vocab', 'grammar', 'reading', 'listening']))
    expect(result).not.toBeNull()
    expect(result!.skills.map((s) => s.skill).sort()).toEqual([
      'grammar',
      'listening',
      'reading',
      'vocab'
    ])
    expect(result!.total).toBe(result!.skills.reduce((n, s) => n + s.total, 0))
    expect(c.settings.get('learning.level')).toBe(result!.level)
    for (const s of result!.skills) {
      const key = {
        vocab: 'learning.levelVocab',
        grammar: 'learning.levelGrammar',
        reading: 'learning.levelReading',
        listening: 'learning.levelListening'
      }[s.skill] as
        | 'learning.levelVocab'
        | 'learning.levelGrammar'
        | 'learning.levelReading'
        | 'learning.levelListening'
      expect(c.settings.get(key)).toBe(s.level)
    }
  })

  it('kiểm tra đầu vào: trả lời "không biết" tính là sai; không trả lời lại câu cũ', () => {
    const q = c.placement.start()!
    const res = c.placement.answer(q.sessionId, q.id, null)
    expect(res.correct).toBe(false)
    expect(() => c.placement.answer(q.sessionId, q.id, 0)).toThrow(/NOT_FOUND/)
  })
})

describe('PracticeService', () => {
  let clock: FakeClock
  const SENTENCES = new Map(PRACTICE_SENTENCES.map(([en, vi]) => [vi, en]))
  const WORD_VI = new Map(PRACTICE_WORDS.map(([lemma, vi]) => [lemma, vi]))
  WORD_VI.set('go', 'đi')
  WORD_VI.set('left', 'trái')
  WORD_VI.set('leave', 'rời đi')

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
    c.settings.set('learning.level', 'A1_1')
  })

  /** Trả lời đúng một bài (tra đáp án từ dữ liệu mẫu) */
  function solve(ex: Exercise): PracticeAnswer {
    switch (ex.kind) {
      case 'cloze': {
        const sentence = [...SENTENCES.values()].find((en) => {
          const rest = ex.prompt.split('____')
          return en.startsWith(rest[0]) && en.endsWith(rest[1] ?? '')
        })!
        const choice = ex.choices.findIndex((w) => ex.prompt.replace('____', w) === sentence)
        return { kind: 'cloze', choice }
      }
      case 'word_order': {
        const target = SENTENCES.get(ex.hintVi)!.split(' ')
        const used = new Set<number>()
        const order = target.map((tok) => {
          const i = ex.tokens.findIndex((t, k) => t === tok && !used.has(k))
          used.add(i)
          return i
        })
        return { kind: 'word_order', order }
      }
      case 'listen_choice': {
        const vi = [...SENTENCES.entries()].find(([, en]) => en === ex.audioText)![0]
        return { kind: 'listen_choice', choice: ex.choices.indexOf(vi) }
      }
      case 'dictation':
        return { kind: 'dictation', text: ex.audioText.toLowerCase() }
      case 'match_pairs':
        return {
          kind: 'match_pairs',
          mapping: ex.left.map((lemma) => ex.right.indexOf(WORD_VI.get(lemma)!))
        }
    }
  }

  it.each(['cloze', 'word_order', 'listen_choice', 'dictation', 'match_pairs'] as const)(
    'dạng %s: sinh được bài đúng dạng, trả lời đúng thì được chấm đúng',
    (kind) => {
      const ex = c.practice.start(kind)
      expect(ex?.kind).toBe(kind)
      expect(ex).toMatchObject({ index: 1, total: 10 })
      const res = c.practice.answer(ex!.sessionId, ex!.id, solve(ex!))
      expect(res.correct).toBe(true)
      expect(res.solution.length).toBeGreaterThan(0)
      expect(res.next?.index).toBe(2)
    }
  )

  it('trả lời sai bị chấm sai; không trả lời lại bài cũ hay sai dạng', () => {
    const ex = c.practice.start('cloze')!
    if (ex.kind !== 'cloze') throw new Error('expected cloze')
    const right = solve(ex)
    if (right.kind !== 'cloze') throw new Error('expected cloze answer')
    const wrong = (right.choice + 1) % ex.choices.length
    expect(() => c.practice.answer(ex.sessionId, ex.id, { kind: 'dictation', text: 'x' })).toThrow(
      /NOT_FOUND/
    )
    const res = c.practice.answer(ex.sessionId, ex.id, { kind: 'cloze', choice: wrong })
    expect(res.correct).toBe(false)
    expect(() => c.practice.answer(ex.sessionId, ex.id, { kind: 'cloze', choice: 0 })).toThrow(
      /NOT_FOUND/
    )
  })

  it('chép chính tả: sai một từ trong câu dài vẫn có tỉ lệ, dưới 90% là sai', () => {
    const ex = c.practice.start('dictation')!
    if (ex.kind !== 'dictation') throw new Error('expected dictation')
    const half = ex.audioText.split(' ').slice(0, 2).join(' ')
    const res = c.practice.answer(ex.sessionId, ex.id, { kind: 'dictation', text: half })
    expect(res.correct).toBe(false)
    expect(res.accuracy).toBeGreaterThan(0)
    expect(res.accuracy).toBeLessThan(0.9)
  })

  it('phiên trộn: làm đúng hết → tổng kết + thưởng XP/xu; quá 5 phiên/ngày không thưởng thêm', () => {
    function runSession(): { correct: number; total: number; xp: number; coins: number } {
      let ex: Exercise | null = c.practice.start('mixed')
      let summary = null as PracticeSummary | null
      let guard = 0
      while (ex && guard++ < 15) {
        const res = c.practice.answer(ex.sessionId, ex.id, solve(ex))
        expect(res.correct).toBe(true)
        ex = res.next
        summary = res.summary
      }
      return summary!
    }
    // Thưởng mở khoá thành tựu cộng thêm vào tổng XP: tách riêng để kiểm tra phần thưởng của phiên
    let achievementXp = 0
    c.bus.on('achievement.unlocked', (e) => (achievementXp += e.xp))
    const xpBefore = c.pet.get().totalXp
    const first = runSession()
    expect(first.correct).toBe(first.total)
    expect(first.total).toBeGreaterThanOrEqual(8)
    expect(first.xp).toBe(5 + first.correct)
    expect(first.coins).toBe(5)
    expect(c.pet.get().totalXp).toBe(xpBefore + first.xp + achievementXp)

    for (let i = 0; i < 4; i++) expect(runSession().xp).toBeGreaterThan(0)
    expect(runSession().xp).toBe(0) // phiên thứ 6 trong ngày
    clock.advance(24 * 3_600_000)
    expect(runSession().xp).toBeGreaterThan(0)
  })

  it('profile trẻ em không gặp câu chứa từ nhạy cảm', () => {
    const kid = c.profiles.create({ name: 'Bé', track: 'primary', isChild: true })
    c.profiles.switchTo(kid.id)
    for (let i = 0; i < 40; i++) {
      const ex = c.practice.start('dictation')!
      if (ex.kind === 'dictation') expect(ex.audioText).not.toMatch(/crap/i)
    }
    const lookup = c.dictionary.lookup('garden', undefined, { childSafe: true })
    expect(lookup.entries[0].examples.every((e) => !/crap/i.test(e.en))).toBe(true)
  })
})

describe('StatsService', () => {
  let clock: FakeClock

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
  })

  const DAY = 24 * 3_600_000

  it('người mới: toàn số 0, đủ 112 ngày, chưa có tỉ lệ nhớ', () => {
    const s = c.stats.stats()
    expect(s.days).toHaveLength(112)
    expect(s.days.at(-1)).toMatchObject({ reviews: 0, saved: 0, practice: 0 })
    expect(s.totals).toMatchObject({
      reviews: 0,
      savedWords: 0,
      retention: null,
      streak: 0,
      longestStreak: 0
    })
    expect(s.levels).toEqual([])
    expect(s.writing).toEqual({
      entries: 0,
      words: 0,
      withFeedback: 0,
      averageScore: null,
      recent: 0
    })
  })

  it('Viết: dòng kỹ năng không bao giờ gợi ý lên cấp; khối viết tự do đếm bài/từ/nhận xét/30 ngày', () => {
    c.settings.set('learning.level', 'A1_1')
    for (let i = 0; i < 30; i++) {
      c.progress.record({
        source: 'free-writing',
        kind: 'free',
        skill: 'writing',
        level: 'C2',
        correct: 1,
        total: 1
      })
    }
    const writing = c.stats.stats().skills.find((s) => s.skill === 'writing')!
    expect(writing.reliable).toBe(true)
    expect(writing.level).not.toBe('A1_1')
    expect(writing.ahead).toBe(0)

    const profileId = c.profiles.activeId()
    const base = {
      profileId,
      topicId: null,
      title: 't',
      task: 't',
      band: 'A1',
      length: 'short',
      minWords: 20,
      maxWords: 40,
      text: 'x'
    }
    const repo = new FreeWritingRepository(conn.db)
    repo.insert({ ...base, wordCount: 30 }, clock.now() - 40 * DAY)
    const scored = repo.insert({ ...base, wordCount: 50 }, clock.now() - DAY)
    const scored2 = repo.insert({ ...base, wordCount: 25 }, clock.now())
    repo.setFeedback(profileId, scored.id, '{}', 70, clock.now())
    repo.setFeedback(profileId, scored2.id, '{}', 81, clock.now())
    expect(c.stats.stats().writing).toEqual({
      entries: 3,
      words: 105,
      withFeedback: 2,
      averageScore: 76,
      recent: 2
    })
  })

  it('hồ sơ trẻ em: không có dòng Viết, độ chính xác Viết, khối viết tự do', () => {
    const kid = c.profiles.create({ name: 'Bé', track: 'primary', isChild: true })
    c.profiles.switchTo(kid.id)
    c.progress.record({
      source: 'lesson',
      kind: 'translate',
      skill: 'writing',
      level: 'A1_1',
      correct: 1,
      total: 1
    })
    const s = c.stats.stats()
    expect(s.skills.map((r) => r.skill)).toEqual(['vocab', 'grammar', 'reading', 'listening'])
    expect(s.accuracy.some((a) => a.skill === 'writing')).toBe(false)
    expect(s.writing).toBeNull()
  })

  it('đếm lượt ôn, từ mới, tỉ lệ nhớ, thẻ theo trạng thái và từ theo level', () => {
    for (const w of ['go', 'apple', 'leave']) c.vocab.save({ contentId: `word:en:${w}`, text: w })
    expect(c.stats.stats().cardStates).toEqual({ new: 3, learning: 0, review: 0, relearning: 0 })

    const [a, b, d] = c.study.words().map((w) => w.cardId)
    c.srs.review(a, 3, { source: 'study' })
    c.srs.review(b, 1, { source: 'study' })
    c.srs.review(d, 4, { source: 'study' })

    const s = c.stats.stats()
    expect(s.days.at(-1)).toMatchObject({ reviews: 3, saved: 3 })
    expect(s.days.at(-1)!.xp).toBeGreaterThan(0)
    expect(s.totals).toMatchObject({ reviews: 3, savedWords: 3, activeDays: 1, streak: 1 })
    expect(s.totals.retention).toBeCloseTo(2 / 3)
    // Từ chấm "Dễ" vào ôn dài hạn ngay nên sinh thêm thẻ phụ (đang ở trạng thái mới)
    expect(s.cardStates.new).toBe(c.study.words().reduce((n, w) => n + w.siblings, 0))
    expect(s.cardStates.learning + s.cardStates.review + s.cardStates.relearning).toBe(3)
    expect(s.levels).toEqual([{ level: 'A1_1', count: 3 }])
    expect(s.week.reviews).toBe(3)
    expect(s.week.prevReviews).toBe(0)
  })

  it('streak hiện tại và dài nhất qua nhiều ngày, so sánh tuần này với tuần trước', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const [card] = c.study.words().map((w) => w.cardId)
    // 3 ngày liên tiếp, nghỉ 2 ngày, rồi 1 ngày (hôm nay)
    for (let i = 0; i < 3; i++) {
      c.srs.review(card, 3, { source: 'study' })
      clock.advance(DAY)
    }
    clock.advance(2 * DAY)
    c.srs.review(card, 3, { source: 'study' })

    const s = c.stats.stats()
    expect(s.totals.longestStreak).toBe(3)
    expect(s.totals.streak).toBe(1)
    expect(s.totals.activeDays).toBe(4)
    expect(s.days.filter((d) => d.reviews > 0)).toHaveLength(4)
    expect(s.week.reviews + s.week.prevReviews).toBe(4)
  })

  it('từ hay quên nhất xếp theo số lần quên; thành tựu mở khoá theo số liệu', () => {
    expect(c.stats.stats().hardest).toEqual([])
    for (const w of ['go', 'apple']) c.vocab.save({ contentId: `word:en:${w}`, text: w })
    const [go, apple] = c.study.words().map((w) => w.cardId)
    // Ôn tới trạng thái Review rồi quên: 'go' hai lần, 'apple' một lần
    for (const [card, lapses] of [
      [go, 2],
      [apple, 1]
    ] as const) {
      for (let i = 0; i < lapses; i++) {
        c.srs.review(card, 4, { source: 'study' })
        clock.advance(40 * DAY)
        c.srs.review(card, 4, { source: 'study' })
        clock.advance(40 * DAY)
        c.srs.review(card, 1, { source: 'study' })
        clock.advance(DAY)
      }
    }
    const s = c.stats.stats()
    expect(s.hardest.map((w) => w.text)).toEqual(['go', 'apple'])
    expect(s.hardest[0].lapses).toBeGreaterThan(s.hardest[1].lapses)
    expect(s.achievements.find((a) => a.id === 'reviews100')).toMatchObject({ unlocked: false })
    expect(s.achievements.find((a) => a.id === 'words10')).toMatchObject({ current: 2 })
  })

  it('mở khoá thành tựu: thưởng XP đúng một lần và báo cho mascot', () => {
    const events: Array<{ ids: string[]; xp: number }> = []
    c.bus.on('achievement.unlocked', (e) => events.push(e))
    // 'go' ôn ngày đầu → chưa đủ ngưỡng nào ngoài các thành tựu nhỏ có sẵn
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const [card] = c.study.words().map((w) => w.cardId)
    for (let i = 0; i < 3; i++) {
      c.srs.review(card, 3, { source: 'study' })
      clock.advance(DAY)
    }
    // Ôn 3 ngày liên tiếp → mở khoá "chuỗi 3 ngày"
    expect(events.flatMap((e) => e.ids)).toContain('streak3')
    const xpAfter = c.pet.get().totalXp
    expect(c.achievements.evaluate()).toEqual([]) // không thưởng lại
    expect(c.pet.get().totalXp).toBe(xpAfter)
    const streak = events.flatMap((e) => e.ids).filter((id) => id === 'streak3')
    expect(streak).toHaveLength(1)
  })

  it('bài đọc, ngữ pháp và mẫu câu nạp được từ nội dung đóng gói và dùng chung tiến độ', () => {
    const reading = c.readings.catalog()
    expect(reading.totalCount).toBeGreaterThanOrEqual(12)
    const first = reading.units[0].lessons[0]
    expect(first.progress.done).toBe(false)
    const lesson = c.readings.get(first.id)
    expect(lesson.blocks.some((b) => b.type === 'passage')).toBe(true)
    const done = c.readings.complete(first.id, lesson.exercises.length, lesson.exercises.length)
    expect(done).toMatchObject({ firstCompletion: true, xp: 20 })
    expect(c.readings.catalog().doneCount).toBe(1)
    expect(c.lessons.catalog().doneCount).toBe(0) // tiến độ bài học nền tảng không bị lẫn

    const grammar = c.grammar.catalog()
    expect(grammar.totalCount).toBeGreaterThanOrEqual(14)
    expect(c.grammar.get(grammar.units[0].lessons[0].id).exercises.length).toBeGreaterThanOrEqual(4)

    const book = c.phrasebook.list()
    expect(book.categories.length).toBeGreaterThanOrEqual(10)
    expect(book.categories.every((cat) => cat.phrases.length >= 5)).toBe(true)
  })
})

describe('thẻ ôn tập nhiều hướng', () => {
  let clock: FakeClock
  const DAY = 24 * 3_600_000

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
  })

  const saveAndGraduate = (word: string, context: string | null = null): void => {
    c.vocab.save({ contentId: `word:en:${word}`, text: word, context })
    const card = c.study.next().card!
    c.study.rate(card.cardId, 4, 1000) // "Dễ" → vào ôn dài hạn ngay
  }

  it('từ vào ôn dài hạn thì sinh thẻ Việt→Anh, nghe-gõ, điền từ (đến hạn từ ngày mai)', () => {
    saveAndGraduate('go', 'I go to school.')
    const word = c.study.words()[0]
    expect(word.siblings).toBe(3)
    expect(c.study.next().card).toBeNull() // thẻ phụ chưa đến hạn

    clock.advance(DAY + 1000)
    const directions = new Set<string>()
    for (let i = 0; i < 3; i++) {
      const card = c.study.next().card!
      directions.add(card.direction)
      c.study.rate(card.cardId, 3, 1000)
    }
    expect(directions).toEqual(new Set(['vi_en', 'audio_en', 'cloze']))
  })

  it('thẻ điền từ dùng câu ngữ cảnh của người dùng; vi_en/audio_en chấp nhận đúng từ gốc', () => {
    saveAndGraduate('go', 'I go to school.')
    clock.advance(DAY + 1000)
    const cards = [1, 2, 3].map(() => {
      const card = c.study.next().card!
      c.study.rate(card.cardId, 3, 1000)
      return card
    })
    const cloze = cards.find((x) => x.direction === 'cloze')!
    expect(cloze.cloze).toEqual({ before: 'I ', after: ' to school.', answer: 'go' })
    expect(cloze.answers).toContain('go')
    expect(cards.find((x) => x.direction === 'vi_en')!.answers).toEqual(['go'])
  })

  it('tắt hướng thẻ trong cài đặt thì không tạo; backfill tạo bù cho từ đã thuộc', () => {
    c.settings.set('review.dirViEn', false)
    c.settings.set('review.dirCloze', false)
    saveAndGraduate('go')
    expect(c.study.words()[0].siblings).toBe(1) // chỉ còn nghe-gõ
    c.settings.set('review.dirViEn', true)
    expect(c.study.backfill()).toBe(1)
    expect(c.study.words()[0].siblings).toBe(2)
    expect(c.study.backfill()).toBe(0) // không tạo trùng
  })

  it('hạn mức từ mới mỗi ngày: đủ hạn mức thì thẻ mới chờ sang ngày sau', () => {
    const words = ['go', 'apple', 'left', 'leave', 'ponder', 'went']
    for (const w of words) c.vocab.save({ contentId: `word:en:${w}`, text: w })
    expect(c.study.overview().dueCount).toBe(6) // 0 = không giới hạn

    c.settings.set('review.newPerDay', 5)
    expect(c.study.overview().dueCount).toBe(5)
    for (let i = 0; i < 5; i++) c.study.rate(c.study.next().card!.cardId, 3, 1000)
    expect(c.study.overview().dueCount).toBe(0) // đủ 5 từ mới; thẻ vừa ôn chưa đến hạn lại

    clock.advance(DAY)
    expect(c.study.overview().dueCount).toBe(6) // 5 thẻ học dở + 1 từ mới của ngày mới
  })

  it('hạn mức từ mới 5/ngày không chặn khi chưa đủ; hết hạn mức thì chặn đến sáng hôm sau', () => {
    const words = ['go', 'apple', 'left', 'leave', 'ponder', 'went']
    for (const w of words) c.vocab.save({ contentId: `word:en:${w}`, text: w })
    c.settings.set('review.newPerDay', 5)
    for (let i = 0; i < 5; i++) {
      const card = c.study.next().card!
      expect(card.isNew).toBe(true)
      c.study.rate(card.cardId, 1, 1000) // "Quên" → thẻ ở lại giai đoạn học
    }
    // Từ mới thứ 6 bị chặn; chỉ còn thẻ đã học dở khi đến hạn
    clock.advance(30 * 60_000)
    const due = c.study.next().card
    expect(due === null || due.isNew === false).toBe(true)
    clock.advance(DAY)
    expect(c.study.next().card).not.toBeNull()
  })

  it('thứ tự ôn: thẻ mới trước / thẻ cũ trước', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const old = c.study.next().card!
    c.study.rate(old.cardId, 1, 1000)
    clock.advance(10 * 60_000)
    c.vocab.save({ contentId: 'word:en:apple', text: 'apple' })
    c.settings.set('review.order', 'new-first')
    expect(c.study.next().card?.isNew).toBe(true)
    c.settings.set('review.order', 'review-first')
    expect(c.study.next().card?.isNew).toBe(false)
  })

  it('ôn ngẫu nhiên: xáo thứ tự thẻ đến hạn, không phụ thuộc hạn sớm nhất', () => {
    for (const w of ['go', 'apple', 'book', 'tree', 'milk']) {
      c.vocab.save({ contentId: `word:en:${w}`, text: w })
    }
    c.settings.set('review.order', 'mixed')
    const sequential = c.srs.dueCards(5).map((r) => r.contentId)
    c.settings.set('review.order', 'random')
    const seen = new Set<string>()
    for (let i = 0; i < 40; i++) seen.add(c.srs.dueCards(1)[0].contentId)
    // 40 lần bốc ngẫu nhiên 1 thẻ trong 5 thẻ: gần như chắc chắn gặp ≥ 3 từ khác nhau
    expect(seen.size).toBeGreaterThanOrEqual(3)
    expect([...seen].every((id) => sequential.includes(id))).toBe(true)
    expect(c.srs.dueCards(5)).toHaveLength(5)
  })

  it('ẩn từ vừa ôn N phút (kể cả chấm Quên); hết hạn ẩn thì hiện lại; 0 = tắt', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    c.vocab.save({ contentId: 'word:en:apple', text: 'apple' })
    c.settings.set('review.hideMinutes', 30)
    const first = c.study.next().card!
    c.study.rate(first.cardId, 1, 1000) // Quên: bình thường quay lại sau ~1 phút
    clock.advance(2 * 60_000)
    expect(c.srs.dueCount()).toBe(1) // chỉ còn từ chưa ôn
    for (let i = 0; i < 10; i++) expect(c.study.next().card?.cardId).not.toBe(first.cardId)

    clock.advance(31 * 60_000) // hết thời gian ẩn
    expect(c.srs.dueCount()).toBe(2)
    c.settings.set('review.hideMinutes', 0)
    c.study.rate(c.study.next().card!.cardId, 1, 1000)
    clock.advance(2 * 60_000)
    expect(c.srs.dueCount()).toBe(2) // tắt ẩn: thẻ vừa chấm Quên quay lại ngay
  })

  it('thẻ nhận diện có trắc nghiệm nghĩa (4 lựa chọn, đáp án trỏ đúng nghĩa); tắt trong cài đặt thì không', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const card = c.study.next().card!
    expect(card.direction).toBe('en_vi')
    if (card.choices) {
      expect(card.choices).toHaveLength(4)
      expect(new Set(card.choices).size).toBe(4)
      const right = card.choices[card.choiceAnswer!]
      expect(right.split('; ')).toContain(card.vi[0])
    } else {
      // Gói thử nghiệm quá ít từ để dựng đủ 3 nghĩa nhiễu → không có trắc nghiệm (giao diện rơi về lật thẻ)
      expect(card.choiceAnswer).toBeNull()
    }
    c.settings.set('review.choices', false)
    const plain = c.study.next().card!
    expect(plain.choices).toBeNull()
    expect(plain.choiceAnswer).toBeNull()
  })

  it('hoàn tác lần chấm gần nhất: trả lại lịch cũ, xoá lượt ôn, hiện lại thẻ', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const card = c.study.next().card!
    const before = c.study.overview()
    c.study.rate(card.cardId, 4, 1000)
    expect(c.study.overview().reviewedToday).toBe(1)
    const undone = c.study.undo()
    expect(undone.card?.cardId).toBe(card.cardId)
    expect(undone.card?.isNew).toBe(true)
    expect(c.study.overview().reviewedToday).toBe(before.reviewedToday)
    expect(c.study.undo().card).toBeNull() // chỉ hoàn tác được một lần
  })

  it('tạm dừng, đặt lại và xoá từ trong sổ', () => {
    saveAndGraduate('go', 'I go to school.')
    const word = c.study.words()[0]
    expect(c.study.setSuspended(word.contentId, true)).toBe(true)
    clock.advance(DAY * 3)
    expect(c.study.overview().dueCount).toBe(0) // tạm dừng cả thẻ phụ
    expect(c.study.words()[0].suspended).toBe(true)
    c.study.setSuspended(word.contentId, false)
    expect(c.study.overview().dueCount).toBeGreaterThan(0)

    expect(c.study.resetWord(word.contentId)).toBe(true)
    const reset = c.study.words()[0]
    expect(reset).toMatchObject({ state: 0, reps: 0, siblings: 0 })
    // Ôn tới ôn dài hạn lần nữa → thẻ phụ được khôi phục
    const card = c.study.next().card!
    c.study.rate(card.cardId, 4, 1000)
    expect(c.study.words()[0].siblings).toBe(3)
  })

  it('lưu mẫu câu vào sổ thẻ: ôn như thẻ thường, thẻ phụ không có điền từ', () => {
    const phrase = c.phrasebook.list().categories[0].phrases[0]
    expect(c.study.savePhrase(phrase.id)).toMatchObject({ isNew: true, cardCreated: true })
    expect(c.study.savePhrase(phrase.id).isNew).toBe(false)
    const word = c.study.words()[0]
    expect(word).toMatchObject({ isPhrase: true, lemma: phrase.en, vi: phrase.vi })
    const card = c.study.next().card!
    expect(card).toMatchObject({ isPhrase: true, direction: 'en_vi', lemma: phrase.en })
    c.study.rate(card.cardId, 4, 1000)
    expect(c.study.words()[0].siblings).toBe(2) // vi_en + audio_en
    expect(() => c.study.savePhrase('phrase:nope:00000000')).toThrow(/NOT_FOUND/)
  })

  it('lưu nhiều từ một lúc: đếm từ mới, đã có, không tìm thấy', () => {
    c.vocab.save({ contentId: 'word:en:apple', text: 'apple' })
    const res = c.study.saveMany([
      { text: 'apple', context: 'An apple a day.' },
      { text: 'go', context: 'Let us go.' },
      { text: 'zzzzqx' }
    ])
    expect(res).toEqual({ saved: 1, already: 1, missing: 1 })
    expect(
      c.study
        .words()
        .map((w) => w.lemma)
        .sort()
    ).toEqual(['apple', 'go'])
  })

  it('mascot chỉ hỏi thẻ nhận diện (en_vi), không hỏi thẻ phụ', () => {
    saveAndGraduate('go', 'I go to school.')
    clock.advance(DAY + 1000)
    const quiz = c.micro.next()
    // Thẻ en_vi của "go" chưa đến hạn lại ngay; câu hỏi (nếu có) không phải ôn thẻ phụ
    expect(quiz === null || quiz.kind === 'new').toBe(true)
  })
})

describe('chế độ trẻ em', () => {
  let clock: FakeClock
  const DAY = 24 * 3_600_000

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    // Tắt bản đồ thế giới để thẻ ôn tự giới thiệu hình mới như trước (bản đồ có test riêng: KidsWorldService.test.ts)
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs'), kidsWorld: false })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
  })

  it('thẻ nghe → chạm hình: giới thiệu hình mới dần, ghi sticker khi trả lời đúng', () => {
    const first = c.kids.nextCard().card!
    expect(first).toMatchObject({ pictureId: 'dog', isNew: true })
    expect(first.choices).toHaveLength(3)
    expect(first.choices).toContain('dog')
    expect(c.kids.stickers().earned).toBe(0)

    expect(c.kids.rateCard(first.cardId, 1, 1000)).toEqual({ stickerNew: true })
    expect(c.kids.stickers()).toMatchObject({ earned: 1 })
    expect(c.kids.stickers().stickers.find((s) => s.pictureId === 'dog')?.earned).toBe(true)

    // Hết thẻ đến hạn → hình mới kế tiếp (đến hạn mức mỗi ngày)
    const second = c.kids.nextCard().card!
    expect(second.pictureId).toBe('cat')
    c.kids.rateCard(second.cardId, 0, 1000) // không ra → không có sticker
    expect(c.kids.stickers().earned).toBe(1)
  })

  it('mỗi ngày chỉ giới thiệu tối đa 6 hình mới; sang ngày mới được thêm', () => {
    const ids: string[] = []
    for (let i = 0; i < 10; i++) {
      const next = c.kids.nextCard().card
      if (!next) break
      ids.push(next.pictureId)
      c.kids.rateCard(next.cardId, 1, 1000)
    }
    expect(new Set(ids).size).toBe(6)
    expect(c.kids.nextCard().card?.isNew).not.toBe(true) // chỉ còn thẻ ôn nếu đến hạn
    clock.advance(DAY)
    expect(c.kids.nextCard().card).not.toBeNull()
  })

  it('thẻ hình không lẫn vào phiên ôn của người lớn và ngược lại', () => {
    const kid = c.kids.nextCard().card!
    expect(c.study.next().card).toBeNull() // người lớn không thấy thẻ hình
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    const adult = c.study.next().card!
    expect(adult.direction).toBe('en_vi')
    expect(c.kids.nextCard().card?.cardId).toBe(kid.cardId) // thẻ trẻ vẫn là thẻ hình
  })

  it('hoạt động: tính sao, lưu tiến độ, thưởng một lần đầu', () => {
    const activity = c.kids.units().units[0].activities[0]
    expect(activity.stars).toBe(0)
    const before = c.inventory.list().reduce((n, i) => n + i.quantity, 0)
    const first = c.kids.completeActivity(activity.id, 6, 6)
    expect(first).toMatchObject({ stars: 3, firstTime: true })
    expect(first.foodId).toMatch(/^food:/)
    expect(c.inventory.list().reduce((n, i) => n + i.quantity, 0)).toBe(before + 1)
    const again = c.kids.completeActivity(activity.id, 3, 6)
    expect(again).toMatchObject({ firstTime: false, foodId: null })
    expect(c.kids.units().units[0].activities[0].stars).toBe(3) // làm lại điểm thấp hơn vẫn giữ điểm cao nhất
    expect(() => c.kids.completeActivity('khong-co', 1, 1)).toThrow(/VALIDATION/)
  })

  it('quà đồ ăn có hạn mức mỗi ngày', () => {
    let given = 0
    for (let i = 0; i < 20; i++) if (c.kids.reward()) given++
    expect(given).toBe(8)
    clock.advance(DAY)
    expect(c.kids.reward()).not.toBeNull()
  })

  it('giới hạn thời gian: đếm giây, khoá khi hết giờ, phụ huynh nhập PIN để gia hạn', () => {
    c.settings.set('kids.dailyMinutes', 10)
    expect(c.kids.usageStatus()).toEqual({ usedSeconds: 0, limitSeconds: 600, locked: false })
    for (let i = 0; i < 9; i++) c.kids.tick(60)
    expect(c.kids.usageStatus().locked).toBe(false)
    expect(c.kids.tick(60)).toMatchObject({ usedSeconds: 600, locked: true })
    // gửi số giây phóng đại bị chặn
    expect(c.kids.tick(100_000).usedSeconds).toBe(660)

    c.parent.setPin('1234')
    expect(() => c.parent.extend('0000', 10)).toThrow(/FORBIDDEN/)
    c.parent.extend('1234', 10)
    expect(c.kids.usageStatus()).toMatchObject({ limitSeconds: 1200, locked: false })

    clock.advance(DAY)
    expect(c.kids.usageStatus()).toMatchObject({ usedSeconds: 0, locked: false })
    c.settings.set('kids.dailyMinutes', 0)
    for (let i = 0; i < 30; i++) c.kids.tick(60)
    expect(c.kids.usageStatus().locked).toBe(false) // 0 = không giới hạn
  })

  it('PIN phụ huynh: đặt, đổi cần PIN cũ, khoá tạm khi nhập sai nhiều lần', () => {
    expect(c.parent.pinSet()).toBe(false)
    expect(c.parent.verify('1234').ok).toBe(false) // chưa đặt PIN → không vào được
    c.parent.setPin('1234')
    expect(c.parent.pinSet()).toBe(true)
    expect(c.parent.verify('1234')).toEqual({ ok: true, retryAfterSeconds: 0 })
    expect(() => c.parent.setPin('5678')).toThrow(/FORBIDDEN/)
    expect(() => c.parent.setPin('5678', '9999')).toThrow(/FORBIDDEN/)
    c.parent.setPin('5678', '1234')
    expect(c.parent.verify('1234').ok).toBe(false)
    expect(c.parent.verify('5678').ok).toBe(true)

    for (let i = 0; i < 4; i++)
      expect(c.parent.verify('0000')).toEqual({ ok: false, retryAfterSeconds: 0 })
    const locked = c.parent.verify('0000')
    expect(locked.ok).toBe(false)
    expect(locked.retryAfterSeconds).toBeGreaterThan(0)
    expect(c.parent.verify('5678').ok).toBe(false) // đang khoá, kể cả PIN đúng
    clock.advance(61_000)
    expect(c.parent.verify('5678').ok).toBe(true)
  })

  it('quên PIN: giải phép nhân để xoá PIN cũ rồi đặt PIN mới; sai thì không xoá và mỗi câu chỉ trả lời một lần', () => {
    c.parent.setPin('1234')
    const first = c.parent.forgotChallenge()
    expect(first.a).toBeGreaterThanOrEqual(13)
    expect(c.parent.resetPin(first.id, first.a * first.b + 1)).toEqual({
      ok: false,
      retryAfterSeconds: 0
    })
    expect(c.parent.pinSet()).toBe(true)
    // Câu cũ đã hết hiệu lực dù trả lời đúng
    expect(c.parent.resetPin(first.id, first.a * first.b).ok).toBe(false)

    const second = c.parent.forgotChallenge()
    expect(c.parent.resetPin(second.id, second.a * second.b).ok).toBe(true)
    expect(c.parent.pinSet()).toBe(false)
    c.parent.setPin('5678') // chưa có PIN → đặt không cần PIN cũ
    expect(c.parent.verify('5678').ok).toBe(true)
  })

  it('quên PIN: trả lời sai nhiều lần thì khoá tạm', () => {
    c.parent.setPin('1234')
    let last = { ok: true, retryAfterSeconds: 0 }
    for (let i = 0; i < 5; i++) {
      const q = c.parent.forgotChallenge()
      last = c.parent.resetPin(q.id, 0)
    }
    expect(last.ok).toBe(false)
    expect(last.retryAfterSeconds).toBeGreaterThan(0)
    const q = c.parent.forgotChallenge()
    expect(c.parent.resetPin(q.id, q.a * q.b).ok).toBe(false) // đang khoá
  })

  it('có đủ các loại hoạt động: chữ cái, âm, ghép âm, từ nhìn là nhớ, sách tranh, tập viết, nói theo', () => {
    const kinds = new Set(c.kids.units().units.flatMap((u) => u.activities.map((x) => x.kind)))
    expect(kinds).toEqual(
      new Set(['letters', 'sounds', 'blend', 'sight', 'book', 'trace', 'speak'])
    )
    expect(c.kids.activityProgress().total).toBeGreaterThanOrEqual(25)
    const book = c.kids
      .units()
      .units.flatMap((u) => u.activities)
      .find((x) => x.kind === 'book')!
    expect(c.kids.completeActivity(book.id, book.items.length, book.items.length)).toMatchObject({
      stars: 3,
      firstTime: true
    })
  })

  it('PIN không nằm trong cài đặt gửi xuống giao diện', () => {
    c.parent.setPin('1234')
    expect(JSON.stringify(c.settings.all())).not.toMatch(/salt|hash|parent\.pin/)
  })

  it('báo cáo cho phụ huynh: 7 ngày, thời gian dùng, thẻ đã ôn, sticker, từ hay quên', () => {
    const card = c.kids.nextCard().card!
    c.kids.rateCard(card.cardId, 1, 1000)
    const second = c.kids.nextCard().card!
    c.kids.rateCard(second.cardId, 0, 1000) // quên 1 lần
    c.kids.tick(60)
    c.kids.tick(30)
    const report = c.parent.report()
    expect(report.days).toHaveLength(7)
    expect(report.days.at(-1)).toMatchObject({ seconds: 90, reviews: 2 })
    expect(report.stickersEarned).toBe(1)
    expect(report.activitiesTotal).toBeGreaterThanOrEqual(10)
    expect(report.hardest).toEqual([{ word: 'cat', vi: 'con mèo', lapses: 1 }])
    expect(report.dailyLimitMinutes).toBe(15)
    expect(report.weekWord.word).toBe('cat') // từ bé hay quên nhất
  })

  it('trang chủ của bé tổng hợp số liệu', () => {
    const home = c.kids.home()
    expect(home).toMatchObject({ petName: 'Bi', stickersEarned: 0, pinSet: false })
    expect(home.stickersTotal).toBeGreaterThanOrEqual(60)
    expect(home.usage.locked).toBe(false)
  })
})

describe('tiến bộ theo kỹ năng', () => {
  let clock: FakeClock
  const DAY = 24 * 3_600_000

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
  })

  it('bài học ghi kết quả theo dạng bài và kỹ năng, cập nhật Elo', () => {
    const lesson = c.readings.catalog().units[0].lessons[0]
    const full = c.readings.get(lesson.id)
    const n = full.exercises.length
    const before = c.progress.ratings().find((r) => r.skill === 'reading')!
    c.readings.complete(lesson.id, n, n, [
      { type: 'tf', correct: 3, total: 3 },
      { type: 'mcq', correct: n - 3, total: n - 3 }
    ])
    const stats = c.stats.stats()
    const tf = stats.accuracy.find((a) => a.kind === 'tf')!
    expect(tf).toMatchObject({ group: 'exercise', skill: 'reading', correct: 3, total: 3 })
    const after = stats.skills.find((s) => s.skill === 'reading')!
    expect(after.games).toBe(n)
    expect(after.rating).toBeGreaterThan(before.rating)
  })

  it('byType không hợp lệ bị bỏ qua, không làm hỏng việc chấm bài', () => {
    const lesson = c.lessons.catalog().units[0].lessons[0]
    const res = c.lessons.complete(lesson.id, 6, 8, [{ type: 'mcq', correct: 9, total: 3 }])
    expect(res.score).toBe(75)
    expect(c.stats.stats().accuracy.filter((a) => a.group === 'exercise')).toEqual([])
  })

  it('luyện tập ghi từng câu; thẻ ôn có độ chính xác theo hướng thẻ', () => {
    c.settings.set('learning.level', 'A1_1')
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    c.study.rate(c.study.next().card!.cardId, 4, 1000)
    const review = c.stats.stats().accuracy.find((a) => a.group === 'review')!
    expect(review).toMatchObject({ kind: 'en_vi', skill: 'vocab', correct: 1, total: 1 })
  })

  it('thời gian dùng app: cộng dồn theo ngày, chặn số giây phóng đại', () => {
    c.progress.tickTime(60)
    c.progress.tickTime(30)
    c.progress.tickTime(100_000) // bị chặn ở 60 giây
    const t = c.stats.stats().time
    expect(t.todayMinutes).toBe(3) // 60 + 30 + 60 (bị chặn) = 150 giây ≈ 3 phút
    expect(t.totalMinutes).toBeGreaterThanOrEqual(2)
    clock.advance(DAY)
    expect(c.stats.stats().time.todayMinutes).toBe(0)
    expect(c.stats.stats().time.weekMinutes).toBe(3)
  })

  it('Viết: rating khởi đầu lấy từ trình độ chung; dịch câu/viết theo đề cập nhật Viết, không đổi ngữ pháp', () => {
    c.settings.set('learning.level', 'B1_1')
    c.settings.set('learning.levelGrammar', 'A2_1')
    const writing = c.progress.ratings().find((r) => r.skill === 'writing')!
    expect(writing).toMatchObject({ rating: 650, level: 'B1_1', games: 0, reliable: false })
    const grammarBefore = c.progress.ratings().find((r) => r.skill === 'grammar')!
    const lesson = c.lessons.catalog().units[0].lessons[0]
    c.lessons.complete(lesson.id, 3, 4, [
      { type: 'translate', correct: 2, total: 3 },
      { type: 'write', correct: 1, total: 1 }
    ])
    const after = c.progress.ratings()
    expect(after.find((r) => r.skill === 'writing')!.games).toBe(4)
    expect(after.find((r) => r.skill === 'grammar')).toEqual(grammarBefore)
    const acc = c.stats.stats().accuracy.find((a) => a.kind === 'translate')!
    expect(acc).toMatchObject({ group: 'exercise', skill: 'writing', correct: 2, total: 3 })
  })

  it('bài kiểm tra đầu vào đặt rating khởi đầu của từng kỹ năng', () => {
    c.settings.set('learning.levelGrammar', 'B1_1')
    expect(c.progress.ratings().find((r) => r.skill === 'grammar')!.level).toBe('B1_1')
    c.progress.setLevel('grammar', 'A2_1')
    expect(c.progress.ratings().find((r) => r.skill === 'grammar')!.level).toBe('A2_1')
  })
})

describe('kiểm tra lên cấp', () => {
  let clock: FakeClock

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
    c.settings.set('learning.level', 'A2_1')
  })

  /** Làm hết bài, trả lời đúng/sai theo `right`; trả về kết quả cuối */
  function run(right: boolean): PlacementResult {
    const meaning: Record<string, string> = { go: 'đi', left: 'trái', leave: 'rời đi' }
    let q = c.placement.startCheckpoint()
    expect(q).not.toBeNull()
    expect(q!.total).toBe(10)
    let result = null as PlacementResult | null
    let guard = 0
    while (q && guard++ < 20) {
      // Chỉ biết đáp án từ vựng của gói mẫu; ngân hàng ngữ pháp/đọc/nghe thì chọn theo ý (đúng = chọn đáp án đầu → không chắc đúng)
      let pick = 0
      if (q.kind === 'vocab') pick = right ? q.choices.indexOf(meaning[q.lemma]) : -1
      const res = c.placement.answer(q.sessionId, q.id, pick < 0 ? null : pick)
      q = res.next
      result = res.result
    }
    return result!
  }

  it('trượt thì giữ nguyên level, không thưởng', () => {
    const result = run(false)
    expect(result.checkpoint).toMatchObject({ passed: false, to: null, xp: 0 })
    expect(c.settings.get('learning.level')).toBe('A2_1')
  })

  /** Đáp án đúng của ngân hàng ngữ pháp/đọc/nghe, tra theo câu hỏi (để test chủ động trả lời đúng) */
  function bankAnswers(): Map<string, string> {
    const map = new Map<string, string>()
    const dir = resolve('content/curated/placement')
    for (const file of readdirSync(dir)) {
      const data = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
        items: Array<{ prompt: string; choices: string[]; answer: number }>
      }
      for (const item of data.items) map.set(item.prompt, item.choices[item.answer])
    }
    return map
  }

  it('đạt ≥ 80% thì lên một bậc, cập nhật kỹ năng, thưởng một lần cho mỗi bậc', () => {
    const meaning: Record<string, string> = { go: 'đi', left: 'trái', leave: 'rời đi' }
    const answers = bankAnswers()
    const play = (): PlacementResult => {
      let q = c.placement.startCheckpoint()!
      let result = null as PlacementResult | null
      for (let guard = 0; q && guard < 20; guard++) {
        const text = q.kind === 'vocab' ? meaning[q.lemma] : answers.get(q.prompt ?? '')
        const res = c.placement.answer(q.sessionId, q.id, q.choices.indexOf(text!))
        expect(res.correct).toBe(true)
        result = res.result
        q = res.next!
      }
      return result!
    }
    const xp0 = c.pet.get().totalXp
    const first = play()
    expect(first.checkpoint).toMatchObject({
      passed: true,
      from: 'A2_1',
      to: 'A2_2',
      xp: 60,
      coins: 30
    })
    expect(c.settings.get('learning.level')).toBe('A2_2')
    expect(c.pet.get().totalXp).toBeGreaterThanOrEqual(xp0 + 60)
    expect(c.progress.ratings().every((r) => r.rating >= 0)).toBe(true)

    // Quay lại bậc cũ rồi thi lại: vẫn lên được nhưng không thưởng lần nữa
    c.settings.set('learning.level', 'A2_1')
    const again = play()
    expect(again.checkpoint).toMatchObject({ passed: true, xp: 0, coins: 0 })
  })

  it('bậc cao nhất thì không có bài kiểm tra lên cấp', () => {
    c.settings.set('learning.level', 'C2')
    expect(c.placement.startCheckpoint()).toBeNull()
  })

  it('câu hỏi cùng bậc kế tiếp, không thích nghi: người học giữ nguyên bậc đang thi', () => {
    const first = c.placement.startCheckpoint()!
    expect(first.id).toContain('checkpoint')
    // Trả lời sai/đúng không đổi bậc → câu sau vẫn là câu hỏi hợp lệ
    const res = c.placement.answer(first.sessionId, first.id, null)
    expect(res.next === null || res.next.total === 10).toBe(true)
  })
})

describe('lộ trình học', () => {
  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    c = createContainer(conn, new FakeClock(), { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
  })

  it('liệt kê khoá, bước kế tiếp là bài đầu tiên chưa làm', () => {
    const list = c.courses.list()
    expect(list.length).toBeGreaterThanOrEqual(2)
    const course = list[0]
    expect(course).toMatchObject({ stepsDone: 0 })
    expect(course.stepsTotal).toBeGreaterThan(10)
    const detail = c.courses.get(course.id)
    expect(detail.units.length).toBeGreaterThanOrEqual(3)
    expect(detail.next?.id).toBe(detail.units[0].steps[0].id)
  })

  it('làm bài ở bất kỳ nơi nào đều được tính vào khoá; xong thì bước kế tiếp chuyển sang bài sau', () => {
    const detail = c.courses.get(c.courses.list()[0].id)
    const first = detail.units[0].steps[0]
    const lesson = c.lessons.get(first.id)
    c.lessons.complete(first.id, lesson.exercises.length, lesson.exercises.length)
    const after = c.courses.get(detail.id)
    expect(after.stepsDone).toBe(1)
    expect(after.units[0].steps[0]).toMatchObject({ done: true, best: 100 })
    expect(after.next?.id).toBe(detail.units[0].steps[1].id)
  })

  it('khoá không tồn tại → NOT_FOUND', () => {
    expect(() => c.courses.get('khong-co')).toThrow(/NOT_FOUND/)
  })
})

describe('lộ trình hằng ngày', () => {
  let clock: FakeClock

  beforeEach(async () => {
    conn.close()
    conn = openUserDb(':memory:', MIGRATIONS)
    clock = new FakeClock()
    c = createContainer(conn, clock, { packsDir: join(tmp, 'packs') })
    legacyReview(c)
    await c.packs.install(buildFixturePack(tmp))
  })

  const finish = (kind: 'lesson' | 'grammar' | 'reading' | 'listening', id: string): void => {
    const svc = {
      lesson: c.lessons,
      grammar: c.grammar,
      reading: c.readings,
      listening: c.listening
    }[kind]
    const n = svc.get(id).exercises.length
    svc.complete(id, n, n)
  }

  it('chưa có thẻ, chưa học: bài kế tiếp của khoá đầu hợp trình độ, không có mục ôn thẻ', () => {
    const plan = c.dailyPlan.plan()
    expect(plan.items.some((i) => i.kind === 'review')).toBe(false)
    const lesson = plan.items.find((i) => i.kind === 'lesson')!
    const course = c.courses.list()[0]
    expect(lesson).toMatchObject({
      lessonId: course.next!.id,
      lessonKind: course.next!.kind,
      subtitle: course.title,
      done: false
    })
    expect(plan.targetMinutes).toBe(20)
    expect(plan.doneCount).toBe(0)
    expect(plan.totalMinutes).toBe(plan.items.reduce((n, i) => n + i.minutes, 0))
  })

  it('6 thẻ đến hạn → mục ôn thẻ đứng đầu, count 6, 2 phút; ôn hết → vẫn hiện, done, count 0', () => {
    for (const w of ['go', 'apple', 'left', 'leave', 'ponder', 'went'])
      c.vocab.save({ contentId: `word:en:${w}`, text: w })
    const plan = c.dailyPlan.plan()
    expect(plan.items[0]).toMatchObject({ kind: 'review', count: 6, minutes: 2, done: false })

    for (let i = 0; i < 20; i++) {
      const { card } = c.study.next()
      if (!card) break
      c.study.rate(card.cardId, 3, 1000)
    }
    expect(c.dailyPlan.plan().items[0]).toMatchObject({
      kind: 'review',
      count: 0,
      minutes: 2,
      done: true
    })
  })

  it('có thẻ, không thẻ nào đến hạn, hôm nay chưa ôn → mục ôn thẻ done, count 0, 2 phút', () => {
    // Không tự tạo thẻ phụ khi từ đã thuộc, để chỉ còn đúng một thẻ
    for (const k of ['review.dirViEn', 'review.dirAudio', 'review.dirCloze'] as const)
      c.settings.set(k, false)
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    c.study.rate(c.study.next().card!.cardId, 4, 1000) // Dễ → hạn ôn sau vài ngày
    clock.advance(24 * 3_600_000)
    expect(c.study.overview()).toMatchObject({ dueCount: 0, reviewedToday: 0, totalCards: 1 })
    expect(c.dailyPlan.plan().items[0]).toMatchObject({
      kind: 'review',
      count: 0,
      minutes: 2,
      done: true
    })
  })

  it('không còn thẻ nào (dù hôm nay đã ôn rồi xoá từ) → không có mục ôn thẻ', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    c.study.rate(c.study.next().card!.cardId, 3, 1000)
    c.study.removeWord('word:en:go')
    expect(c.study.overview()).toMatchObject({ totalCards: 0, reviewedToday: 1 })
    expect(c.dailyPlan.plan().items.some((i) => i.kind === 'review')).toBe(false)
  })

  it('kỹ năng nghe yếu nhất → mục kỹ năng là bài nghe chưa xong, khác bài của khoá', () => {
    c.settings.set('learning.levelListening', 'A1_1')
    const plan = c.dailyPlan.plan()
    const skill = plan.items.find((i) => i.kind === 'skill')!
    const lesson = plan.items.find((i) => i.kind === 'lesson')!
    expect(skill).toMatchObject({ skill: 'listening', lessonKind: 'listening', done: false })
    expect(skill.lessonId).not.toBe(lesson.lessonId)
    expect(c.listening.get(skill.lessonId!).title).toBe(skill.title)
  })

  it('rating Viết rất thấp không đổi lộ trình (Viết không có mục lộ trình)', () => {
    c.settings.set('learning.levelListening', 'A1_1')
    const before = c.dailyPlan.plan()
    // Hạ Viết xuống thấp nhất bằng nhiều lần viết sai ở độ khó cao
    for (let i = 0; i < 10; i++) {
      c.progress.record({
        source: 'free-writing',
        kind: 'free',
        skill: 'writing',
        level: 'C2',
        correct: 0,
        total: 1
      })
    }
    c.progress.setLevel('writing', 'PA1_1')
    const writing = c.progress.ratings().find((r) => r.skill === 'writing')!
    const others = c.progress.ratings().filter((r) => r.skill !== 'writing')
    expect(others.every((r) => r.rating > writing.rating)).toBe(true)
    expect(c.dailyPlan.plan()).toEqual(before)
    expect(c.dailyPlan.plan().items.find((i) => i.kind === 'skill')).toMatchObject({
      skill: 'listening'
    })
  })

  it('hoàn thành bài của khoá hôm nay → mục đó done, doneCount tăng; sang ngày mới thì là bài sau', () => {
    const before = c.dailyPlan.plan()
    const lesson = before.items.find((i) => i.kind === 'lesson')!
    finish(lesson.lessonKind!, lesson.lessonId!)
    const after = c.dailyPlan.plan()
    expect(after.items.find((i) => i.kind === 'lesson')).toMatchObject({
      lessonId: lesson.lessonId,
      done: true
    })
    expect(after.doneCount).toBe(before.doneCount + 1)

    clock.advance(24 * 3_600_000)
    const tomorrow = c.dailyPlan.plan().items.find((i) => i.kind === 'lesson')!
    expect(tomorrow.lessonId).not.toBe(lesson.lessonId)
    expect(tomorrow.done).toBe(false)
  })

  it('mục tiêu 60 phút → thêm bài kế tiếp của khoá, tối đa 5 mục, không trùng bài', () => {
    c.vocab.save({ contentId: 'word:en:go', text: 'go' })
    c.settings.set('learning.dailyMinutes', 60)
    const plan = c.dailyPlan.plan()
    expect(plan.targetMinutes).toBe(60)
    expect(plan.items).toHaveLength(5)
    expect(plan.items.filter((i) => i.kind === 'lesson')).toHaveLength(3)
    const ids = plan.items.filter((i) => i.lessonId).map((i) => i.lessonId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('xong một bài thêm của khoá hôm nay → bài đó vẫn trong lộ trình, done, được đếm', () => {
    c.settings.set('learning.dailyMinutes', 60)
    const before = c.dailyPlan.plan()
    const extra = before.items.filter((i) => i.kind === 'lesson')[1]
    finish(extra.lessonKind!, extra.lessonId!)
    const after = c.dailyPlan.plan()
    expect(after.items.find((i) => i.lessonId === extra.lessonId)).toMatchObject({
      kind: 'lesson',
      done: true
    })
    expect(after.doneCount).toBe(before.doneCount + 1)
  })

  it('xong bước cuối của khoá hôm nay → vẫn hiện bước đó với dấu ✓', () => {
    const course = c.courses.list()[0]
    const steps = c.courses.get(course.id).units.flatMap((u) => u.steps)
    for (const s of steps.slice(0, -1)) finish(s.kind, s.id)
    clock.advance(24 * 3_600_000)
    const last = steps[steps.length - 1]
    finish(last.kind, last.id)
    expect(c.courses.list()[0].next).toBeNull()
    const lesson = c.dailyPlan.plan().items.find((i) => i.kind === 'lesson')
    expect(lesson).toMatchObject({ lessonId: last.id, subtitle: course.title, done: true })
  })
})

describe('Bài đọc: tự lưu từ khó khi lần đầu đạt bài', () => {
  const LESSON = 'readlife.my-morning'
  const savedRows = (): Array<{ text: string; context: string | null }> =>
    conn.sqlite.prepare('SELECT text, context FROM saved_words ORDER BY rowid').all() as Array<{
      text: string
      context: string | null
    }>
  const pass = (): ReturnType<Container['readings']['complete']> => {
    const n = c.readings.get(LESSON).exercises.length
    return c.readings.complete(LESSON, n, n)
  }

  beforeEach(async () => {
    await c.packs.install(buildFixturePack(tmp))
    // Mọi từ của gói mẫu ở A1_1 → người học PA1_1 thấy chúng là từ khó
    c.settings.set('learning.level', 'PA1_1')
  })

  it('lần đầu đạt lưu các từ khó (≤ 8) kèm câu ngữ cảnh; làm lại không lưu thêm', () => {
    const first = pass()
    expect(first).toMatchObject({ firstCompletion: true, savedWords: 4 })
    expect(savedRows()).toEqual([
      { text: 'eat', context: 'Then I eat breakfast with my family.' },
      { text: 'go', context: "At seven o'clock, I go to school by bike." },
      { text: 'school', context: "At seven o'clock, I go to school by bike." },
      { text: 'house', context: 'The school is not far from my house.' }
    ])
    expect(c.study.words()).toHaveLength(4) // mỗi từ có thẻ ôn

    const again = pass()
    expect(again.firstCompletion).toBe(false)
    expect(again.savedWords ?? 0).toBe(0)
    expect(savedRows()).toHaveLength(4)
  })

  it('từ đã có trong sổ không lưu lại (giữ nguyên ngữ cảnh cũ)', () => {
    c.vocab.save({ contentId: 'word:en:school', text: 'school' })
    expect(pass().savedWords).toBe(3)
    expect(savedRows().find((r) => r.text === 'school')?.context).toBeNull()
    expect(savedRows()).toHaveLength(4)
  })

  it('tắt cài đặt hoặc hồ sơ trẻ em → không tự lưu', () => {
    c.settings.set('review.autoSaveReading', false)
    expect(pass()).toMatchObject({ firstCompletion: true })
    expect(savedRows()).toHaveLength(0)

    const kid = c.profiles.create({ name: 'Bé', track: 'primary', isChild: true })
    c.profiles.switchTo(kid.id)
    c.settings.set('review.autoSaveReading', true)
    c.settings.set('learning.level', 'PA1_1')
    expect(pass()).toMatchObject({ firstCompletion: true })
    expect(savedRows()).toHaveLength(0)
  })
})
