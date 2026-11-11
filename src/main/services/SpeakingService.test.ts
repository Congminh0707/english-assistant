import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import type { Lesson } from '@shared/schemas/lesson'
import type { SpeakingFeedback, SpeakingFeedbackInput } from '@shared/schemas/ai'
import type { SpeakingFeedbackRequest } from '@shared/schemas/speaking'
import type { TimedWord } from '@shared/speech'
import type { AiClient } from '../ai/AiClient'
import { createContainer } from '../container'
import { AppError } from '../core/AppError'
import { FakeClock } from '../core/Clock'
import { openUserDb } from '../db/client'
import { SpeakingService } from './SpeakingService'

const LESSON: Lesson = {
  id: 'respond.test',
  title: 'T',
  summary: 'S',
  level: 'A1_2',
  minutes: 5,
  blocks: [
    { type: 'text', md: 'x' },
    { type: 'tip', md: 'y' }
  ],
  exercises: [
    { type: 'respond', question: 'What is your name?', minWords: 4, sample: 'My name is Lan.' },
    { type: 'mcq', prompt: 'Q', choices: ['a', 'b'], answer: 0 },
    { type: 'speak', say: 'Hello.' }
  ]
}

const FEEDBACK = (overall: number): SpeakingFeedback => ({
  scores: { task: 3, grammar: 3, vocabulary: 3, fluency: 3 },
  overall,
  corrections: [],
  better_answer: 'My name is Lan.',
  tips_vi: ['Mẹo.']
})

/** Từ có mốc thời gian, cách đều 0,4 giây */
const timed = (text: string): TimedWord[] =>
  text.split(' ').map((word, i) => ({ word: ` ${word}`, start: i * 0.4, end: i * 0.4 + 0.3 }))

function make(opts: { enabled?: boolean; ready?: boolean; feedback?: SpeakingFeedback | Error }): {
  svc: SpeakingService
  calls: SpeakingFeedbackInput[]
} {
  const calls: SpeakingFeedbackInput[] = []
  const svc = new SpeakingService({
    ai: {
      status: () => ({
        enabled: opts.enabled ?? true,
        ready: opts.ready ?? true,
        provider: 'api',
        cliAvailable: false,
        cliState: 'unknown',
        cliCallsToday: 0,
        cliDailyLimit: 60,
        cliUnlimited: false,
        callsThisMonth: 0
      }),
      speakingFeedback: (input) => {
        calls.push(input)
        const v = opts.feedback
        return v instanceof Error || v === undefined
          ? Promise.reject(v ?? new Error('none'))
          : Promise.resolve(v)
      }
    },
    lessons: () => ({
      get: (id: string) => {
        if (id !== LESSON.id) throw new AppError('NOT_FOUND', 'errors.notFound')
        return LESSON
      }
    }),
    settings: { get: (() => 'A2_1') as never }
  })
  return { svc, calls }
}

const req = (
  text: string,
  extra: Partial<SpeakingFeedbackRequest> = {}
): SpeakingFeedbackRequest => ({
  kind: 'lesson',
  lessonId: LESSON.id,
  index: 0,
  transcript: text,
  words: timed(text),
  useAi: true,
  ...extra
})

