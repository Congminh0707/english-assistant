import {
  cefrLabel,
  estimateLevel,
  nextLevelIndex,
  PLACEMENT_QUESTIONS,
  PLACEMENT_START_INDEX
} from '@shared/placement'
import { LEVEL_CODES } from '@shared/schemas/content/level'
import type {
  PlacementAnswerResult,
  PlacementQuestion,
  PlacementResult
} from '@shared/schemas/placement'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { DictionaryService } from '../content/DictionaryService'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'

/** Bài kiểm tra bị bỏ nếu không có hoạt động sau thời gian này */
const SESSION_TTL_MS = 60 * 60_000

interface Pending {
  questionId: string
  wordId: string
  correctIndex: number
  correctText: string
}

interface Session {
  createdAt: number
  /** Bậc (0–11) của câu sắp hỏi */
  index: number
  askedWords: Set<string>
  askedLevels: number[]
  correct: number
  pending: Pending | null
}

/**
 * Bài kiểm tra đầu vào: 20 câu trắc nghiệm từ vựng, độ khó thích nghi (đúng → khó hơn, sai → dễ hơn).
 * Đáp án đúng chỉ nằm ở main. Kết thúc bài thì lưu trình độ ước lượng vào `learning.level`.
 */
export class PlacementService {
  private readonly sessions = new Map<string, Session>()
  private seq = 0

  constructor(
    private readonly deps: {
      dictionary: DictionaryService
      profiles: ProfileService
      settings: SettingsService
      clock: Clock
      random?: () => number
    }
  ) {}

  start(): PlacementQuestion | null {
    this.cleanup()
    const sessionId = `placement:${this.deps.clock.now()}:${++this.seq}`
    const session: Session = {
      createdAt: this.deps.clock.now(),
      index: PLACEMENT_START_INDEX,
      askedWords: new Set(),
      askedLevels: [],
      correct: 0,
      pending: null
    }
    this.sessions.set(sessionId, session)
    const question = this.ask(sessionId, session)
    if (!question) this.sessions.delete(sessionId)
    return question
  }

  answer(sessionId: string, questionId: string, choiceIndex: number | null): PlacementAnswerResult {
    const session = this.sessions.get(sessionId)
    const pending = session?.pending
    if (!session || !pending || pending.questionId !== questionId) {
      throw new AppError('NOT_FOUND', 'errors.notFound')
    }
    session.pending = null
    session.createdAt = this.deps.clock.now()
    const correct = choiceIndex === pending.correctIndex
    if (correct) session.correct++
    session.index = nextLevelIndex(session.index, correct)

    const next =
      session.askedLevels.length < PLACEMENT_QUESTIONS ? this.ask(sessionId, session) : null
    const result = next ? null : this.finish(sessionId, session)
    return {
      correct,
      correctIndex: pending.correctIndex,
      correctText: pending.correctText,
      next,
      result
    }
  }

  private ask(sessionId: string, session: Session): PlacementQuestion | null {
    const { dictionary, profiles } = this.deps
    const options = { childSafe: profiles.active().isChild }
    // Thử bậc hiện tại, rồi các bậc lân cận nếu hết từ ở bậc đó
    const order = [0, 1, -1, 2, -2]
      .map((d) => session.index + d)
      .filter((i) => i >= 0 && i < LEVEL_CODES.length)
    for (const index of order) {
      const entry = dictionary.randomWord([LEVEL_CODES[index]], session.askedWords, options)
      if (!entry) continue
      const data = dictionary.quizData(entry.id, options)
      if (!data || data.distractors.length < 2) {
        session.askedWords.add(entry.id)
        continue
      }
      const choices = this.shuffle([data.correct, ...data.distractors])
      const questionId = `${sessionId}:q${session.askedLevels.length + 1}`
      session.askedWords.add(entry.id)
      session.askedLevels.push(index)
      session.index = index
      session.pending = {
        questionId,
        wordId: entry.id,
        correctIndex: choices.indexOf(data.correct),
        correctText: data.correct
      }
      return {
        sessionId,
        id: questionId,
        index: session.askedLevels.length,
        total: PLACEMENT_QUESTIONS,
        lemma: entry.lemma,
        ipa: entry.ipaUs ?? entry.ipaUk,
        choices
      }
    }
    return null
  }

  private finish(sessionId: string, session: Session): PlacementResult {
    this.sessions.delete(sessionId)
    const level = estimateLevel(session.askedLevels, session.index)
    this.deps.settings.set('learning.level', level)
    return {
      level,
      cefr: cefrLabel(level),
      correct: session.correct,
      total: session.askedLevels.length
    }
  }

  private shuffle<T>(items: T[]): T[] {
    const rnd = this.deps.random ?? Math.random
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  private cleanup(): void {
    const now = this.deps.clock.now()
    for (const [id, s] of this.sessions)
      if (now - s.createdAt > SESSION_TTL_MS) this.sessions.delete(id)
  }
}
