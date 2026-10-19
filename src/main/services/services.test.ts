import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FakeClock } from '../core/Clock'
import { AppError } from '../core/AppError'
import { openUserDb, type UserDbConnection } from '../db/client'
import { createContainer, type Container } from '../container'
import { SleepService } from './SleepService'

const MIGRATIONS = resolve('src/main/db/migrations')
const OPTIONS = { packsDir: resolve('content/.build/test-packs-unused') }
const HOUR = 3_600_000

let conn: UserDbConnection
let clock: FakeClock
let c: Container

beforeEach(() => {
  conn = openUserDb(':memory:', MIGRATIONS)
  clock = new FakeClock()
  c = createContainer(conn, clock, OPTIONS)
})

afterEach(() => conn.close())

describe('ProfileService', () => {
  it('lần đầu tự tạo profile mặc định kèm thú cưng và túi đồ khởi đầu', () => {
    const profile = c.profiles.active()
    expect(profile.name).toBe('Bạn')
    expect(c.settings.get('app.activeProfileId')).toBe(profile.id)
    expect(c.pet.get().name).toBe('Bi')
    const bag = c.inventory.list()
    expect(bag).toHaveLength(2)
    expect(bag).toEqual(
      expect.arrayContaining([
        { itemId: 'food:onigiri', quantity: 3 },
        { itemId: 'food:milk-tea', quantity: 1 }
      ])
    )
  })

  it('giữ nguyên profile đang dùng giữa các lần khởi động', () => {
    const first = c.profiles.active()
    const again = createContainer(conn, clock, OPTIONS)
    expect(again.profiles.active().id).toBe(first.id)
    expect(again.profiles.list()).toHaveLength(1)
  })
})

describe('PetService', () => {
  it('chỉ số giảm theo thời gian thực', () => {
    const start = c.pet.get()
    clock.advance(2 * 60_000) // 2 phút (app mở)
    const later = c.pet.get()
    expect(later.hunger).toBeLessThan(start.hunger)
  })

  it('cho ăn: trừ túi đồ, cộng chỉ số, phát sự kiện', () => {
    c.profiles.active()
    clock.advance(10 * HOUR) // để đói bớt
    const events: string[] = []
    c.bus.on('pet.fed', ({ itemId }) => events.push(itemId))
    const before = c.pet.get()
    const after = c.pet.feed('food:onigiri')
    expect(after.hunger).toBeCloseTo(before.hunger + 20, 0)
    expect(after.affection).toBe(before.affection + 1)
    expect(c.inventory.list().find((i) => i.itemId === 'food:onigiri')?.quantity).toBe(2)
    expect(events).toEqual(['food:onigiri'])
  })

  it('không cho ăn món không có trong túi; túi đồ không bị trừ khi lỗi', () => {
    c.profiles.active()
    expect(() => c.pet.feed('food:cake')).toThrowError(AppError)
    expect(() => c.pet.feed('food:khong-co')).toThrowError(AppError)
    c.pet.feed('food:milk-tea')
    expect(() => c.pet.feed('food:milk-tea')).toThrowError(/ITEM_NOT_OWNED/)
  })

  it('vuốt ve tăng mood nhưng giới hạn số lần mỗi giờ', () => {
    clock.advance(5 * HOUR)
    const base = c.pet.get().mood
    for (let i = 0; i < 15; i++) c.pet.pat()
    // tick trong lúc pat làm mood giảm rất nhỏ; tối đa +10 dù bấm 15 lần
    expect(c.pet.get().mood).toBeCloseTo(base + 10, 0)
    clock.advance(HOUR)
    const next = c.pet.get().mood
    expect(c.pet.pat().mood).toBeGreaterThan(next)
  })
})

describe('XpService', () => {
  it('ghi sổ cái, cộng XP/xu và phát sự kiện lên cấp', () => {
    const levels: number[] = []
    c.bus.on('level.up', ({ level }) => levels.push(level))
    const { state, levelUp } = c.xp.grant({ amount: 60, coins: 10, reason: 'lesson.completed' })
    expect(levelUp).toBe(true)
    expect(state.level).toBe(2)
    expect(state.xpInLevel).toBe(10)
    expect(state.coins).toBe(10)
    expect(levels).toEqual([2])
    expect(c.xp.grant({ amount: 5, reason: 'card.reviewed' }).levelUp).toBe(false)
  })
})

describe('SettingsService', () => {
  it('có giá trị mặc định, validate khi ghi và lưu bền', () => {
    expect(c.settings.get('ui.language')).toBe('vi')
    expect(c.settings.get('mascot.scale')).toBe(2)
    expect(() => c.settings.set('mascot.scale', 5)).toThrowError(AppError)
    c.settings.set('ui.language', 'en')
    expect(createContainer(conn, clock, OPTIONS).settings.get('ui.language')).toBe('en')
  })

  it('phát sự kiện settings.changed', () => {
    const changed: string[] = []
    c.bus.on('settings.changed', ({ key }) => changed.push(key))
    c.settings.set('app.launchAtLogin', true)
    expect(changed).toEqual(['app.launchAtLogin'])
  })
})

