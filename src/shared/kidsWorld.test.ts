import { describe, expect, it } from 'vitest'
import {
  KIDS_FLOWER_STABILITY,
  isThirsty,
  missingPictures,
  pickVisitBatch,
  placeProgress,
  placeState,
  sentenceTokens,
  tierUnlocked,
  validateWorld,
  wordStage,
  type PlaceWords,
  type WordStage
} from './kidsWorld'
import {
  KidsPlaceFileSchema,
  KidsWorldFileSchema,
  type KidsPlaceFile,
  type KidsWorldFile
} from './schemas/kidsWorld'

const DAY = 86_400_000

// --- Fixture: 2 tầng, tầng 1 có 2 nơi × 3 từ, tầng 2 có 1 nơi × 3 từ ---

const PICTURES: Record<string, { en: string }> = {
  dog: { en: 'dog' },
  cat: { en: 'cat' },
  house: { en: 'house' },
  fish: { en: 'fish' },
  crab: { en: 'crab' },
  boat: { en: 'boat' },
  lion: { en: 'lion' },
  zebra: { en: 'zebra' },
  icecream: { en: 'ice cream' }
}

function makeWorld(): KidsWorldFile {
  return KidsWorldFileSchema.parse({
    license: 'proprietary-own',
    tiers: [
      {
        id: 'vn',
        order: 1,
        title: 'Viet Nam',
        vi: 'Việt Nam',
        scene: 'vn',
        wordsPerPlace: 3,
        maxSentenceWords: 5,
        wordRange: [4, 10],
        frameWords: ['i', 'see', 'a', 'an', "it's", 'this', 'is', 'my', 'the'],
        unlock: null
      },
      {
        id: 'world',
        order: 2,
        title: 'The World',
        vi: 'Các nước',
        scene: 'islands',
        wordsPerPlace: 3,
        maxSentenceWords: 7,
        wordRange: [3, 20],
        frameWords: ['i', 'see', 'a', 'and', 'two'],
        unlock: { tier: 'vn', placesDoneShare: 0.75, sproutShare: 0.6 }
      }
    ]
  })
}

function makePlace(
  id: string,
  tier: string,
  words: Array<[string, string]>,
  extra: Partial<KidsPlaceFile['place']> = {}
): KidsPlaceFile {
  return KidsPlaceFileSchema.parse({
    license: 'proprietary-own',
    reviewed: false,
    place: {
      id,
      tier,
      order: 1,
      suggestOrder: extra.suggestOrder ?? 1,
      title: id,
      vi: id,
      topic: 'Topic',
      topicVi: 'Chủ điểm',
      landmark: `${id}-landmark`,
      landmarkVi: 'Công trình',
      pos: { x: 10, y: 20 },
      ...extra
    },
    words: words.map(([picture, en]) => ({ picture, sentence: { en, vi: 'câu' } }))
  })
}

function makePlaces(): KidsPlaceFile[] {
  return [
    makePlace(
      'hanoi',
      'vn',
      [
        ['dog', 'I see a dog.'],
        ['cat', "It's a cat."],
        ['house', 'This is my house.']
      ],
      { suggestOrder: 1 }
    ),
    makePlace(
      'halong',
      'vn',
      [
        ['fish', 'I see a fish.'],
        ['crab', "It's a crab."],
        ['boat', 'I see a boat.']
      ],
      { suggestOrder: 2 }
    ),
    makePlace('kenya', 'world', [
      ['lion', 'I see a lion and a dog.'],
      ['zebra', 'I see two zebras.'],
      ['icecream', 'I see a fish and ice cream.']
    ])
  ]
}

const errors = (world: KidsWorldFile, places: KidsPlaceFile[]): string[] =>
  validateWorld(world, places, { pictureWords: PICTURES })
    .filter((i) => i.level === 'error')
    .map((i) => `${i.where}: ${i.message}`)

describe('kidsWorld — mức nhớ', () => {
  it('suy ra từ thẻ FSRS', () => {
    expect(wordStage(null)).toBe('hidden')
    expect(wordStage({ state: 0, stability: 0, due: 0 })).toBe('seed')
    expect(wordStage({ state: 1, stability: 0.5, due: 0 })).toBe('seed')
    expect(wordStage({ state: 2, stability: 3, due: 0 })).toBe('sprout')
    expect(wordStage({ state: 2, stability: KIDS_FLOWER_STABILITY, due: 0 })).toBe('flower')
    // Học lại sau khi quên vẫn là mầm — không tụt về hạt giống
    expect(wordStage({ state: 3, stability: 1, due: 0 })).toBe('sprout')
  })

  it('khát nước khi quá hạn hơn một ngày', () => {
    const now = 10 * DAY
    expect(isThirsty({ state: 2, stability: 5, due: now - DAY - 1 }, now)).toBe(true)
    expect(isThirsty({ state: 2, stability: 5, due: now - DAY }, now)).toBe(false)
    expect(isThirsty({ state: 0, stability: 0, due: 0 }, now)).toBe(false)
    expect(isThirsty(null, now)).toBe(false)
  })
})

