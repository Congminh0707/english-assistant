import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FakeClock } from '../core/Clock'
import { createContainer, type Container } from '../container'
import { openUserDb, type UserDbConnection } from '../db/client'
import { Scheduler } from './Scheduler'
import { scheduleDiaryJob } from './diaryJob'

let conn: UserDbConnection
let clock: FakeClock
let c: Container
let scheduler: Scheduler
let visible: boolean
let shown: number

const at = (day: number, hour: number): number => new Date(2026, 10, day, hour, 0, 0).getTime()

beforeEach(() => {
  conn = openUserDb(':memory:', resolve('src/main/db/migrations'))
  clock = new FakeClock(at(10, 20))
  c = createContainer(conn, clock, { packsDir: resolve('content/.build/test-packs-unused') })
  c.profiles.active()
  scheduler = new Scheduler()
  visible = true
  shown = 0
})

afterEach(() => {
  scheduler.stopAll()
  conn.close()
})

function job(): { check: () => boolean } {
  return scheduleDiaryJob(scheduler, c, { canShow: () => visible, show: () => shown++ })
}

describe('scheduleDiaryJob', () => {
  it('chưa tới giờ thì im; tới giờ nhắc đúng một lần mỗi ngày', () => {
    const { check } = job()
    expect(check()).toBe(false)
    clock.set(at(10, 21))
    expect(check()).toBe(true)
    clock.set(at(10, 22))
    expect(check()).toBe(false)
    clock.set(at(11, 21))
    expect(check()).toBe(true)
    expect(shown).toBe(2)
  })

  it('mascot đang ẩn/yên lặng → không nhắc và không mất lượt nhắc của ngày', () => {
    const { check } = job()
    clock.set(at(10, 21))
    visible = false
    expect(check()).toBe(false)
    visible = true
    expect(check()).toBe(true)
  })

  it('đã viết hôm nay, tắt nhắc (null) hoặc hồ sơ trẻ em → không nhắc', () => {
    const { check } = job()
    clock.set(at(10, 21))
    c.settings.set('diary.hour', null)
    expect(check()).toBe(false)
    c.settings.set('diary.hour', 21)
    c.diary.save('I worked a lot today.')
    expect(check()).toBe(false)
    clock.set(at(11, 21))
    const kid = c.profiles.create({ name: 'Bé', track: 'primary', isChild: true })
    c.profiles.switchTo(kid.id)
    expect(check()).toBe(false)
    expect(shown).toBe(0)
  })
})