describe('SleepService', () => {
  it('ngủ khi người dùng vắng mặt, hồi năng lượng lúc ngủ, dậy khi quay lại', () => {
    const changes: boolean[] = []
    let idle = 0
    const sleep = new SleepService({
      pet: c.pet,
      getIdleSeconds: () => idle,
      onChange: (state) => changes.push(state.sleeping)
    })
    sleep.check()
    expect(sleep.sleeping).toBe(false)

    idle = 11 * 60
    sleep.check()
    expect(sleep.sleeping).toBe(true)

    const before = c.pet.get().energy
    sleep.rest(60 * 60_000) // 1 giờ ngủ: +12
    expect(c.pet.get().energy).toBeGreaterThan(before + 10)

    idle = 3
    sleep.check()
    expect(sleep.sleeping).toBe(false)
    expect(changes).toEqual([true, false])
    // Thức thì không hồi năng lượng
    const awake = c.pet.get().energy
    sleep.rest(60 * 60_000)
    expect(c.pet.get().energy).toBe(awake)
  })
})

describe('ShopService', () => {
  it('mua đồ ăn: trừ xu, ghi sổ cái (coins âm), cộng vào túi', () => {
    c.profiles.active()
    c.xp.grant({ amount: 0, coins: 50, reason: 'test' })
    const bag = (): number =>
      c.inventory.list().find((i) => i.itemId === 'food:cake')?.quantity ?? 0
    expect(bag()).toBe(0)

    const state = c.shop.buy('food:cake') // 25 xu
    expect(state.coins).toBe(25)
    expect(bag()).toBe(1)
    expect(c.pet.get().coins).toBe(25)
    const spent = conn.sqlite
      .prepare(
        "SELECT coins, reason, ref_id AS refId FROM xp_events WHERE reason = 'shop.purchase'"
      )
      .all()
    expect(spent).toEqual([{ coins: -25, reason: 'shop.purchase', refId: 'food:cake' }])
    // Tổng sổ cái khớp với số xu của thú cưng
    expect(c.pet.get().coins).toBe(
      (conn.sqlite.prepare('SELECT sum(coins) AS n FROM xp_events').get() as { n: number }).n
    )
  })

  it('không đủ xu / chưa đủ level / đã có phụ kiện → lỗi, không trừ xu', () => {
    c.profiles.active()
    expect(() => c.shop.buy('acc:bow')).toThrow(/NOT_ENOUGH_COINS/)
    c.xp.grant({ amount: 0, coins: 500, reason: 'test' })
    expect(() => c.shop.buy('acc:crown')).toThrow(/LEVEL_TOO_LOW/) // cần Lv 10
    expect(() => c.shop.buy('khong-co')).toThrow(/ITEM_UNKNOWN/)
    expect(c.pet.get().coins).toBe(500)
    c.shop.buy('acc:bow')
    expect(() => c.shop.buy('acc:bow')).toThrow(/ALREADY_OWNED/)
    expect(c.pet.get().coins).toBe(470)
  })

  it('đeo/tháo phụ kiện đã mua; chưa mua thì không đeo được; cùng vị trí thì thay', () => {
    c.profiles.active()
    c.xp.grant({ amount: 0, coins: 500, reason: 'test' })
    expect(() => c.shop.equip('acc:bow', true)).toThrow(/ITEM_NOT_OWNED/)
    c.shop.buy('acc:bow')
    c.shop.buy('acc:glasses')
    const events: string[][] = []
    c.bus.on('pet.updated', (s) => events.push(s.equipped))

    c.shop.equip('acc:bow', true)
    c.shop.equip('acc:glasses', true)
    expect(c.pet.get().equipped).toEqual(['acc:bow', 'acc:glasses'])
    expect(events.at(-1)).toEqual(['acc:bow', 'acc:glasses'])
    const item = c.shop.state().items.find((i) => i.id === 'acc:bow')
    expect(item).toMatchObject({ owned: 1, equipped: true, locked: false })

    c.shop.equip('acc:bow', false)
    expect(c.pet.get().equipped).toEqual(['acc:glasses'])
  })

  it('hồ sơ khác có túi đồ và phụ kiện riêng', () => {
    const first = c.profiles.active()
    c.xp.grant({ amount: 0, coins: 100, reason: 'test' })
    c.shop.buy('acc:bow')
    c.shop.equip('acc:bow', true)
    const other = c.profiles.create({ name: 'B', track: 'general' })
    c.profiles.switchTo(other.id)
    expect(c.pet.get().equipped).toEqual([])
    expect(c.shop.state().items.find((i) => i.id === 'acc:bow')?.owned).toBe(0)
    c.profiles.switchTo(first.id)
    expect(c.pet.get().equipped).toEqual(['acc:bow'])
  })
})