describe('kidsWorld — nơi & tầng', () => {
  const words = ['dog', 'cat', 'house']

  it('tiến độ và trạng thái nơi', () => {
    expect(placeProgress(words, new Set(['dog']))).toEqual({ done: 1, total: 3 })
    expect(placeState(false, words, new Set(words))).toBe('locked')
    expect(placeState(true, words, new Set(['dog']))).toBe('open')
    expect(placeState(true, words, new Set(words))).toBe('done')
  })

  const places: PlaceWords[] = [
    { id: 'a', tier: 'vn', words: ['w1', 'w2'] },
    { id: 'b', tier: 'vn', words: ['w3', 'w4'] },
    { id: 'c', tier: 'vn', words: ['w5', 'w6'] },
    { id: 'd', tier: 'vn', words: ['w7', 'w8'] }
  ]
  const tier = { unlock: { tier: 'vn', placesDoneShare: 0.75, sproutShare: 0.6 } }
  const sprouts = (n: number): Map<string, WordStage> =>
    new Map(Array.from({ length: n }, (_, i) => [`w${i + 1}`, 'sprout' as WordStage]))

  it('tầng không có điều kiện mở sẵn', () => {
    expect(tierUnlocked({ unlock: null }, places, new Set(), new Map())).toBe(true)
  })

  it('cần đủ tỉ lệ nơi đã xong (làm tròn lên) và đủ tỉ lệ từ ≥ mầm', () => {
    // 0.75 × 4 = 3 nơi; 0.6 × 8 = 4,8 → 5 từ
    expect(tierUnlocked(tier, places, new Set(['a', 'b']), sprouts(8))).toBe(false)
    expect(tierUnlocked(tier, places, new Set(['a', 'b', 'c']), sprouts(4))).toBe(false)
    expect(tierUnlocked(tier, places, new Set(['a', 'b', 'c']), sprouts(5))).toBe(true)
    const flowers = new Map<string, WordStage>([...sprouts(5)].map(([w]) => [w, 'flower']))
    expect(tierUnlocked(tier, places, new Set(['a', 'b', 'c']), flowers)).toBe(true)
  })

  it('12 nơi với 75 % cần 9 nơi (giữ tỉ lệ 6/8)', () => {
    const twelve: PlaceWords[] = Array.from({ length: 12 }, (_, i) => ({
      id: `p${i}`,
      tier: 'vn',
      words: [`x${i}`]
    }))
    const all = new Map<string, WordStage>(twelve.map((p) => [p.words[0], 'sprout']))
    const done = (n: number): Set<string> => new Set(twelve.slice(0, n).map((p) => p.id))
    expect(tierUnlocked(tier, twelve, done(8), all)).toBe(false)
    expect(tierUnlocked(tier, twelve, done(9), all)).toBe(true)
  })

  it('tầng điều kiện chưa có nơi nào thì chưa mở', () => {
    expect(tierUnlocked(tier, [], new Set(), new Map())).toBe(false)
  })
})

describe('kidsWorld — đợt từ của lượt chơi', () => {
  const words = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6']

  it('lấy tối đa 4 từ chưa xong, từ mới tốn hạn mức', () => {
    const batch = pickVisitBatch({
      words,
      completed: new Set(['w1']),
      hasCard: new Set(['w2']),
      newLeftToday: 2
    })
    expect(batch).toEqual({ words: ['w2', 'w3', 'w4'], newWords: ['w3', 'w4'], reviewOnly: false })
  })

  it('đủ hạn mức thì đủ 4 từ', () => {
    const batch = pickVisitBatch({
      words,
      completed: new Set(),
      hasCard: new Set(),
      newLeftToday: 6
    })
    expect(batch.words).toEqual(['w1', 'w2', 'w3', 'w4'])
    expect(batch.newWords).toHaveLength(4)
  })

  it('hết hạn mức từ mới → chỉ ôn từ đã xong, mức nhớ thấp trước', () => {
    const batch = pickVisitBatch({
      words,
      completed: new Set(['w1', 'w2', 'w3']),
      hasCard: new Set(['w1', 'w2', 'w3']),
      newLeftToday: 0,
      stages: new Map<string, WordStage>([
        ['w1', 'flower'],
        ['w2', 'sprout'],
        ['w3', 'seed']
      ])
    })
    expect(batch).toEqual({ words: ['w3', 'w2', 'w1'], newWords: [], reviewOnly: true })
  })

  it('nơi đã xong hết thì lượt là ôn', () => {
    const batch = pickVisitBatch({
      words: ['w1'],
      completed: new Set(['w1']),
      hasCard: new Set(['w1']),
      newLeftToday: 6
    })
    expect(batch.reviewOnly).toBe(true)
    expect(batch.words).toEqual(['w1'])
  })

  it('chưa học gì và hết hạn mức → lượt rỗng', () => {
    const batch = pickVisitBatch({
      words,
      completed: new Set(),
      hasCard: new Set(),
      newLeftToday: 0
    })
    expect(batch).toEqual({ words: [], newWords: [], reviewOnly: true })
  })
})

