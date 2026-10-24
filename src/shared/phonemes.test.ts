import { describe, expect, it } from 'vitest'
import { PHONEME_TIP_IDS, phonemeTipId, samePhoneme, scorePhonemes, tokenizeIpa } from './phonemes'

const TOKENS = [
  'θ',
  'ɪ',
  'ŋ',
  'k',
  'ʃ',
  'iː',
  'p',
  'ɹ',
  'aɪ',
  't',
  'tʃ',
  'dʒ',
  'ð',
  'ə',
  's',
  'f',
  'ɑː',
  'e'
]

describe('tokenizeIpa', () => {
  it('bỏ trọng âm, khớp âm dài nhất trước (aɪ, tʃ, iː)', () => {
    expect(tokenizeIpa('θˈɪŋk', TOKENS)).toEqual(['θ', 'ɪ', 'ŋ', 'k'])
    expect(tokenizeIpa('ɹˈaɪt', TOKENS)).toEqual(['ɹ', 'aɪ', 't'])
    expect(tokenizeIpa('ʃˈiːp', TOKENS)).toEqual(['ʃ', 'iː', 'p'])
    expect(tokenizeIpa('tʃˈɑː', TOKENS)).toEqual(['tʃ', 'ɑː'])
  })

  it('nhiều từ: bỏ khoảng trắng và ký tự lạ', () => {
    expect(tokenizeIpa('ðə kˈɪk!', TOKENS)).toEqual(['ð', 'ə', 'k', 'ɪ', 'k'])
  })
})

describe('samePhoneme', () => {
  it('tương đương theo bộ ký hiệu, không phân biệt độ dài', () => {
    expect(samePhoneme('ɹ', 'r')).toBe(true)
    expect(samePhoneme('iː', 'i')).toBe(true)
    expect(samePhoneme('ɜː', 'ə')).toBe(false)
    expect(samePhoneme('θ', 'f')).toBe(false)
  })
})

describe('scorePhonemes', () => {
  it('đúng hết → 100, great', () => {
    const s = scorePhonemes(['ʃ', 'iː', 'p'], ['ʃ', 'iː', 'p'])
    expect(s.accuracy).toBe(100)
    expect(s.verdict).toBe('great')
  })

  it('think nói thành f ɪ ŋ k ə: θ sai (nghe được f), âm đệm ə cuối không bị phạt nặng', () => {
    const s = scorePhonemes(['θ', 'ɪ', 'ŋ', 'k'], ['f', 'ɪ', 'ŋ', 'k', 'ə'])
    const first = s.phonemes[0]
    expect(first).toEqual({ phoneme: 'θ', status: 'wrong', heard: 'f', near: true })
    expect(s.correctCount).toBe(3)
    // 3 âm đúng + 0,3 điểm cho θ→f (kiểu thay âm quen thuộc) = 3,3/4
    expect(s.accuracy).toBe(83)
    expect(s.verdict).toBe('good')
  })

  it('thay âm lạ (θ → m) không được điểm gần đúng, còn kiểu Việt (ð → d) thì có', () => {
    const odd = scorePhonemes(['θ', 'ɪ', 'ŋ', 'k'], ['m', 'ɪ', 'ŋ', 'k'])
    expect(odd.phonemes[0].near).toBeUndefined()
    expect(odd.accuracy).toBe(75)
    const near = scorePhonemes(['ð', 'æ', 't'], ['d', 'æ', 't'])
    expect(near.phonemes[0].near).toBe(true)
    expect(near.accuracy).toBeGreaterThan(odd.accuracy - 1)
    expect(near.accuracy).toBeLessThan(100)
  })

  it('thiếu âm cuối (cats → k æ) và âm thừa có hại', () => {
    const missing = scorePhonemes(['k', 'æ', 't', 's'], ['k', 'æ'])
    expect(missing.phonemes.filter((p) => p.status === 'missing').map((p) => p.phoneme)).toEqual([
      't',
      's'
    ])
    expect(missing.verdict).toBe('retry')
    const extra = scorePhonemes(['k', 'æ', 't'], ['k', 'æ', 't', 's'])
    expect(extra.phonemes.at(-1)).toEqual({ phoneme: 's', status: 'extra' })
    expect(extra.accuracy).toBeLessThan(100)
  })

  it('âm đệm vô hại (ʔ, j) không làm tụt điểm', () => {
    expect(scorePhonemes(['b', 'iː'], ['b', 'iː', 'j']).accuracy).toBe(100)
    expect(scorePhonemes(['eɪ'], ['ʔ', 'eɪ']).accuracy).toBe(100)
  })

  it('không nói gì → 0; mong đợi rỗng không lỗi', () => {
    expect(scorePhonemes(['θ'], []).accuracy).toBe(0)
    expect(scorePhonemes([], ['a']).accuracy).toBe(0)
  })
})

describe('mẹo phát âm', () => {
  it('âm hay sai có mã mẹo, mọi mã nằm trong danh sách', () => {
    expect(phonemeTipId('θ')).toBe('theta')
    expect(phonemeTipId('iː')).toBe('ee')
    expect(phonemeTipId('ɜː')).toBe('er')
    expect(phonemeTipId('ʔ')).toBeNull()
    for (const p of [
      'θ',
      'ð',
      'ʃ',
      'ʒ',
      'tʃ',
      'dʒ',
      'ɹ',
      'l',
      'ŋ',
      'ɪ',
      'iː',
      'æ',
      'ʌ',
      'ɔː',
      'ʊ',
      'uː',
      'ɜː',
      'ə',
      's',
      'z',
      't',
      'd',
      'k',
      'p',
      'v',
      'f'
    ]) {
      expect(PHONEME_TIP_IDS).toContain(phonemeTipId(p))
    }
  })
})
