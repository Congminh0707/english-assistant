import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../core/AppError'
import { FakeClock } from '../core/Clock'
import { createContainer, type Container } from '../container'
import { openUserDb, type UserDbConnection } from '../db/client'
import type { AiClient, AiRequest } from '../ai/AiClient'

const MIGRATIONS = resolve('src/main/db/migrations')
const PACKS = resolve('content/.build/test-packs-unused')
const DAY_MS = 24 * 60 * 60 * 1000

const TWELVE = 'Today I went to the park with my dog and we played a lot.'
const REPLY = {
  corrected: 'Today I went to the park with my dog, and we played a lot.',
  changes: [{ from: 'dog and', to: 'dog, and', note_vi: 'Thêm dấu phẩy trước "and".' }],
  praise_vi: 'Câu rõ ràng, dùng đúng thì quá khứ!'
}

class FakeClient implements AiClient {
  calls: AiRequest[] = []
  /** Chạy trong lúc "chờ AI" (vd người dùng lưu chữ khác, hoặc ném lỗi mạng) */
  during: (() => void) | null = null
  async complete(req: AiRequest): Promise<string> {
    this.calls.push(req)
    this.during?.()
    return JSON.stringify(REPLY)
  }
}

let conn: UserDbConnection
let clock: FakeClock
let c: Container
let client: FakeClient

function diaryXpEvents(): Array<{ amount: number; coins: number; ref_id: string }> {
  return conn.sqlite
    .prepare("SELECT amount, coins, ref_id FROM xp_events WHERE reason = 'diary.written'")
    .all() as Array<{ amount: number; coins: number; ref_id: string }>
}

function rows(): Array<Record<string, unknown>> {
  return conn.sqlite.prepare('SELECT * FROM diary_entries ORDER BY day').all() as Array<
    Record<string, unknown>
  >
}

function expectCode(fn: () => unknown, code: string): void {
  let err: unknown = null
  try {
    fn()
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(AppError)
  expect((err as AppError).code).toBe(code)
}

beforeEach(() => {
  conn = openUserDb(':memory:', MIGRATIONS)
  // 12:00 giờ địa phương để khoá ngày không lệch dù máy test ở múi giờ nào
  clock = new FakeClock(new Date(2026, 10, 10, 12, 0, 0).getTime())
  client = new FakeClient()
  c = createContainer(conn, clock, { packsDir: PACKS, ai: { getKey: () => 'sk-ant-test', client } })
  c.profiles.active()
})

afterEach(() => conn.close())

describe('DiaryService.save', () => {
  it('lưu entry hôm nay vào DB và thưởng 10 XP + 3 xu một lần khi đủ 10 từ', () => {
    const entry = c.diary.save(TWELVE)
    expect(entry.day).toBe('2026-11-10')
    expect(entry.text).toBe(TWELVE)
    expect(c.diary.today()?.id).toBe(entry.id)
    const saved = rows()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ day: '2026-11-10', text: TWELVE, corrected: null })
    expect(diaryXpEvents()).toEqual([{ amount: 10, coins: 3, ref_id: '2026-11-10' }])
  })

  it('lưu lần 2 cùng ngày: cập nhật chữ (cùng dòng), không thưởng thêm', () => {
    const first = c.diary.save(TWELVE)
    clock.advance(60_000)
    const second = c.diary.save(`${TWELVE} Then we went home.`)
    expect(second.id).toBe(first.id)
    expect(second.updatedAt).toBeGreaterThan(first.updatedAt)
    expect(rows()).toHaveLength(1)
    expect(rows()[0].text).toBe(`${TWELVE} Then we went home.`)
    expect(diaryXpEvents()).toHaveLength(1)
  })

  it('dưới 10 từ chưa thưởng; viết thêm cho đủ thì thưởng', () => {
    c.diary.save('I am tired today.')
    expect(diaryXpEvents()).toHaveLength(0)
    c.diary.save(TWELVE)
    expect(diaryXpEvents()).toHaveLength(1)
  })

  it('ngày khác là entry mới và thưởng riêng', () => {
    c.diary.save(TWELVE)
    clock.advance(DAY_MS)
    const next = c.diary.save(TWELVE)
    expect(next.day).toBe('2026-11-11')
    expect(rows()).toHaveLength(2)
    expect(diaryXpEvents().map((e) => e.ref_id)).toEqual(['2026-11-10', '2026-11-11'])
  })

  it('chữ rỗng hoặc quá 1200 ký tự → VALIDATION', () => {
    expectCode(() => c.diary.save('   '), 'VALIDATION')
    expectCode(() => c.diary.save('a'.repeat(1201)), 'VALIDATION')
    expect(rows()).toHaveLength(0)
  })
})

