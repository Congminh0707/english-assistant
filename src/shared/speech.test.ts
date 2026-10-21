import { describe, expect, it } from 'vitest'
import { fluencyStats, normalizeSpeech, resampleTo16k, scoreSpeech } from './speech'

describe('normalizeSpeech', () => {
  it('bỏ dấu câu, giữ dấu nháy trong từ, số nhỏ đổi ra chữ', () => {
    expect(normalizeSpeech('  “Don’t go!” ')).toEqual(["don't", 'go'])
    expect(normalizeSpeech('I have 2 cats, 21 fish.')).toEqual([
      'i',
      'have',
      'two',
      'cats',
      '21',
      'fish'
    ])
    expect(normalizeSpeech('well-known')).toEqual(['well', 'known'])
  })
})

describe('scoreSpeech', () => {
  it('đúng hoàn toàn → 100, great', () => {
    const s = scoreSpeech('I think this is a good idea.', 'i think this is a good idea')
    expect(s.accuracy).toBe(100)
    expect(s.verdict).toBe('great')
    expect(s.words.every((w) => w.status === 'ok')).toBe(true)
  })

  it('đánh dấu từ sai, thiếu và thừa', () => {
    const s = scoreSpeech('She sells sea shells', 'she sell sea very shells')
    const by = (st: string): string[] => s.words.filter((w) => w.status === st).map((w) => w.word)
    expect(by('wrong')).toEqual(['sells'])
    expect(s.words.find((w) => w.status === 'wrong')?.heard).toBe('sell')
    expect(by('extra')).toEqual(['very'])
    expect(s.correctCount).toBe(3)
    expect(s.accuracy).toBeLessThan(80)
    const missing = scoreSpeech('I like apples very much', 'i like apples')
    expect(missing.words.filter((w) => w.status === 'missing').map((w) => w.word)).toEqual([
      'very',
      'much'
    ])
    expect(missing.verdict).toBe('retry')
  })

  it('từ dài lệch 1 ký tự vẫn tính đúng (sai số nhận dạng), từ ngắn thì không', () => {
    expect(scoreSpeech('beautiful', 'beautifull').accuracy).toBe(100)
    expect(scoreSpeech('cat', 'bat').accuracy).toBe(0)
  })

  it('không nói gì → 0 điểm; câu mẫu rỗng không gây lỗi', () => {
    expect(scoreSpeech('hello world', '').accuracy).toBe(0)
    expect(scoreSpeech('', 'hello').accuracy).toBe(0)
  })
})

describe('fluencyStats', () => {
  it('tính tốc độ nói và quãng ngừng dài', () => {
    const words = [
      { word: 'a', start: 0, end: 0.4 },
      { word: 'b', start: 0.5, end: 0.9 },
      { word: 'c', start: 2.0, end: 2.4 }
    ]
    expect(fluencyStats(words)).toEqual({ durationSec: 2.4, wpm: 75, longPauses: 1 })
    expect(fluencyStats([])).toEqual({ durationSec: 0, wpm: 0, longPauses: 0 })
  })
})

describe('resampleTo16k', () => {
  it('giữ nguyên ở 16 kHz, giảm số mẫu theo tỉ lệ khi lấy mẫu cao hơn', () => {
    const a = new Float32Array(16000)
    expect(resampleTo16k(a, 16000)).toBe(a)
    expect(resampleTo16k(new Float32Array(48000), 48000).length).toBe(16000)
    expect(resampleTo16k(new Float32Array(44100), 44100).length).toBe(16000)
  })
})
