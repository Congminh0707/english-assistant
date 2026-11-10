import { describe, expect, it } from 'vitest'
import { TOEIC_TTS_RATE, toeicAudioLines } from './toeicAudio'

describe('toeicAudioLines', () => {
  it('Part 1: đọc từng lựa chọn kèm chữ cái, giọng Mỹ', () => {
    const lines = toeicAudioLines({
      part: 1,
      script: null,
      questions: [
        {
          prompt: '',
          choices: ['He is reading.', 'He is eating.', 'He is sleeping.', 'He is running.']
        }
      ]
    })
    expect(lines).toEqual([
      { text: 'A. He is reading.', accent: 'us' },
      { text: 'B. He is eating.', accent: 'us' },
      { text: 'C. He is sleeping.', accent: 'us' },
      { text: 'D. He is running.', accent: 'us' }
    ])
  })

  it('Part 2: câu hỏi giọng Mỹ rồi ba lựa chọn giọng Anh', () => {
    const lines = toeicAudioLines({
      part: 2,
      script: 'Where is the meeting?',
      questions: [{ prompt: '', choices: ['In room 5.', 'At noon.', 'Yes, I did.'] }]
    })
    expect(lines).toEqual([
      { text: 'Where is the meeting?', accent: 'us' },
      { text: 'A. In room 5.', accent: 'uk' },
      { text: 'B. At noon.', accent: 'uk' },
      { text: 'C. Yes, I did.', accent: 'uk' }
    ])
  })

  it('Part 3: người nói xen kẽ Mỹ/Anh theo thứ tự xuất hiện, rồi các câu hỏi giọng Mỹ (không đọc lựa chọn)', () => {
    const lines = toeicAudioLines({
      part: 3,
      script: 'Man: Is the report ready?\nWoman: Almost.\n\nMan 2: I can help.\nMan: Thanks.',
      questions: [
        { prompt: 'What are they discussing?', choices: ['a', 'b', 'c', 'd'] },
        { prompt: '  ', choices: ['a', 'b', 'c', 'd'] },
        { prompt: 'Who offers help?', choices: ['a', 'b', 'c', 'd'] }
      ]
    })
    expect(lines).toEqual([
      { text: 'Is the report ready?', accent: 'us' },
      { text: 'Almost.', accent: 'uk' },
      { text: 'I can help.', accent: 'us' },
      { text: 'Thanks.', accent: 'us' },
      { text: 'What are they discussing?', accent: 'us' },
      { text: 'Who offers help?', accent: 'us' }
    ])
  })

  it('Part 4: bài nói không có tên người nói đọc từng dòng giọng Mỹ; tốc độ 0,95', () => {
    const lines = toeicAudioLines({
      part: 4,
      script: 'Welcome to the museum.\nThe tour starts at ten.',
      questions: [{ prompt: 'Where is the speaker?', choices: ['a', 'b', 'c', 'd'] }]
    })
    expect(lines).toEqual([
      { text: 'Welcome to the museum.', accent: 'us' },
      { text: 'The tour starts at ten.', accent: 'us' },
      { text: 'Where is the speaker?', accent: 'us' }
    ])
    expect(TOEIC_TTS_RATE).toBe(0.95)
  })

  it('Part 4: bài nói dài hơn 400 ký tự được tách theo câu thành các đoạn ≤ 400 ký tự, giữ thứ tự', () => {
    const sentence = 'Please remember to bring your badge to the front desk before nine.'
    const script = Array.from({ length: 12 }, () => sentence).join(' ')
    const lines = toeicAudioLines({
      part: 4,
      script,
      questions: [{ prompt: 'What should listeners bring?', choices: ['A', 'B', 'C', 'D'] }]
    })
    const talk = lines.slice(0, -1)
    expect(talk.length).toBeGreaterThan(1)
    for (const l of talk) {
      expect(l.text.length).toBeLessThanOrEqual(400)
      expect(l.accent).toBe('us')
    }
    expect(talk.map((l) => l.text).join(' ')).toBe(script)
    expect(lines.at(-1)).toEqual({ text: 'What should listeners bring?', accent: 'us' })
  })
})
