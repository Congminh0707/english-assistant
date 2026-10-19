import { describe, expect, it } from 'vitest'
import { ALL_VOICES, isKnownVoice, kokoroSpeed, UK_VOICES, US_VOICES } from './tts'

describe('tts helpers', () => {
  it('đổi tốc độ speechSynthesis sang speed của Kokoro, làm tròn và giới hạn', () => {
    expect(kokoroSpeed(0.9)).toBe(1)
    expect(kokoroSpeed(0.6)).toBe(0.67)
    expect(kokoroSpeed(0.8)).toBe(0.89)
    expect(kokoroSpeed(0.1)).toBe(0.5)
    expect(kokoroSpeed(5)).toBe(1.3)
  })

  it('giọng Mỹ/Anh tách đúng, id không trùng', () => {
    expect(US_VOICES.every((v) => v.accent === 'us' && v.id.startsWith('a'))).toBe(true)
    expect(UK_VOICES.every((v) => v.accent === 'uk' && v.id.startsWith('b'))).toBe(true)
    expect(new Set(ALL_VOICES.map((v) => v.id)).size).toBe(ALL_VOICES.length)
    expect(isKnownVoice('af_heart')).toBe(true)
    expect(isKnownVoice('xx_nobody')).toBe(false)
  })
})
