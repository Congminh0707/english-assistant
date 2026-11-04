import { describe, expect, it } from 'vitest'
import { pickWeather } from './sceneWeather'

describe('pickWeather', () => {
  it('đêm theo giờ máy', () => {
    expect(pickWeather(new Date(2026, 10, 1, 21), () => 0.9)).toBe('night')
    expect(pickWeather(new Date(2026, 10, 1, 3), () => 0.1)).toBe('night')
  })
  it('ban ngày chọn ngẫu nhiên mưa / nắng / quang', () => {
    const day = new Date(2026, 10, 1, 10)
    expect(pickWeather(day, () => 0.1)).toBe('rain')
    expect(pickWeather(day, () => 0.4)).toBe('sun')
    expect(pickWeather(day, () => 0.8)).toBe('clear')
  })
})