describe('DiaryService.correct', () => {
  beforeEach(() => c.settings.set('ai.enabled', true))

  it('gọi AI với chữ + trình độ, lưu corrected/changes/praise, không thưởng XP', async () => {
    c.settings.set('learning.level', 'B1_1')
    c.diary.save('I am tired today.')
    const { entry: out, stale } = await c.diary.correct()
    expect(stale).toBe(false)
    expect(client.calls).toHaveLength(1)
    expect(client.calls[0].user).toContain('I am tired today.')
    expect(client.calls[0].system).toContain('B1_1')
    expect(out.corrected).toBe(REPLY.corrected)
    expect(out.changes).toEqual(REPLY.changes)
    expect(out.praise).toBe(REPLY.praise_vi)
    const row = rows()[0]
    expect(row.corrected).toBe(REPLY.corrected)
    expect(JSON.parse(row.changes_json as string)).toEqual({
      changes: REPLY.changes,
      praise_vi: REPLY.praise_vi
    })
    expect(c.diary.today()?.corrected).toBe(REPLY.corrected)
    expect(diaryXpEvents()).toHaveLength(0)
  })

  it('sửa chữ sau khi AI sửa → xoá bản sửa cũ', async () => {
    c.diary.save('I am tired today.')
    await c.diary.correct()
    const edited = c.diary.save('I am very tired today.')
    expect(edited.corrected).toBeNull()
    expect(edited.changes).toEqual([])
    expect(edited.praise).toBeNull()
    expect(rows()[0].changes_json).toBeNull()
  })

  it('AI lỗi → correct() bị từ chối, dòng không đổi, không thưởng XP', async () => {
    c.diary.save('I am tired today.')
    const before = rows()[0]
    // AiService ghi cảnh báo (không có nội dung) khi lỗi mạng: tắt tiếng trong test
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    client.during = () => {
      throw new Error('network down')
    }
    await expect(c.diary.correct()).rejects.toMatchObject({ code: 'AI_FAILED' })
    expect(rows()[0]).toEqual(before)
    expect(diaryXpEvents()).toHaveLength(0)
    warn.mockRestore()
  })

  it('chữ đổi trong lúc chờ AI → bỏ bản sửa, báo stale', async () => {
    c.diary.save('I am tired today.')
    client.during = () => {
      c.diary.save('I am very tired today.')
    }
    const { entry, stale } = await c.diary.correct()
    expect(stale).toBe(true)
    expect(entry.text).toBe('I am very tired today.')
    expect(entry.corrected).toBeNull()
    expect(rows()[0]).toMatchObject({ text: 'I am very tired today.', corrected: null })
  })

  it('chưa viết gì hôm nay → NOT_FOUND, không gọi AI', async () => {
    await expect(c.diary.correct()).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(client.calls).toHaveLength(0)
  })
})

describe('DiaryService.list', () => {
  it('trả các ngày gần nhất trước, giới hạn số lượng', () => {
    for (let i = 0; i < 3; i++) {
      c.diary.save(`Day ${i} entry.`)
      clock.advance(DAY_MS)
    }
    expect(c.diary.list().map((e) => e.day)).toEqual(['2026-11-12', '2026-11-11', '2026-11-10'])
    expect(c.diary.list(2).map((e) => e.day)).toEqual(['2026-11-12', '2026-11-11'])
  })

  it('chỉ thấy nhật ký của hồ sơ đang dùng', () => {
    c.diary.save(TWELVE)
    const other = c.profiles.create({ name: 'Lan', track: 'general' })
    c.profiles.switchTo(other.id)
    expect(c.diary.list()).toEqual([])
    expect(c.diary.today()).toBeNull()
  })
})

describe('DiaryService: hồ sơ trẻ em', () => {
  it('today() null, todayView tắt AI, save ném FORBIDDEN', () => {
    c.settings.set('ai.enabled', true)
    const kid = c.profiles.create({ name: 'Bé', track: 'primary', isChild: true })
    c.profiles.switchTo(kid.id)
    expect(c.diary.today()).toBeNull()
    expect(c.diary.todayView()).toMatchObject({ entry: null, aiReady: false })
    expectCode(() => c.diary.save(TWELVE), 'FORBIDDEN')
    expect(() => c.diary.save(TWELVE)).toThrow('errors.forbidden')
    expect(c.diary.list()).toEqual([])
    expect(rows()).toHaveLength(0)
    expect(diaryXpEvents()).toHaveLength(0)
  })
})

describe('DiaryService.prompt', () => {
  it('cùng ngày cùng khoá; các ngày khác nhau có nhiều câu khác nhau', () => {
    const key = c.diary.prompt()
    expect(key).toMatch(/^study\.diary\.prompts\.([1-9]|1[0-2])$/)
    clock.advance(60 * 60 * 1000)
    expect(c.diary.prompt()).toBe(key)
    const keys = new Set<string>()
    for (let i = 0; i < 30; i++) {
      clock.advance(DAY_MS)
      keys.add(c.diary.prompt())
    }
    expect(keys.size).toBeGreaterThan(3)
  })

  it('todayView: entry + khoá gợi ý + aiReady theo trạng thái AI', () => {
    expect(c.diary.todayView()).toEqual({
      entry: null,
      promptKey: c.diary.prompt(),
      aiReady: false
    })
    c.settings.set('ai.enabled', true)
    const entry = c.diary.save(TWELVE)
    expect(c.diary.todayView()).toEqual({ entry, promptKey: c.diary.prompt(), aiReady: true })
  })
})

describe('cài đặt diary.hour', () => {
  it('mặc định 21, lưu được null (tắt) và đọc lại sau khi mở lại container', () => {
    expect(c.settings.get('diary.hour')).toBe(21)
    c.settings.set('diary.hour', null)
    expect(c.settings.get('diary.hour')).toBeNull()
    const again = createContainer(conn, clock, { packsDir: PACKS })
    expect(again.settings.get('diary.hour')).toBeNull()
    expectCode(() => c.settings.set('diary.hour', 24 as never), 'VALIDATION')
  })
})