describe('SpeakingService.feedback', () => {
  it('AI chấm: đạt khi overall ≥ 60; câu hỏi lấy từ nội dung bài, số liệu trôi chảy main tự tính', async () => {
    const pass = make({ feedback: FEEDBACK(60) })
    const out = await pass.svc.feedback(req('um my name is Minh'))
    expect(out).toMatchObject({ passed: true, gradedBy: 'ai', words: 4, aiReason: null })
    expect(out.fluency).toMatchObject({ wordCount: 4, fillers: 1, repetitions: 0 })
    expect(pass.calls).toHaveLength(1)
    expect(pass.calls[0]).toMatchObject({
      question: 'What is your name?',
      transcript: 'um my name is Minh',
      minWords: 4,
      level: 'A2_1'
    })
    expect(pass.calls[0].fluency).toEqual(out.fluency)
    const fail = make({ feedback: FEEDBACK(59) })
    expect(await fail.svc.feedback(req('my name is Minh'))).toMatchObject({
      passed: false,
      gradedBy: 'ai'
    })
  })

  it('không tin số liệu renderer: wpm/ngừng tính lại từ words[] (trường lạ bị bỏ qua)', async () => {
    const { svc, calls } = make({ feedback: FEEDBACK(80) })
    const words: TimedWord[] = [
      { word: 'my', start: 0, end: 0.2 },
      { word: 'name', start: 2, end: 2.3 },
      { word: 'is', start: 2.4, end: 2.5 },
      { word: 'Minh', start: 2.6, end: 3 }
    ]
    const out = await svc.feedback({
      ...req('my name is Minh'),
      words,
      ...({ fluency: { wpm: 999 } } as object)
    })
    expect(out.fluency).toMatchObject({ longPauses: 1, wpm: 80, speakingSec: 3 })
    expect(calls[0].fluency.wpm).toBe(80)
  })

  it('người học chọn chấm tại máy (useAi false) → không gọi AI dù AI bật, đạt theo số từ', async () => {
    const { svc, calls } = make({ feedback: FEEDBACK(90) })
    expect(await svc.feedback(req('my name is Minh', { useAi: false }))).toMatchObject({
      passed: true,
      gradedBy: 'local',
      feedback: null,
      aiReason: null
    })
    expect(await svc.feedback(req('I am Minh', { useAi: false }))).toMatchObject({
      passed: false,
      gradedBy: 'local'
    })
    expect(calls).toEqual([])
    const off = make({ enabled: true, ready: false })
    expect(await off.svc.feedback(req('my name is Minh', { useAi: false }))).toMatchObject({
      aiReason: 'errors.aiOff'
    })
  })

  it('AI tắt / hồ sơ trẻ em / hết lượt / bận / lỗi → chấm theo số từ, kèm lý do, không ném lỗi', async () => {
    const off = make({ enabled: false, feedback: FEEDBACK(90) })
    expect(await off.svc.feedback(req('my name is Minh'))).toMatchObject({
      passed: true,
      gradedBy: 'local',
      feedback: null,
      aiReason: 'errors.aiOff'
    })
    expect(off.calls).toEqual([])
    for (const [err, key] of [
      [new AppError('AI_LIMIT', 'errors.aiDailyLimit'), 'errors.aiDailyLimit'],
      [new AppError('AI_BUSY', 'errors.aiBusy'), 'errors.aiBusy'],
      [new AppError('FORBIDDEN', 'errors.aiOff'), 'errors.aiOff'],
      [new Error('boom'), 'errors.aiFailed']
    ] as const) {
      const m = make({ feedback: err })
      expect(await m.svc.feedback(req('my name is'))).toMatchObject({
        passed: false,
        gradedBy: 'local',
        words: 3,
        aiReason: key
      })
    }
  })

  it('chỉ số không trỏ tới bài respond hoặc lời nhận dạng chỉ có từ đệm → VALIDATION, không gọi AI', async () => {
    const { svc, calls } = make({ feedback: FEEDBACK(90) })
    await expect(svc.feedback({ ...req('hello there'), index: 1 })).rejects.toMatchObject({
      code: 'VALIDATION'
    })
    await expect(svc.feedback({ ...req('hello there'), index: 9 })).rejects.toMatchObject({
      code: 'VALIDATION'
    })
    await expect(svc.feedback(req('um... uh, hmm.'))).rejects.toMatchObject({
      code: 'VALIDATION'
    })
    expect(calls).toEqual([])
  })
})

describe('SpeakingService qua container (bài thật respond.about-me, SQLite in-memory, client AI giả)', () => {
  it('AI chấm qua AiService (đếm lượt, lời nhận dạng trong thẻ); chấm tại máy và AI tắt không gọi client', async () => {
    const calls: string[] = []
    const client: AiClient = {
      complete: async (r) => {
        calls.push(r.user)
        return JSON.stringify(FEEDBACK(72))
      }
    }
    const conn = openUserDb(':memory:', resolve('src/main/db/migrations'))
    try {
      const c = createContainer(conn, new FakeClock(Date.UTC(2026, 10, 11, 12)), {
        packsDir: resolve('content/.build/test-packs-unused'),
        ai: { getKey: () => 'sk-ant-test', client }
      })
      c.settings.set('ai.enabled', true)
      const lesson = c.lessons.get('respond.about-me')
      const index = lesson.exercises.findIndex((e) => e.type === 'respond')
      const ex = lesson.exercises[index]
      if (ex.type !== 'respond') throw new Error('bài respond.about-me phải có câu respond')
      const answer = 'My name is Nam and I am fifteen years old and I live in Hue'
      const at = {
        kind: 'lesson' as const,
        lessonId: 'respond.about-me',
        index,
        transcript: answer,
        words: timed(answer)
      }
      expect(await c.speaking.feedback({ ...at, useAi: true })).toMatchObject({
        passed: true,
        gradedBy: 'ai'
      })
      expect(calls[0]).toContain(`<question>${ex.question}</question>`)
      expect(calls[0]).toContain(`<transcript>${answer}</transcript>`)
      expect(c.ai.status().callsThisMonth).toBe(1)
      expect(await c.speaking.feedback({ ...at, useAi: false })).toMatchObject({
        gradedBy: 'local',
        aiReason: null
      })
      c.settings.set('ai.enabled', false)
      expect(await c.speaking.feedback({ ...at, useAi: true })).toMatchObject({
        passed: true,
        gradedBy: 'local',
        aiReason: 'errors.aiOff'
      })
      expect(calls).toHaveLength(1)
    } finally {
      conn.close()
    }
  })
})
