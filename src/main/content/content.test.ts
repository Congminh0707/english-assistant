import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
    expect(quiz.choices).toContain('đi')
    expect(new Set(quiz.choices).size).toBe(quiz.choices.length)

    const xpBefore = xpByReason('card.reviewed')
    const res = c.micro.answer(quiz.id, quiz.choices.indexOf('đi'), 2000)
    expect(res).toMatchObject({ correct: true, correctText: 'đi' })
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
    const wrong = quiz.choices.findIndex((ch) => ch !== 'đi')
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
        pick = question.choices.indexOf(meaning[question.lemma])
        expect(pick).toBeGreaterThanOrEqual(0)
      } else {
        // Ngữ pháp / đọc hiểu: có câu hỏi, đủ lựa chọn; đáp án đúng chỉ ở main nên chọn tạm đáp án đầu
        expect(question.prompt).toBeTruthy()
        expect(question.choices.length).toBeGreaterThanOrEqual(2)
        if (question.kind === 'reading') expect(question.passage).toBeTruthy()
      }
      const res = c.placement.answer(question.sessionId, question.id, pick)
      if (question.kind === 'vocab') expect(res.correct).toBe(true)
      question = res.next
      result = res.result
    }
    // Gói mẫu chỉ có 3 từ vựng → không lặp từ; ngân hàng ngữ pháp/đọc hiểu bù cho các câu còn lại
    expect(new Set(lemmas).size).toBe(lemmas.length)
    expect(kinds).toEqual(new Set(['vocab', 'grammar', 'reading']))
    expect(result).not.toBeNull()
    expect(result!.skills.map((s) => s.skill).sort()).toEqual(['grammar', 'reading', 'vocab'])
    expect(result!.total).toBe(result!.skills.reduce((n, s) => n + s.total, 0))
    expect(c.settings.get('learning.level')).toBe(result!.level)
    for (const s of result!.skills) {
      const key = {
        vocab: 'learning.levelVocab',
        grammar: 'learning.levelGrammar',
        reading: 'learning.levelReading'
      }[s.skill] as 'learning.levelVocab' | 'learning.levelGrammar' | 'learning.levelReading'
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
