import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyPlan } from '@shared/schemas/study'
import { FakeClock } from '../core/Clock'
import { createContainer, type Container } from '../container'
import { openUserDb, type UserDbConnection } from '../db/client'
import { Scheduler } from './Scheduler'
import { planRemaining, schedulePlanJob, type PlanRemaining } from './planJob'

let conn: UserDbConnection
let clock: FakeClock
let c: Container
let scheduler: Scheduler
let visible: boolean
let shown: PlanRemaining[]

const at = (day: number, hour: number): number => new Date(2026, 10, day, hour, 0, 0).getTime()

const plan = (done: boolean[]): DailyPlan => ({
  day: '2026-11-10',
  targetMinutes: 20,
  items: done.map((d, i) => ({ kind: 'practice', title: '', minutes: 5 + i, done: d })),
  doneCount: done.filter(Boolean).length,
  totalMinutes: 0
})

beforeEach(() => {
  conn = openUserDb(':memory:', resolve('src/main/db/migrations'))
  clock = new FakeClock(at(10, 9))
  c = createContainer(conn, clock, { packsDir: resolve('content/.build/test-packs-unused') })
  c.profiles.active()
  scheduler = new Scheduler()
  visible = true
  shown = []
  // Lộ trình giả: 3 mục, 1 mục đã xong → còn 2 việc, 6 + 7 = 13 phút
  vi.spyOn(c.dailyPlan, 'plan').mockReturnValue(plan([true, false, false]))
})

afterEach(() => {
  vi.restoreAllMocks()
  scheduler.stopAll()
  conn.close()
})

function job(): { check: () => boolean } {
  return schedulePlanJob(scheduler, c, { canShow: () => visible, show: (left) => shown.push(left) })
}

describe('planRemaining', () => {
  it('đếm mục chưa xong và cộng phút của chúng', () => {
    expect(planRemaining(plan([true, false, false]))).toEqual({ count: 2, minutes: 13 })
    expect(planRemaining(plan([true, true]))).toEqual({ count: 0, minutes: 0 })
  })
})

describe('schedulePlanJob', () => {
  it('mặc định 10 giờ: chưa tới giờ thì im; tới giờ nhắc đúng một lần mỗi ngày kèm số việc/phút còn lại', () => {
    expect(c.settings.get('plan.reminderHour')).toBe(10)
    const { check } = job()
    expect(check()).toBe(false)
    clock.set(at(10, 10))
    expect(check()).toBe(true)
    expect(shown).toEqual([{ count: 2, minutes: 13 }])
    clock.set(at(10, 15))
    expect(check()).toBe(false)
    clock.set(at(11, 10))
    expect(check()).toBe(true)
    expect(shown).toHaveLength(2)
  })

  it('mở lại app trong cùng ngày (job mới) → không nhắc lần hai', () => {
    clock.set(at(10, 11))
    expect(job().check()).toBe(true)
    scheduler.stopAll()
    expect(job().check()).toBe(false)
    expect(c.settings.get('plan.remindedDay')).toBe('2026-11-10')
  })

  it('mascot đang ẩn/yên lặng/ngủ → không nhắc và không mất lượt nhắc của ngày', () => {
    const { check } = job()
    clock.set(at(10, 11))
    visible = false
    expect(check()).toBe(false)
    visible = true
    expect(check()).toBe(true)
  })

  it('tắt nhắc (null), lộ trình đã xong hoặc trống, hồ sơ trẻ em → không nhắc', () => {
    const { check } = job()
    clock.set(at(10, 11))
    c.settings.set('plan.reminderHour', null)
    expect(check()).toBe(false)
    c.settings.set('plan.reminderHour', 10)
    vi.mocked(c.dailyPlan.plan).mockReturnValue(plan([true, true]))
    expect(check()).toBe(false)
    vi.mocked(c.dailyPlan.plan).mockReturnValue(plan([]))
    expect(check()).toBe(false)
    vi.mocked(c.dailyPlan.plan).mockReturnValue(plan([false]))
    const kid = c.profiles.create({ name: 'Bé', track: 'primary', isChild: true })
    c.profiles.switchTo(kid.id)
    expect(check()).toBe(false)
    expect(shown).toHaveLength(0)
    expect(c.settings.get('plan.remindedDay')).toBe('')
  })

  it('renderer không ghi được plan.remindedDay (settings:set → FORBIDDEN)', () => {
    expect(() => c.settings.setFromRenderer('plan.remindedDay', '2026-11-10')).toThrow(/FORBIDDEN/)
  })
})
