import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { KidsVisit } from '@shared/schemas/kidsWorld'
import { FakeClock } from '../core/Clock'
import { openUserDb, type UserDbConnection } from '../db/client'
import { createContainer, type Container } from '../container'

// Bản đồ thế giới của bé (docs/19) chạy trên nội dung thật content/curated/kids/world/
const MIGRATIONS = resolve('src/main/db/migrations')
const OPTIONS = { packsDir: resolve('content/.build/test-packs-unused') }
const DAY = 86_400_000

let conn: UserDbConnection
let clock: FakeClock
let c: Container

beforeEach(() => {
  conn = openUserDb(':memory:', MIGRATIONS)
  clock = new FakeClock()
  c = createContainer(conn, clock, OPTIONS)
  c.settings.set('kids.newPerDay', 6) // mặc định không giới hạn; các test dưới kiểm tra hạn mức 6 từ/ngày
})

afterEach(() => conn.close())

/** Chơi trọn một lượt: chấm bước 2 qua kids:rate, rồi báo xong lượt (mọi bước đúng ngay) */
function playVisit(
  visit: KidsVisit,
  tries: 0 | 1 | 2 = 1
): ReturnType<Container['kidsWorld']['visitDone']> {
  for (const item of visit.batch) c.kids.rateCard(item.cardId, tries, 1000)
  return c.kidsWorld.visitDone({
    placeId: visit.placeId,
    results: visit.batch.map((b) => ({
      pictureId: b.pictureId,
      tapTries: tries,
      sentenceTries: tries,
      played: true,
      spoke: true
    }))
  })
}

/** Xong một nơi (10 từ): qua nhiều ngày vì mỗi ngày chỉ 6 từ mới */
function finishPlace(placeId: string): ReturnType<Container['kidsWorld']['visitDone']> {
  for (let guard = 0; guard < 20; guard++) {
    const visit = c.kidsWorld.visit(placeId)
    if (visit.reviewOnly) {
      clock.advance(DAY)
      continue
    }
    const result = playVisit(visit)
    if (result.placeDone) return result
  }
  throw new Error(`không xong được ${placeId}`)
}

/** Mở tầng Việt Nam: xong 6/7 nơi Làng của bé rồi 3/3 nơi Màu-số-hình (không giới hạn từ mới/ngày), sang ngày mới */
function openVn(): void {
  c.settings.set('kids.newPerDay', 0)
  for (const [tierId, need] of [
    ['town', 6],
    ['basics', 3]
  ] as const) {
    const ids = c.kidsWorld.world().tiers.find((t) => t.id === tierId)!.places.map((p) => p.id)
    for (const id of ids.slice(0, need)) finishPlace(id)
  }
  c.settings.set('kids.newPerDay', 6)
  clock.advance(DAY)
  expect(c.kidsWorld.world().tiers.find((t) => t.id === 'vn')!.unlocked).toBe(true)
}

const tierOf = (id: string): ReturnType<Container['kidsWorld']['world']>['tiers'][number] =>
  c.kidsWorld.world().tiers.find((t) => t.id === id)!

