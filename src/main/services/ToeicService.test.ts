import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { estimateScore, scaleSection } from '@shared/toeic'
import { FakeClock } from '../core/Clock'
import { ToeicBank } from '../content/ToeicBank'
import { openUserDb, type UserDbConnection } from '../db/client'
import { ExamRepository } from '../db/repositories/ExamRepository'
import { createContainer } from '../container'
import { ToeicService } from './ToeicService'

const MIGRATIONS = resolve('src/main/db/migrations')
const OPTIONS = { packsDir: resolve('content/.build/test-packs-unused') }

type RawGroup = Record<string, unknown>

/** Ngân hàng giả đủ cho cả mini lẫn full: mỗi Part có nhiều nhóm đúng cấu trúc */
function fakeFile(): unknown {
  const groups: RawGroup[] = []
  const q = (id: string, n: number, answer: number, part: number): RawGroup => ({
    id,
    prompt: part <= 2 ? '' : `Question ${id}?`,
    choices: n === 3 ? ['a', 'b', 'c'] : ['a', 'b', 'c', 'd'],
    answer,
    explain: 'Vì sao đúng.'
  })
  const spec: Array<[number, number, number]> = [
    [1, 12, 1],
    [2, 40, 1],
    [3, 16, 3],
    [4, 12, 3],
    [5, 40, 1],
    [6, 6, 4],
    [7, 30, 2]
  ]
  for (const [part, count, perGroup] of spec) {
    for (let i = 0; i < count; i++) {
      const qs = Array.from({ length: perGroup }, (_, k) =>
        q(`t${part}-q${i}-${k}`, part === 2 ? 3 : 4, 0, part)
      )
      groups.push({
        id: `t${part}-g${i}`,
        part,
        level: 'B1_2',
        ...(part === 1 ? { scene: 'A scene.' } : {}),
        ...(part >= 2 && part <= 4 ? { script: 'Hello there.' } : {}),
        ...(part >= 6 ? { passage: 'A passage.' } : {}),
        questions: qs
      })
    }
  }
  return { license: 'proprietary-own', generator: 'test', reviewed: true, groups }
}

let conn: UserDbConnection
let clock: FakeClock
let service: ToeicService

beforeEach(() => {
  conn = openUserDb(':memory:', MIGRATIONS)
  clock = new FakeClock()
  const c = createContainer(conn, clock, OPTIONS)
  service = new ToeicService({
    bank: new ToeicBank([fakeFile()]),
    repo: new ExamRepository(conn.db),
    profiles: c.profiles,
    clock,
    random: () => 0.5
  })
})

afterEach(() => conn.close())

describe('điểm ước lượng TOEIC', () => {
  it('quy đổi đơn điệu, 5–495', () => {
    expect(scaleSection(0)).toBe(5)
    expect(scaleSection(1)).toBe(495)
    expect(scaleSection(0.6)).toBeGreaterThan(scaleSection(0.5))
  })

  it('tổng = nghe + đọc; thiếu một phần thì nhân đôi', () => {
    const both = estimateScore({ correct: 100, total: 100 }, { correct: 100, total: 100 })
    expect(both.total).toBe(990)
    const one = estimateScore({ correct: 50, total: 100 }, { correct: 0, total: 0 })
    expect(one.reading).toBeNull()
    expect(one.total).toBe((one.listening ?? 0) * 2)
  })
})

describe('ToeicService', () => {
  it('ngân hàng giả đủ cho mini và full', () => {
    const info = service.bank()
    expect(info.mini).toBe(true)
    expect(info.full).toBe(true)
  })

  it('chế độ part chọn đúng Part và không lộ đáp án', () => {
    const session = service.start('part', 5)
    expect(session).not.toBeNull()
    expect(session!.timeLimitSec).toBeNull()
    expect(session!.groups.every((g) => g.part === 5)).toBe(true)
    expect(JSON.stringify(session)).not.toContain('explain')
    expect(JSON.stringify(session)).not.toContain('answer')
  })

  it('mini có giới hạn 30 phút, đủ số câu mỗi Part', () => {
    const session = service.start('mini')!
    expect(session.timeLimitSec).toBe(30 * 60)
    expect(session.totalQuestions).toBeGreaterThanOrEqual(44)
  })

  it('nộp bài: chấm đúng, ghi lịch sử, thưởng XP không có (không gắn xp)', () => {
    const session = service.start('part', 5)!
    const answers: Record<string, number | null> = {}
    session.groups.forEach((g, i) =>
      g.questions.forEach((qq) => (answers[qq.id] = i % 2 === 0 ? 0 : 1))
    )
    const result = service.submit(session.sessionId, answers, 90)
    expect(result.total).toBe(session.totalQuestions)
    expect(result.correct).toBeGreaterThan(0)
    expect(result.correct).toBeLessThan(result.total)
    expect(result.review).toHaveLength(result.total)
    expect(result.parts).toEqual([{ part: 5, correct: result.correct, total: result.total }])
    const history = service.history()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ mode: 'part', part: 5, elapsedSec: 90 })
  })

  it('bỏ trống tính sai; phiên chỉ nộp được một lần', () => {
    const session = service.start('mini')!
    const result = service.submit(session.sessionId, {}, 10)
    expect(result.correct).toBe(0)
    expect(result.estimate.total).toBeLessThanOrEqual(30)
    expect(() => service.submit(session.sessionId, {}, 10)).toThrow()
  })

  it('ngân hàng thiếu câu thì không bắt đầu được', () => {
    const empty = new ToeicService({
      bank: new ToeicBank([]),
      repo: new ExamRepository(conn.db),
      profiles: createContainer(conn, clock, OPTIONS).profiles,
      clock
    })
    expect(empty.start('mini')).toBeNull()
    expect(empty.start('part', 3)).toBeNull()
  })
})
