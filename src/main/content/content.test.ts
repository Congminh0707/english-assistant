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
import { FakeClock } from '../core/Clock'
import { openUserDb, type UserDbConnection } from '../db/client'
import { createContainer, type Container } from '../container'
import { compareVersions } from './ContentPackService'
import { computeStreak } from '../services/StudyService'

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
    origin = 'wiktionary',
    lists: string[] = []
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
       VALUES (?, ?, '["verb"]', ?, NULL, 'A1_1', ?, ?, ?, ?)`
    ).run(
      id,
      lemma,
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

  it('kiểm tra đầu vào: hỏi từng câu, chấm ở main, kết thúc thì lưu trình độ', () => {
    const meaning: Record<string, string> = { go: 'đi', left: 'trái', leave: 'rời đi' }
    let question = c.placement.start()
    expect(question).not.toBeNull()
    expect(question?.total).toBe(20)

    const seen: string[] = []
    let result = null as PlacementResult | null
    let guard = 0
    while (question && guard++ < 30) {
      seen.push(question.lemma)
      const pick = question.choices.indexOf(meaning[question.lemma])
      expect(pick).toBeGreaterThanOrEqual(0)
      const res = c.placement.answer(question.sessionId, question.id, pick)
      expect(res.correct).toBe(true)
      question = res.next
      result = res.result
    }
    // Gói mẫu chỉ có 3 từ thuộc danh sách chuẩn → bài kết thúc sớm, không lặp từ
    expect(new Set(seen).size).toBe(seen.length)
    expect(result).toMatchObject({ correct: seen.length, total: seen.length })
    expect(c.settings.get('learning.level')).toBe(result!.level)
  })

  it('kiểm tra đầu vào: trả lời "không biết" tính là sai; không trả lời lại câu cũ', () => {
    const q = c.placement.start()!
    const res = c.placement.answer(q.sessionId, q.id, null)
    expect(res.correct).toBe(false)
    expect(() => c.placement.answer(q.sessionId, q.id, 0)).toThrow(/NOT_FOUND/)
  })
})
