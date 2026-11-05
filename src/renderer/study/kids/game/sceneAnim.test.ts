import { describe, expect, it } from 'vitest'
import {
  ActorScheduler,
  GAP_MIN,
  LaneRunner,
  MAX_PLAYING,
  START_GAP_MIN,
  clockAngles,
  glowPulse,
  loopFrame,
  mistAlpha,
  sequence,
  spawnLeaf,
  spawnMist,
  stepLeaf,
  type LaneSpec,
  type MistSpec
} from './sceneAnim'

/** Số giả ngẫu nhiên cố định (mulberry32) để test lặp lại được */
function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const frames = ['0', '1', '2', '3', '4', '5']
const ACTORS = ['koi', 'cyclo', 'vendor', 'child', 'chess', 'bike'].map((name) => ({
  name,
  kind: name === 'koi' ? ('burst' as const) : ('pingpong' as const),
  frameMs: name === 'koi' ? 200 : 500,
  frames
}))

describe('sequence', () => {
  it('ping-pong đi 0→5→0, burst 0→5 rồi về 0', () => {
    expect(sequence('pingpong', 6)).toEqual([0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0])
    expect(sequence('burst', 6)).toEqual([0, 1, 2, 3, 4, 5, 0])
    expect(sequence('loop', 6)).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('ActorScheduler', () => {
  function run(
    seed: number,
    ms: number
  ): { s: ActorScheduler; starts: Array<{ t: number; i: number }>; maxPlaying: number } {
    const s = new ActorScheduler(ACTORS, 0, seeded(seed))
    const starts: Array<{ t: number; i: number }> = []
    let prev = ACTORS.map(() => 0)
    let maxPlaying = 0
    for (let t = 0; t <= ms; t += 50) {
      s.tick(t)
      const counts = ACTORS.map((_, i) => s.count(i))
      counts.forEach((c, i) => {
        if (c > prev[i]) starts.push({ t, i })
      })
      prev = counts
      maxPlaying = Math.max(maxPlaying, s.playing())
    }
    return { s, starts, maxPlaying }
  }

  it('không quá MAX_PLAYING vật cùng lúc, hai lượt bắt đầu cách nhau ≥ 2 s', () => {
    const { starts, maxPlaying } = run(1, 120_000)
    expect(maxPlaying).toBeLessThanOrEqual(MAX_PLAYING)
    for (let k = 1; k < starts.length; k++) {
      expect(starts[k].t - starts[k - 1].t).toBeGreaterThanOrEqual(START_GAP_MIN)
    }
  })

  it('mỗi vật nghỉ ≥ 5 s giữa hai lượt và không vật nào bị bỏ quên', () => {
    const { s, starts } = run(7, 120_000)
    ACTORS.forEach((a, i) => {
      expect(s.count(i), a.name).toBeGreaterThanOrEqual(3)
      const own = starts.filter((x) => x.i === i).map((x) => x.t)
      for (let k = 1; k < own.length; k++)
        expect(own[k] - own[k - 1]).toBeGreaterThanOrEqual(GAP_MIN)
    })
  })

  it('đứng yên thì ở khung 0', () => {
    const s = new ActorScheduler(ACTORS, 0, seeded(3))
    expect(s.tick(0)).toEqual([0, 0, 0, 0, 0, 0])
  })
})

describe('lá rơi', () => {
  it('rơi xuống dần, khung xoay trong khoảng', () => {
    const rnd = seeded(5)
    const l = spawnLeaf({ xMin: 40, xMax: 820, ground: 930 }, rnd)
    const y0 = l.y
    let last = { x: 0, y: 0, frame: 0 }
    for (let k = 0; k < 200; k++) {
      last = stepLeaf(l, 0.1, 6)
      expect(last.frame).toBeGreaterThanOrEqual(0)
      expect(last.frame).toBeLessThan(6)
    }
    expect(last.y).toBeGreaterThan(y0 + 100)
  })
})

describe('ActorScheduler với vật loop', () => {
  it('bỏ qua vật loop, vật khác vẫn chạy', () => {
    const actors = [
      { name: 'wave', kind: 'loop' as const, frameMs: 300, frames },
      { name: 'cook', kind: 'pingpong' as const, frameMs: 400, frames }
    ]
    const s = new ActorScheduler(actors, 0, seeded(2))
    for (let t = 0; t <= 60_000; t += 50) {
      const f = s.tick(t)
      expect(f[0]).toBe(0)
    }
    expect(s.count(0)).toBe(0)
    expect(s.count(1)).toBeGreaterThan(0)
  })
})

describe('loopFrame, glowPulse, clockAngles', () => {
  it('chạy vòng đều và lệch pha', () => {
    expect([0, 100, 200, 300, 600, 700].map((t) => loopFrame(t, 100, 6))).toEqual([0, 1, 2, 3, 0, 1])
    expect(loopFrame(0, 100, 6, 250)).toBe(2)
  })
  it('vầng sáng nhấp nháy trong 0.75..1', () => {
    for (let t = 0; t < 10_000; t += 97) {
      const g = glowPulse(t, 123)
      expect(g).toBeGreaterThanOrEqual(0.75)
      expect(g).toBeLessThanOrEqual(1)
    }
  })
  it('kim đồng hồ theo giờ máy', () => {
    expect(clockAngles(new Date(2026, 10, 1, 3, 0, 0))).toEqual({ hour: 90, minute: 0 })
    expect(clockAngles(new Date(2026, 10, 1, 15, 30, 0))).toEqual({ hour: 105, minute: 180 })
    expect(clockAngles(new Date(2026, 10, 1, 0, 0, 30)).minute).toBe(3)
  })
})

describe('LaneRunner', () => {
  const lane: LaneSpec = {
    name: 'road',
    y: 800,
    dir: 0,
    x: [-200, 1900],
    gap: [600, 1800],
    fade: [0, 0],
    frameMs: 120,
    maxActive: 12,
    variants: [
      { name: 'bike', frames, w: 150, h: 130, speed: [200, 300], weight: 3 },
      { name: 'bus', frames, w: 400, h: 220, speed: [100, 140], weight: 1 }
    ]
  }

  it('có sẵn vật khi mới vào cảnh, không vượt maxActive, mọi vật ở trong đoạn đường', () => {
    const r = new LaneRunner(lane, 0, seeded(4))
    expect(r.count()).toBeGreaterThan(0)
    for (let t = 0; t <= 120_000; t += 50) {
      const v = r.tick(t)
      expect(v.length).toBeLessThanOrEqual(lane.maxActive)
      v.forEach((it) => {
        expect(it.x).toBeGreaterThanOrEqual(lane.x[0])
        expect(it.x).toBeLessThanOrEqual(lane.x[1])
        expect(it.frame).toBeGreaterThanOrEqual(0)
        expect(it.frame).toBeLessThan(6)
      })
    }
  })

  it('đi cả hai chiều khi dir = 0 và chỉ một chiều khi dir cố định', () => {
    const both = new LaneRunner(lane, 0, seeded(9))
    const dirs = new Set<number>()
    for (let t = 0; t <= 60_000; t += 100) both.tick(t).forEach((i) => dirs.add(i.dir))
    expect([...dirs].sort()).toEqual([-1, 1])
    const right = new LaneRunner({ ...lane, dir: 1 }, 0, seeded(9))
    const rd = new Set<number>()
    for (let t = 0; t <= 60_000; t += 100) right.tick(t).forEach((i) => rd.add(i.dir))
    expect([...rd]).toEqual([1])
  })

  it('làn chỉ có vật nhanh: mọi vật chạy đúng khoảng tốc độ cấu hình, không bị khoá về mức thấp nhất', () => {
    const fastOnly: LaneSpec = {
      ...lane,
      dir: 1,
      gap: [2000, 5000],
      maxActive: 4,
      variants: [{ name: 'fast', frames, w: 100, h: 90, speed: [300, 340], weight: 1 }]
    }
    const r = new LaneRunner(fastOnly, 0, seeded(21))
    const first = new Map<number, { x: number; t: number }>()
    const v: number[] = []
    for (let t = 0; t <= 120_000; t += 100) {
      r.tick(t).forEach((i) => {
        const e = first.get(i.id)
        if (!e) first.set(i.id, { x: i.x, t })
        else if (t - e.t > 2000) v.push(((i.x - e.x) / (t - e.t)) * 1000)
      })
    }
    expect(v.length).toBeGreaterThan(50)
    expect(Math.min(...v)).toBeGreaterThan(290)
  })

  it('làn lẫn vật chậm và nhanh: không vượt nhau nên không chồng (vật sau chạy chậm lại bằng vật trước khi sắp đuổi kịp)', () => {
    const mixed: LaneSpec = {
      ...lane,
      dir: 1,
      gap: [500, 1500],
      maxActive: 8,
      variants: [
        { name: 'slow', frames, w: 150, h: 130, speed: [60, 70], weight: 1 },
        { name: 'fast', frames, w: 100, h: 90, speed: [300, 340], weight: 3 }
      ]
    }
    const r = new LaneRunner(mixed, 0, seeded(5))
    for (let t = 0; t <= 200_000; t += 100) {
      const xs = r.tick(t).map((i) => i.x).sort((a, b) => a - b)
      for (let k = 1; k < xs.length; k++) expect(xs[k] - xs[k - 1]).toBeGreaterThan(90)
    }
  })

  it('hai vật cùng chiều không chồng lên nhau ở mép vào', () => {
    const r = new LaneRunner({ ...lane, dir: 1, gap: [10, 20] }, 0, seeded(11))
    for (let t = 0; t <= 30_000; t += 100) {
      const xs = r.tick(t).map((i) => i.x).sort((a, b) => a - b)
      for (let k = 1; k < xs.length; k++) expect(xs[k] - xs[k - 1]).toBeGreaterThan(100)
    }
  })

  it('đường chéo: chân và cỡ đổi dần theo vị trí x, không phụ thuộc chiều đi', () => {
    const diag: LaneSpec = { ...lane, dir: 1, y: 700, y1: 400, s1: 0.4, x: [0, 1000] }
    const r = new LaneRunner(diag, 0, seeded(3))
    let seen = 0
    for (let t = 0; t <= 60_000; t += 100) {
      r.tick(t).forEach((i) => {
        const pos = i.x / 1000
        expect(i.y).toBeCloseTo(700 - 300 * pos, 5)
        expect(i.scale).toBeCloseTo(1 - 0.6 * pos, 5)
        seen++
      })
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('s0: cỡ đổi từ s0 ở x[0] tới s1 ở x[1]', () => {
    const grow: LaneSpec = { ...lane, dir: 1, y: 600, y1: 800, s0: 0.5, s1: 1, x: [0, 1000] }
    const r = new LaneRunner(grow, 0, seeded(3))
    let seen = 0
    for (let t = 0; t <= 60_000; t += 100) {
      r.tick(t).forEach((i) => {
        expect(i.scale).toBeCloseTo(0.5 + 0.5 * (i.x / 1000), 5)
        seen++
      })
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('exclusive: dir 0 chỉ đi một chiều cùng lúc, không xuyên qua nhau', () => {
    const ex: LaneSpec = { ...lane, dir: 0, exclusive: true, gap: [15_000, 40_000], maxActive: 6 }
    const r = new LaneRunner(ex, 0, seeded(13))
    let flips = 0
    let prevDir = 0
    for (let t = 0; t <= 1_200_000; t += 100) {
      const v = r.tick(t)
      const dirs = new Set(v.map((i) => i.dir))
      expect(dirs.size).toBeLessThanOrEqual(1)
      if (v.length) {
        const d = v[0].dir
        if (prevDir && d !== prevDir) flips++
        prevDir = d
      }
    }
    expect(flips).toBeGreaterThan(0)
  })

  it('mờ dần ở đầu ra khi khai fade', () => {
    const r = new LaneRunner({ ...lane, dir: 1, fade: [0, 300] }, 0, seeded(6))
    let sawFading = false
    for (let t = 0; t <= 60_000; t += 100) {
      r.tick(t).forEach((i) => {
        if (i.x > lane.x[1] - 150) {
          expect(i.alpha).toBeLessThan(1)
          sawFading = true
        }
      })
    }
    expect(sawFading).toBe(true)
  })
})

describe('sương', () => {
  const m: MistSpec = { x: [200, 1400], y: [300, 500], count: 4, alpha: 0.4, w: [300, 500], speed: [4, 9] }
  it('mọc ở mép phải, mờ ở hai mép, đậm tối đa bằng alpha', () => {
    const rnd = seeded(8)
    const p = spawnMist(m, rnd)
    expect(p.x).toBeGreaterThan(m.x[1])
    expect(mistAlpha(p, m)).toBe(0)
    const mid = { ...p, x: 800 }
    expect(mistAlpha(mid, m)).toBeCloseTo(0.4)
    expect(mistAlpha({ ...p, x: m.x[0] }, m)).toBe(0)
  })
})
