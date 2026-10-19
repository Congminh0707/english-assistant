import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FakeClock } from '../core/Clock'
import { createContainer, type Container } from '../container'
import { LessonLibrary } from '../content/LessonLibrary'
import { openUserDb, type UserDbConnection } from '../db/client'
import { LessonRepository } from '../db/repositories/LessonRepository'
import { XpRepository } from '../db/repositories/XpRepository'
import { LessonService } from './LessonService'

const exercises = (n: number): unknown[] =>
  Array.from({ length: n }, (_, i) =>
    i % 2
      ? { type: 'mcq', prompt: `Câu ${i}?`, choices: ['a', 'b'], answer: 0 }
      : { type: 'gap', prompt: 'I ___ a student.', answers: ['am'] }
  )

const lesson = (id: string, title: string): unknown => ({
  id,
  title,
  summary: `Tóm tắt ${title}`,
  level: 'A1_1',
  minutes: 5,
  blocks: [
    { type: 'text', md: 'Nội dung.' },
    { type: 'examples', items: [{ en: 'I am a student.', vi: 'Tôi là học sinh.' }] }
  ],
  exercises: exercises(8)
})

const unit = (id: string, order: number, lessons: unknown[]): unknown => ({
  license: 'proprietary-own',
  unit: { id, title: `Chương ${id}`, summary: 'Tóm tắt chương', icon: '📘', order },
  lessons
})

let conn: UserDbConnection
let c: Container
let clock: FakeClock
let service: LessonService

beforeEach(() => {
  conn = openUserDb(':memory:', resolve('src/main/db/migrations'))
  clock = new FakeClock()
  c = createContainer(conn, clock, { packsDir: resolve('content/.build/test-packs-unused') })
  c.profiles.active()
  service = new LessonService({
    library: new LessonLibrary(
      [
        unit('b', 2, [lesson('b.one', 'B1')]),
        unit('a', 1, [lesson('a.one', 'A1'), lesson('a.two', 'A2')]),
        { broken: true }
      ],
      () => {}
    ),
    repo: new LessonRepository(conn.db),
    xpRepo: new XpRepository(conn.db),
    xp: c.xp,
    profiles: c.profiles,
    clock,
    transaction: (fn) => conn.sqlite.transaction(fn)()
  })
})

afterEach(() => conn.close())

describe('LessonLibrary', () => {
  it('sắp chương theo order, bỏ file sai schema, nối bài kế tiếp qua chương', () => {
    const lib = new LessonLibrary(
      [unit('b', 2, [lesson('b.one', 'B1')]), unit('a', 1, [lesson('a.one', 'A1')]), 42],
      () => {}
    )
    expect(lib.units().map((u) => u.id)).toEqual(['a', 'b'])
    expect(lib.lessonCount).toBe(2)
    expect(lib.nextLessonId('a.one')).toBe('b.one')
    expect(lib.nextLessonId('b.one')).toBeNull()
    expect(lib.nextLessonId('khong.co')).toBeNull()
  })
})

describe('LessonService', () => {
  it('danh mục theo thứ tự chương, chưa có tiến độ', () => {
    const catalog = service.catalog()
    expect(catalog.totalCount).toBe(3)
    expect(catalog.doneCount).toBe(0)
    expect(catalog.units.map((u) => u.id)).toEqual(['a', 'b'])
    expect(catalog.units[0].lessons[0]).toMatchObject({
      id: 'a.one',
      exerciseCount: 8,
      progress: { best: null, done: false }
    })
  })

  it('đạt ≥ 70% lần đầu: thưởng XP/xu một lần, lưu điểm cao nhất', () => {
    // Thưởng mở khoá thành tựu cộng thêm vào tổng XP: tách riêng để kiểm tra phần thưởng của bài học
    let achievementXp = 0
    c.bus.on('achievement.unlocked', (e) => (achievementXp += e.xp))
    const xp0 = c.pet.get().totalXp
    const first = service.complete('a.one', 6, 8) // 75%
    expect(first).toMatchObject({
      score: 75,
      best: 75,
      firstCompletion: true,
      xp: 15,
      coins: 5,
      nextLessonId: 'a.two'
    })
    expect(c.pet.get().totalXp).toBe(xp0 + 15 + achievementXp)

    // Làm lại với điểm cao hơn: không thưởng thêm nhưng điểm cao nhất tăng
    const again = service.complete('a.one', 8, 8)
    expect(again).toMatchObject({ score: 100, best: 100, firstCompletion: false, xp: 0 })
    expect(c.pet.get().totalXp).toBe(xp0 + 15 + achievementXp)

    const lesson = service.catalog().units[0].lessons[0]
    expect(lesson.progress).toEqual({ best: 100, done: true })
    expect(service.catalog().doneCount).toBe(1)
  })

  it('đạt tuyệt đối lần đầu có thưởng thêm', () => {
    expect(service.complete('a.two', 8, 8)).toMatchObject({ xp: 20, firstCompletion: true })
  })

  it('chưa đạt ngưỡng: ghi điểm nhưng chưa hoàn thành, chưa thưởng; đạt sau đó vẫn được thưởng', () => {
    const fail = service.complete('b.one', 3, 8) // 38%
    expect(fail).toMatchObject({ firstCompletion: false, xp: 0, best: 38, nextLessonId: null })
    expect(service.catalog().units[1].lessons[0].progress).toEqual({ best: 38, done: false })

    const pass = service.complete('b.one', 7, 8)
    expect(pass).toMatchObject({ firstCompletion: true, xp: 15, best: 88 })
    expect(service.catalog().units[1].lessons[0].progress.done).toBe(true)
  })

  it('bài không tồn tại / số câu đúng sai → lỗi', () => {
    expect(() => service.get('khong.co')).toThrow(/NOT_FOUND/)
    expect(() => service.complete('khong.co', 1, 2)).toThrow(/NOT_FOUND/)
    expect(() => service.complete('a.one', 9, 8)).toThrow(/VALIDATION/)
    expect(() => service.complete('a.one', 5, 11)).toThrow(/VALIDATION/)
  })

  it('tiến độ riêng cho từng hồ sơ', () => {
    service.complete('a.one', 8, 8)
    const other = c.profiles.create({ name: 'B', track: 'general' })
    c.profiles.switchTo(other.id)
    expect(service.catalog().doneCount).toBe(0)
  })
})
