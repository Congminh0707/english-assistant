import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import type { Lesson } from '@shared/schemas/lesson'
import type { TranslationCheck, WritingFeedback } from '@shared/schemas/ai'
import type { AiClient } from '../ai/AiClient'
import { createContainer } from '../container'
import { AppError } from '../core/AppError'
import { FakeClock } from '../core/Clock'
import { openUserDb } from '../db/client'
import { WritingService } from './WritingService'

const LESSON: Lesson = {
  id: 'write.test',
  title: 'T',
  summary: 'S',
  level: 'A1_2',
  minutes: 5,
  blocks: [
    { type: 'text', md: 'x' },
    { type: 'tip', md: 'y' }
  ],
  exercises: [
    { type: 'translate', vi: 'Tôi là học sinh.', answers: ['I am a student.'] },
    { type: 'write', prompt: 'Viết về bạn.', minWords: 3, maxWords: 6, sample: 'I am Lan.' },
    { type: 'mcq', prompt: 'Q', choices: ['a', 'b'], answer: 0 }
  ]
}

const FEEDBACK = (overall: number): WritingFeedback => ({
  scores: { task: 3, grammar: 3, vocabulary: 3, coherence: 3 },
  overall,
  corrections: [],
  improved_version: 'Better.',
  tips_vi: ['Mẹo.']
})

