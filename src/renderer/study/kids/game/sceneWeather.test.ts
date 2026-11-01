import { describe, expect, it } from 'vitest'
import { pickWeather } from './sceneWeather'

describe('pickWeather', () => {
  it('đêm theo giờ máy', () => {
    expect(pickWeather('hue', new Date(2026, 10, 1, 21))).toBe('night')
    expect(pickWeather('hue', new Date(2026, 10, 1, 3))).toBe('night')
  })
  it('ban ngày cố định trong cùng ngày và có đủ mưa / nắng / quang qua các nơi', () => {
    const day = new Date(2026, 10, 1, 10)
    const ids = Array.from({ length: 60 }, (_, i) => `p${i}`)
    const got = new Set(ids.map((id) => pickWeather(id, day)))
    expect(got).toEqual(new Set(['rain', 'sun', 'clear']))
    expect(pickWeather('p1', day)).toBe(pickWeather('p1', new Date(2026, 10, 1, 15)))
  })
})