describe('KidsWorldService', () => {
  it('bản đồ ban đầu: Làng của bé mở, các tầng sau khoá, thú cưng ở nơi gợi ý đầu tiên', () => {
    const world = c.kidsWorld.world()
    expect(world.tiers.map((t) => [t.id, t.unlocked])).toEqual([
      ['town', true],
      ['basics', false],
      ['vn', false],
      ['world', false],
      ['earth', false]
    ])
    const town = world.tiers[0]
    expect(town.places).toHaveLength(7)
    expect(town.places.every((p) => p.state === 'open' && p.stars === 0)).toBe(true)
    expect(town.places[0].words.every((w) => w.stage === 'hidden' && !w.done)).toBe(true)
    expect(world.currentPlaceId).toBe('school')
    expect(world.todayPlaceId).toBe('school')
    expect(world.newLeftToday).toBe(6)
    expect(c.kids.home()).toMatchObject({ worldPlacesDone: 0, worldPlacesTotal: 37 })
  })

  it('lượt chơi: tối đa 4 từ, tạo thẻ cho từ mới, đặt chỗ thú cưng, chưa học xong thì chưa trừ hạn mức', () => {
    openVn()
    const visit = c.kidsWorld.visit('halong')
    expect(visit.reviewOnly).toBe(false)
    expect(visit.batch.map((b) => b.pictureId)).toEqual(['boat', 'fish', 'crab', 'octopus'])
    for (const b of visit.batch) {
      expect(b.isNew).toBe(true)
      expect(b.choices).toContain(b.pictureId)
      expect(b.sentence.en.length).toBeGreaterThan(0)
    }
    const world = c.kidsWorld.world()
    expect(world.currentPlaceId).toBe('halong')
    expect(world.newLeftToday).toBe(6)
    expect(world.todayPlaceId).toBe('halong') // nơi đang học dở được gợi ý trước
    // Gọi lại khi chưa xong: dùng lại thẻ cũ, không tốn thêm hạn mức
    const again = c.kidsWorld.visit('halong')
    expect(again.batch.map((b) => b.cardId)).toEqual(visit.batch.map((b) => b.cardId))
    expect(c.kidsWorld.world().newLeftToday).toBe(6)
  })

  it('xong lượt ghi từ đã qua 5 bước; thiếu bước nói hoặc không ra thì chưa xong', () => {
    openVn()
    const visit = c.kidsWorld.visit('hanoi')
    for (const item of visit.batch) c.kids.rateCard(item.cardId, 1, 1000)
    const [a, b, d, e] = visit.batch.map((x) => x.pictureId)
    const result = c.kidsWorld.visitDone({
      placeId: 'hanoi',
      results: [
        { pictureId: a, tapTries: 1, sentenceTries: 1, played: true, spoke: true },
        { pictureId: b, tapTries: 2, sentenceTries: 1, played: true, spoke: true },
        { pictureId: d, tapTries: 1, sentenceTries: 1, played: true, spoke: false },
        { pictureId: e, tapTries: 1, sentenceTries: 0, played: true, spoke: true }
      ]
    })
    expect(result).toMatchObject({ placeDone: false, firstTime: false, foodId: null })
    expect(result.stars).toBe(2) // 7/8 lần đúng ngay = 88 điểm
    const words = tierOf('vn').places.find((p) => p.id === 'hanoi')!.words
    expect(words.filter((w) => w.done).map((w) => w.pictureId)).toEqual([a, b])
    // Đúng nhanh ngay lần đầu = "Dễ" → FSRS cho vào ôn luôn → mầm
    expect(words.find((w) => w.pictureId === a)!.stage).toBe('sprout')
    expect(words.find((w) => w.pictureId === 'television')!.stage).toBe('hidden')
  })

  it('xong nơi: rương thưởng một lần, sao, nơi chuyển sang done', () => {
    openVn()
    const before = c.inventory.list().reduce((n, i) => n + i.quantity, 0)
    const placesBefore = c.kids.home().worldPlacesDone
    const done = finishPlace('cantho')
    expect(done).toMatchObject({ placeDone: true, firstTime: true, tierUnlocked: null })
    expect(done.foodId).toMatch(/^food:/)
    expect(c.inventory.list().reduce((n, i) => n + i.quantity, 0)).toBeGreaterThan(before)
    const place = tierOf('vn').places.find((p) => p.id === 'cantho')!
    expect(place.state).toBe('done')
    expect(place.stars).toBe(3)
    expect(c.kids.home().worldPlacesDone).toBe(placesBefore + 1)
    // Vào lại nơi đã xong → lượt ôn, xong lượt không thưởng lại
    const review = c.kidsWorld.visit('cantho')
    expect(review.reviewOnly).toBe(true)
    expect(playVisit(review)).toMatchObject({ placeDone: true, firstTime: false, foodId: null })
  })

  it('hết hạn mức từ mới trong ngày → lượt chỉ ôn; sang ngày mới học tiếp', () => {
    openVn()
    playVisit(c.kidsWorld.visit('sapa')) // 4 từ
    playVisit(c.kidsWorld.visit('hue')) // 2 từ
    const third = c.kidsWorld.visit('hoian')
    expect(third).toMatchObject({ reviewOnly: true, batch: [] })
    clock.advance(DAY)
    expect(c.kidsWorld.visit('hoian').reviewOnly).toBe(false)
  })

  it('vào học nơi này rồi bỏ đó sang nơi khác: từ chưa học xong không tốn hạn mức', () => {
    openVn()
    c.kidsWorld.visit('halong') // mở 4 thẻ nhưng chưa chơi
    c.kidsWorld.visit('sapa')
    const next = c.kidsWorld.visit('hue')
    expect(next.reviewOnly).toBe(false)
    expect(c.kidsWorld.world().newLeftToday).toBe(6)
  })

  it('đặt không giới hạn: học bao nhiêu từ mới cũng được trong ngày', () => {
    openVn()
    c.settings.set('kids.newPerDay', 0)
    for (const id of ['sapa', 'hue', 'hoian']) {
      const visit = c.kidsWorld.visit(id)
      expect(visit.reviewOnly).toBe(false)
      playVisit(visit)
    }
    expect(c.kidsWorld.world().newLeftToday).toBeGreaterThan(0)
  })

  it('mở tầng Các nước khi xong 9/12 nơi Việt Nam và đủ từ ≥ mầm; nơi tầng khoá không vào được', () => {
    expect(() => c.kidsWorld.visit('nope')).toThrow(/NOT_FOUND/)
    c.kidsWorld.world() // tạo hồ sơ ngoài giao dịch (lỗi trong giao dịch sẽ hoàn tác cả hồ sơ mới)
    expect(() => c.kidsWorld.visit('hanoi')).toThrow(/placeLocked/) // Việt Nam chỉ mở sau Làng + Màu-số-hình
    openVn()
    const vn = tierOf('vn').places.map((p) => p.id)
    let unlocked: string | null = null
    for (const id of vn.slice(0, 9)) {
      const r = finishPlace(id)
      unlocked ??= r.tierUnlocked
    }
    // Đủ 9 nơi nhưng từ còn ở mức hạt giống/mầm tuỳ lịch ôn: ôn cho tới khi lên mầm
    for (let day = 0; day < 30 && !tierOf('world').unlocked; day++) {
      clock.advance(DAY)
      for (;;) {
        const next = c.kids.nextCard().card
        if (!next || next.isNew) break
        c.kids.rateCard(next.cardId, 1, 1000)
      }
    }
    expect(tierOf('world').unlocked).toBe(true)
    expect(tierOf('earth').unlocked).toBe(false)
  })

  it('có bản đồ thì phần ôn (bình tưới) không tự giới thiệu hình mới, chỉ trả thẻ đến hạn', () => {
    expect(c.kids.nextCard().card).toBeNull()
    const visit = c.kidsWorld.visit('school')
    // thẻ vừa tạo ở lượt chơi đến hạn ngay (cùng lúc → thẻ nào ra trước cũng được)
    expect(visit.batch.map((w) => w.cardId)).toContain(c.kids.nextCard().card?.cardId)
  })

  it('kết quả lượt có từ không thuộc nơi → lỗi', () => {
    expect(() =>
      c.kidsWorld.visitDone({
        placeId: 'school',
        results: [{ pictureId: 'crab', tapTries: 1, sentenceTries: 1, played: true, spoke: true }]
      })
    ).toThrow(/VALIDATION/)
  })
})