function make(opts: {
  enabled?: boolean
  translation?: TranslationCheck | Error
  feedback?: WritingFeedback | Error
}): { svc: WritingService; calls: string[] } {
  const calls: string[] = []
  const reply = <T>(v: T | Error | undefined): Promise<T> =>
    v instanceof Error || v === undefined
      ? Promise.reject(v ?? new Error('none'))
      : Promise.resolve(v)
  const svc = new WritingService({
    ai: {
      status: () => ({
        enabled: opts.enabled ?? true,
        ready: true,
        provider: 'api',
        cliAvailable: false,
        cliState: 'unknown',
        cliCallsToday: 0,
        cliDailyLimit: 30,
        callsThisMonth: 0
      }),
      checkTranslation: (input) => {
        calls.push(`translate:${input.level}:${input.text}`)
        return reply(opts.translation)
      },
      writingFeedback: (input) => {
        calls.push(`write:${input.level}:${input.minWords}-${input.maxWords}`)
        return reply(opts.feedback)
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

const ref = (index: number): { kind: 'lesson'; lessonId: string; index: number } => ({
  kind: 'lesson',
  lessonId: LESSON.id,
  index
})

describe('WritingService.checkTranslation', () => {
  it('khớp đáp án mẫu (kể cả viết tắt) → đúng, không gọi AI', async () => {
    const { svc, calls } = make({ translation: { ok: false, corrected: '', note_vi: '' } })
    const out = await svc.checkTranslation({ ...ref(0), text: "I'm a student" })
    expect(out).toEqual({
      correct: true,
      gradedBy: 'match',
      corrected: null,
      note: null,
      aiReason: null
    })
    expect(calls).toEqual([])
  })

  it('không khớp + AI dùng được → theo AI (kèm bản sửa, nhận xét; trình độ từ cài đặt)', async () => {
    const { svc, calls } = make({
      translation: { ok: true, corrected: 'I am a pupil.', note_vi: 'Đúng nghĩa.' }
    })
    const out = await svc.checkTranslation({ ...ref(0), text: 'I am a pupil.' })
    expect(out).toEqual({
      correct: true,
      gradedBy: 'ai',
      corrected: 'I am a pupil.',
      note: 'Đúng nghĩa.',
      aiReason: null
    })
    expect(calls).toEqual(['translate:A2_1:I am a pupil.'])
  })

  it('AI tắt → sai, lý do errors.aiOff, không gọi AI', async () => {
    const { svc, calls } = make({ enabled: false })
    const out = await svc.checkTranslation({ ...ref(0), text: 'I am pupil.' })
    expect(out).toMatchObject({ correct: false, gradedBy: 'local', aiReason: 'errors.aiOff' })
    expect(calls).toEqual([])
  })

  it('AI lỗi (hết lượt, lỗi khác) → sai, lý do theo lỗi, không ném lỗi', async () => {
    const limit = make({ translation: new AppError('AI_LIMIT', 'errors.aiDailyLimit') })
    expect(await limit.svc.checkTranslation({ ...ref(0), text: 'x y' })).toMatchObject({
      correct: false,
      gradedBy: 'local',
      aiReason: 'errors.aiDailyLimit'
    })
    const other = make({ translation: new Error('boom') })
    expect(await other.svc.checkTranslation({ ...ref(0), text: 'x y' })).toMatchObject({
      aiReason: 'errors.aiFailed'
    })
  })

  it('chỉ số không trỏ tới câu dịch → VALIDATION', async () => {
    const { svc } = make({})
    await expect(svc.checkTranslation({ ...ref(2), text: 'x' })).rejects.toMatchObject({
      code: 'VALIDATION'
    })
    await expect(svc.checkTranslation({ ...ref(9), text: 'x' })).rejects.toMatchObject({
      code: 'VALIDATION'
    })
  })
})

describe('WritingService.feedback', () => {
  it('AI chấm: đạt khi overall ≥ 60, trượt khi thấp hơn; số từ min/max của bài gửi kèm', async () => {
    const pass = make({ feedback: FEEDBACK(60) })
    expect(await pass.svc.feedback({ ...ref(1), text: 'I am Minh here.' })).toMatchObject({
      passed: true,
      gradedBy: 'ai',
      words: 4,
      aiReason: null
    })
    expect(pass.calls).toEqual(['write:A2_1:3-6'])
    const fail = make({ feedback: FEEDBACK(59) })
    expect(await fail.svc.feedback({ ...ref(1), text: 'I am Minh here.' })).toMatchObject({
      passed: false,
      gradedBy: 'ai'
    })
  })

  it('AI tắt hoặc lỗi → đạt theo số từ, feedback null, kèm lý do', async () => {
    const off = make({ enabled: false })
    expect(await off.svc.feedback({ ...ref(1), text: 'I am Minh.' })).toEqual({
      passed: true,
      gradedBy: 'local',
      words: 3,
      feedback: null,
      aiReason: 'errors.aiOff'
    })
    expect(off.calls).toEqual([])
    const busy = make({ feedback: new AppError('AI_BUSY', 'errors.aiBusy') })
    expect(await busy.svc.feedback({ ...ref(1), text: 'I am Minh.' })).toMatchObject({
      passed: true,
      gradedBy: 'local',
      aiReason: 'errors.aiBusy'
    })
  })

  it('thiếu hoặc thừa số từ → VALIDATION, không gọi AI', async () => {
    const { svc, calls } = make({ feedback: FEEDBACK(90) })
    await expect(svc.feedback({ ...ref(1), text: 'Too short' })).rejects.toMatchObject({
      code: 'VALIDATION'
    })
    await expect(
      svc.feedback({ ...ref(1), text: 'one two three four five six seven' })
    ).rejects.toMatchObject({ code: 'VALIDATION' })
    expect(calls).toEqual([])
  })
})

describe('WritingService qua container (bài thật write.about-me, SQLite in-memory, client AI giả)', () => {
  it('khớp → không gọi AI; không khớp → AI, tính vào bộ đếm lượt; AI tắt → chấm theo số từ', async () => {
    const calls: string[] = []
    const client: AiClient = {
      complete: async (req) => {
        calls.push(req.user)
        return req.user.includes('<writing>')
          ? JSON.stringify(FEEDBACK(75))
          : JSON.stringify({ ok: false, corrected: 'I am Nam.', note_vi: 'Sai nghĩa.' })
      }
    }
    const conn = openUserDb(':memory:', resolve('src/main/db/migrations'))
    try {
      const c = createContainer(conn, new FakeClock(Date.UTC(2026, 10, 11, 12)), {
        packsDir: resolve('content/.build/test-packs-unused'),
        ai: { getKey: () => 'sk-ant-test', client }
      })
      c.settings.set('ai.enabled', true)
      const at = (index: number): { kind: 'lesson'; lessonId: string; index: number } => ({
        kind: 'lesson',
        lessonId: 'write.about-me',
        index
      })
      // bài tập #3 (index 2): "Tôi tên là Nam."
      expect(await c.writing.checkTranslation({ ...at(2), text: "i'm nam" })).toMatchObject({
        correct: true,
        gradedBy: 'match'
      })
      expect(calls).toHaveLength(0)
      expect(await c.writing.checkTranslation({ ...at(2), text: 'I is Nam.' })).toMatchObject({
        correct: false,
        gradedBy: 'ai',
        corrected: 'I am Nam.'
      })
      expect(calls[0]).toContain('<translation>I is Nam.</translation>')
      expect(c.ai.status().callsThisMonth).toBe(1)
      const essay = 'My name is Nam. I am fifteen years old. I live in Da Nang and I like football.'
      expect(await c.writing.feedback({ ...at(7), text: essay })).toMatchObject({
        passed: true,
        gradedBy: 'ai'
      })
      c.settings.set('ai.enabled', false)
      expect(await c.writing.feedback({ ...at(7), text: essay })).toMatchObject({
        passed: true,
        gradedBy: 'local',
        feedback: null,
        aiReason: 'errors.aiOff'
      })
      expect(calls).toHaveLength(2)
    } finally {
      conn.close()
    }
  })
})
