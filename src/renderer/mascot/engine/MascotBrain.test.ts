import { afterEach, describe, expect, it, vi } from 'vitest'
import { MascotBrain } from './MascotBrain'
import type { SpriteAnimator } from './SpriteAnimator'

// Hoạt ảnh riêng của từng nhân vật (click_*, quirk_*) phải được MascotBrain tự nhận từ sheet đang dùng.

function fakeAnimator(names: string[]): {
  animator: SpriteAnimator
  played: string[]
  finish: (name: string) => void
} {
  const played: string[] = []
  const fake = {
    onFinish: null as null | ((name: string) => void),
    play: (name: string) => void played.push(name),
    names: () => names
  }
  return {
    animator: fake as unknown as SpriteAnimator,
    played,
    finish: (name) => fake.onFinish?.(name)
  }
}

const BASE = ['idle', 'walk', 'drag', 'fall', 'land', 'happy', 'eat', 'sleep', 'love']
const brain = (
  names: string[]
): { b: MascotBrain; played: string[]; finish: (n: string) => void } => {
  const f = fakeAnimator(names)
  const b = new MascotBrain(
    f.animator,
    () => Promise.resolve({ blocked: null }) as never,
    () => undefined,
    1
  )
  return { b, played: f.played, finish: f.finish }
}

afterEach(() => vi.restoreAllMocks())

describe('MascotBrain: phản ứng khi bấm', () => {
  it('có click_* riêng trong sheet thì nằm trong các phản ứng được chọn cùng happy/love', () => {
    const states = new Set<string>()
    for (const roll of [0.01, 0.2, 0.3, 0.45, 0.6, 0.75, 0.9, 0.99]) {
      vi.spyOn(Math, 'random').mockReturnValue(roll)
      const { b } = brain([...BASE, 'click_spidey', 'click_flip'])
      b.pointerUp(true, false)
      states.add(b.state)
      vi.restoreAllMocks()
    }
    expect(states).toEqual(new Set(['happy', 'love', 'click_spidey', 'click_flip']))
  })

  it('sheet không có click_* thì chỉ happy/love; đang ngủ thì vẫn ngủ', () => {
    const states = new Set<string>()
    for (const roll of [0.01, 0.4, 0.6, 0.99]) {
      vi.spyOn(Math, 'random').mockReturnValue(roll)
      const { b } = brain(BASE)
      b.pointerUp(true, false)
      states.add(b.state)
      vi.restoreAllMocks()
    }
    expect(states).toEqual(new Set(['happy', 'love']))

    const { b } = brain([...BASE, 'click_flip'])
    b.setSleeping(true)
    b.pointerUp(true, false)
    expect(b.state).toBe('sleep')
  })

  it('phản ứng click_* chạy xong thì quay về idle', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const { b, finish } = brain([...BASE, 'click_flip'])
    b.pointerUp(true, false)
    expect(b.state).toBe('click_flip')
    finish('click_flip')
    expect(b.state).toBe('idle')
  })
})

describe('MascotBrain: động tác tự chơi đặc trưng', () => {
  it('quirk_* của sheet được chọn khi rảnh và kết thúc thì về idle', () => {
    // 0.1 < FIDGET_CHANCE → làm một động tác tự chơi; 0.999 → chọn phần tử cuối danh sách (quirk)
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.1)
      .mockReturnValue(0.999)
    const { b, finish } = brain([...BASE, 'quirk_web', 'quirk_hero'])
    b.tick(1000)
    expect(b.state).toBe('quirk_hero')
    finish('quirk_hero')
    expect(b.state).toBe('idle')
  })
})
