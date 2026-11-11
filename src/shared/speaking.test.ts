import { describe, expect, it } from 'vitest'
import { SpeakingFeedbackRequestSchema } from './schemas/speaking'
import {
  boundAnswer,
  RESPOND_MAX_CHARS,
  RESPOND_MAX_TIME_SEC,
  RESPOND_MAX_WORDS,
  RESPOND_PASS,
  respondVerdict
} from './speaking'
import { answerFluency, fluencyStats, spokenWordCount, type TimedWord } from './speech'

/** Từ cách đều nhau: mỗi từ 0,3 giây, nghỉ `gap` giây (ghi đè quãng nghỉ trước từ thứ i bằng `gaps[i]`) */
function timed(text: string, gaps: Record<number, number> = {}): TimedWord[] {
  let t = 0.2
  return text.split(' ').map((word, i) => {
    t += gaps[i] ?? 0.1
    const w = { word: ` ${word}`, start: t, end: t + 0.3 }
    t += 0.3
    return w
  })
}

describe('spokenWordCount', () => {
  it('bỏ dấu câu và từ đệm um/uh/er/erm/hmm, giữ like/so/well', () => {
    expect(spokenWordCount('Um, I like, uh, football. Hmm… so well!')).toBe(5)
    expect(spokenWordCount('   ')).toBe(0)
    expect(spokenWordCount("I don't know")).toBe(3)
  })
})

describe('answerFluency', () => {
  it('không có từ / quá ít từ → không đo tốc độ, ngừng, thời lượng (null), vẫn đếm từ', () => {
    expect(answerFluency([])).toEqual({
      wordCount: 0,
      speakingSec: null,
      wpm: null,
      longPauses: null,
      repetitions: 0,
      fillers: 0
    })
    expect(answerFluency(timed('Yes please'))).toMatchObject({ wordCount: 2, wpm: null })
  })

  it('tốc độ, quãng ngừng dài, thời lượng lấy đúng từ fluencyStats (cùng quy tắc > 0,8 s)', () => {
    const words = timed('I live in Hue with my family', { 3: 1.2, 5: 0.81 })
    const base = fluencyStats(words)
    expect(answerFluency(words)).toMatchObject({
      wordCount: 7,
      speakingSec: base.durationSec,
      wpm: base.wpm,
      longPauses: 2
    })
  })

  it('đếm từ đệm và lặp từ liền nhau sau chuẩn hoá (token Whisper có khoảng trắng, dấu câu, hoa thường)', () => {
    const words: TimedWord[] = [
      { word: ' I', start: 0, end: 0.2 },
      { word: ' I,', start: 0.3, end: 0.5 },
      { word: ' um,', start: 0.6, end: 0.8 },
      { word: ' went', start: 0.9, end: 1.1 },
      { word: ' Went', start: 1.2, end: 1.4 },
      { word: ' to', start: 1.5, end: 1.6 },
      { word: ' uh', start: 1.7, end: 1.8 },
      { word: ' school.', start: 1.9, end: 2.3 }
    ]
    expect(answerFluency(words)).toMatchObject({ wordCount: 6, fillers: 2, repetitions: 2 })
  })
})

describe('respondVerdict', () => {
  it('có AI: theo overall ≥ RESPOND_PASS; không AI: đủ minWords', () => {
    expect(RESPOND_PASS).toBe(60)
    expect(respondVerdict(2, 5, { overall: 60 })).toBe(true)
    expect(respondVerdict(20, 5, { overall: 59 })).toBe(false)
    expect(respondVerdict(5, 5, null)).toBe(true)
    expect(respondVerdict(4, 5, null)).toBe(false)
  })
})

describe('boundAnswer + SpeakingFeedbackRequestSchema', () => {
  const at = { kind: 'lesson' as const, lessonId: 'respond.me', index: 2, useAi: true }

  it('lời nhận dạng lặp vòng quá dài / mốc thời gian hỏng → cắt về trong giới hạn, schema nhận', () => {
    const words: TimedWord[] = Array.from({ length: 260 }, (_, i) => ({
      word: i === 0 ? 'x'.repeat(80) : ' again',
      start: i === 1 ? Number.NaN : i * 0.2,
      end: i === 2 ? -1 : i * 0.2 + 0.1
    }))
    const b = boundAnswer('again '.repeat(400), words)
    expect(b.transcript.length).toBeLessThanOrEqual(RESPOND_MAX_CHARS)
    expect(b.words).toHaveLength(RESPOND_MAX_WORDS)
    expect(b.words.every((w) => w.end >= w.start && w.end <= RESPOND_MAX_TIME_SEC)).toBe(true)
    expect(SpeakingFeedbackRequestSchema.safeParse({ ...at, ...b }).success).toBe(true)
  })

  it('schema chặn dữ liệu vượt giới hạn (main không tin renderer)', () => {
    const ok = { ...at, transcript: 'I am Lan', words: timed('I am Lan') }
    expect(SpeakingFeedbackRequestSchema.safeParse(ok).success).toBe(true)
    const bad = [
      { ...ok, transcript: 'a'.repeat(RESPOND_MAX_CHARS + 1) },
      { ...ok, transcript: '   ' },
      { ...ok, words: Array.from({ length: RESPOND_MAX_WORDS + 1 }, () => ok.words[0]) },
      { ...ok, words: [{ word: 'x'.repeat(41), start: 0, end: 1 }] },
      { ...ok, words: [{ word: 'x', start: 2, end: 1 }] },
      { ...ok, words: [{ word: 'x', start: -1, end: 1 }] },
      { ...ok, words: [{ word: 'x', start: 0, end: Number.POSITIVE_INFINITY }] },
      { ...ok, words: [{ word: 'x', start: 0, end: RESPOND_MAX_TIME_SEC + 1 }] },
      { ...ok, useAi: undefined }
    ]
    for (const input of bad)
      expect(SpeakingFeedbackRequestSchema.safeParse(input).success).toBe(false)
  })
})