describe('kidsWorld — kiểm tra nội dung', () => {
  it('tách câu thành từ', () => {
    expect(sentenceTokens("It's a T-shirt!")).toEqual(["it's", 'a', 't-shirt'])
    expect(sentenceTokens('I see a cat.')).toEqual(['i', 'see', 'a', 'cat'])
    expect(sentenceTokens('It’s red')).toEqual(["it's", 'red'])
  })

  it('nội dung hợp lệ không có lỗi', () => {
    expect(errors(makeWorld(), makePlaces())).toEqual([])
  })

  it('sai số từ mỗi nơi', () => {
    const places = makePlaces()
    places[0].words.pop()
    expect(errors(makeWorld(), places)).toEqual(['hanoi: cần đúng 3 từ, đang có 2'])
  })

  it('từ mới trùng giữa hai nơi', () => {
    const places = makePlaces()
    places[1].words[0] = { picture: 'dog', sentence: { en: 'I see a dog.', vi: 'câu' } }
    expect(errors(makeWorld(), places)).toContain('halong: từ "dog" đã là từ mới ở hanoi')
  })

  it('câu dùng từ của nơi cùng tầng là lỗi, từ tầng thấp hơn thì được', () => {
    const places = makePlaces()
    places[0].words[0] = { picture: 'dog', sentence: { en: 'I see a dog and a fish.', vi: 'câu' } }
    expect(errors(makeWorld(), places)).toEqual([
      'hanoi: câu quá dài (7 > 5): "I see a dog and a fish."',
      'hanoi: câu dùng từ ngoài phạm vi (and, fish): "I see a dog and a fish."'
    ])
    // kenya (tầng 2) dùng "dog", "fish" của tầng 1 và số nhiều "zebras" → hợp lệ (fixture gốc)
  })

  it('câu phải chứa từ của nó (kể cả từ nhiều chữ)', () => {
    const places = makePlaces()
    places[2].words[2] = { picture: 'icecream', sentence: { en: 'I see a fish.', vi: 'câu' } }
    expect(errors(makeWorld(), places)).toEqual([
      'kenya: câu không chứa từ "icecream": "I see a fish."'
    ])
  })

  it('thiếu hình, từ nhạy cảm, thiếu công trình, tầng không tồn tại', () => {
    const places = makePlaces()
    places[0].words[2] = { picture: 'lantern', sentence: { en: 'I see a lantern.', vi: 'câu' } }
    places[1].place.tier = 'mars'
    const issues = validateWorld(makeWorld(), places, {
      pictureWords: PICTURES,
      sensitive: new Set(['cat']),
      landmarks: new Set(['hanoi-landmark'])
    }).map((i) => `${i.where}: ${i.message}`)
    expect(issues).toContain('hanoi: thiếu hình: lantern')
    expect(issues).toContain('hanoi: từ nhạy cảm: cat')
    expect(issues).toContain('halong: chưa có mô hình công trình: halong-landmark')
    expect(issues).toContain('halong: tầng không tồn tại: mars')
    expect(missingPictures(places, PICTURES)).toEqual(['lantern'])
  })

  it('tầng điều kiện phải tồn tại và đứng trước', () => {
    const world = makeWorld()
    world.tiers[0].unlock = { tier: 'world', placesDoneShare: 1, sproutShare: 0 }
    expect(errors(world, makePlaces())).toContain(
      'world.json: vn: tầng điều kiện phải đứng trước (world)'
    )
  })

  it('cảnh báo: tổng từ ngoài khoảng bậc, suggestOrder trùng, chưa duyệt khi phát hành', () => {
    const world = makeWorld()
    world.tiers[0].wordRange = [10, 20]
    const places = makePlaces()
    places[1].place.suggestOrder = 1
    const warnings = validateWorld(world, places, { pictureWords: PICTURES, release: true })
      .filter((i) => i.level === 'warning')
      .map((i) => `${i.where}: ${i.message}`)
    expect(warnings).toContain('vn: tổng từ của tầng 6 ngoài khoảng 10–20')
    expect(warnings).toContain('vn: suggestOrder bị trùng')
    expect(warnings).toContain('hanoi: chưa có người duyệt (reviewed: false)')
    // Không phát hành thì không cảnh báo chưa duyệt
    expect(
      validateWorld(makeWorld(), makePlaces(), { pictureWords: PICTURES }).filter(
        (i) => i.level === 'warning'
      )
    ).toEqual([])
  })

  it('schema từ chối file thiếu license hoặc toạ độ ngoài 0–100', () => {
    expect(KidsPlaceFileSchema.safeParse({ ...makePlaces()[0], license: 'cc-by' }).success).toBe(
      false
    )
    const bad = structuredClone(makePlaces()[0])
    bad.place.pos.x = 120
    expect(KidsPlaceFileSchema.safeParse(bad).success).toBe(false)
  })
})
