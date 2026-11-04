import { describe, expect, it } from 'vitest'
import {
  ActorScheduler,
  GAP_MIN,
  MAX_PLAYING,
  START_GAP_MIN,
  sequence,
  spawnLeaf,
  stepLeaf
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
