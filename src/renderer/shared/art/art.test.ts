import { describe, expect, it, vi } from 'vitest'
import { ALL_PICTURE_IDS } from '@shared/pictures'
import type { Painter } from './kit'

// Test chạy trong Node (không có canvas): giả Path2D + context ghi lại lệnh, đủ để bắt lỗi lúc vẽ
// (màu sai dạng, gọi hàm không có…). Xem hình thật bằng `pnpm pictures:sheet`.
const noop = (): undefined => undefined
// Path2D giả: mọi phương thức (moveTo, ellipse, bezierCurveTo…) đều nhận và bỏ qua
vi.stubGlobal('Path2D', function FakePath() {
  return new Proxy({}, { get: () => noop })
})

function fakeContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: noop }
  return new Proxy({} as Record<string, unknown>, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient
      return noop
    },
    set(target, key: string, value) {
      target[key] = value
      return true
    }
  }) as unknown as CanvasRenderingContext2D
}

const modules = import.meta.glob<{ PICTURES: Record<string, Painter> }>('./pictures/*.ts', {
  eager: true
})

describe('hình từ vector', () => {
  const entries = Object.entries(modules).flatMap(([file, m]) =>
    Object.keys(m.PICTURES).map((id) => [file, id])
  )

  it('không trùng id giữa các file', () => {
    const seen = new Map<string, string>()
    const dup = entries.filter(([file, id]) => {
      const prev = seen.get(id)
      seen.set(id, file)
      return prev !== undefined
    })
    expect(dup).toEqual([])
  })

  it('mọi id là hình có trong danh sách hình từ', () => {
    const known = new Set(ALL_PICTURE_IDS)
    expect(entries.map(([, id]) => id).filter((id) => !known.has(id))).toEqual([])
  })

  it('mọi hình vẽ chạy không lỗi', () => {
    for (const m of Object.values(modules)) {
      for (const [id, paint] of Object.entries(m.PICTURES)) {
        expect(() => paint(fakeContext()), id).not.toThrow()
      }
    }
  })
})

describe('bản đồ của bé', () => {
  it('mọi từ trên bản đồ đều có hình vector', () => {
    const places = import.meta.glob<{ words: { picture: string }[] }>(
      '../../../../content/curated/kids/world/places/*.json',
      { eager: true, import: 'default' }
    )
    const drawn = new Set(Object.values(modules).flatMap((m) => Object.keys(m.PICTURES)))
    const words = Object.values(places).flatMap((p) => p.words.map((w) => w.picture))
    expect(words.length).toBeGreaterThan(0)
    expect(words.filter((id) => !drawn.has(id))).toEqual([])
  })
})
