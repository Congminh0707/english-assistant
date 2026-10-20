import {
  DICTATION_PASS,
  dictationAccuracy,
  isPermutation,
  normalizeWords,
  sameSentence
} from '@shared/practice'
import { practiceLevels } from '@shared/learning'
import { practiceKindSkill } from '@shared/progress'
import type { LevelCode } from '@shared/schemas/content/level'
import {
  EXERCISE_KINDS,
  type Exercise,
  type ExerciseKind,
  type PracticeAnswer,
  type PracticeAnswerResult,
  type PracticeSummary
} from '@shared/schemas/practice'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { startOfLocalDay } from '../core/localDay'
import type { DictionaryService } from '../content/DictionaryService'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { ProgressService } from './ProgressService'
import type { SettingsService } from './SettingsService'
import type { XpService } from './XpService'

/** Số bài mỗi phiên */
export const SESSION_SIZE = 10
/** Chỉ 5 phiên mỗi ngày được thưởng XP (chống cày) */
export const REWARDED_SESSIONS_PER_DAY = 5
export const PRACTICE_REASON = 'exercise.session'
const SESSION_TTL_MS = 60 * 60_000
/** Từ có freqRank ≤ ngưỡng này (a, the, to...) không bị khuyết trong bài điền từ */
const STOPWORD_RANK = 100

type ExerciseBody = Exercise extends infer E
  ? E extends Exercise
    ? Omit<E, 'sessionId' | 'id' | 'index' | 'total'>
    : never
  : never

/** Đáp án đúng giữ ở main, theo từng dạng bài */
type Pending =
  | { kind: 'cloze'; correctIndex: number; solution: string }
  | { kind: 'listen_choice'; correctIndex: number; solution: string }
  | { kind: 'word_order'; tokens: string[]; sentence: string; solution: string }
  | { kind: 'dictation'; sentence: string; solution: string }
  | { kind: 'match_pairs'; mapping: number[]; solution: string }

interface Built {
  body: ExerciseBody
  pending: Pending
}

interface Session {
  createdAt: number
  plan: ExerciseKind[]
  asked: number
  correct: number
  usedSentences: Set<string>
  usedWords: Set<string>
  pending: { id: string; data: Pending } | null
}

/**
 * Luyện tập: phiên 10 bài sinh từ câu Tatoeba (có bản dịch tiếng Việt) và từ vựng đúng trình độ —
 * điền từ, sắp xếp câu, nghe chọn nghĩa, nghe chép, ghép cặp. Đáp án chỉ nằm ở main; chấm ở main.
 * Xong phiên được thưởng XP/xu (tối đa 5 phiên/ngày). docs/07-learning-modules.md
 */
export class PracticeService {
  private readonly sessions = new Map<string, Session>()
  private seq = 0

  constructor(
    private readonly deps: {
      dictionary: DictionaryService
      profiles: ProfileService
      settings: SettingsService
      xp: XpService
      xpRepo: XpRepository
      progress?: ProgressService
      clock: Clock
      random?: () => number
    }
  ) {}

  start(mode: 'mixed' | ExerciseKind): Exercise | null {
    this.cleanup()
    const sessionId = `practice:${this.deps.clock.now()}:${++this.seq}`
    const plan = Array.from({ length: SESSION_SIZE }, (_, i) =>
      mode === 'mixed'
        ? EXERCISE_KINDS[(i + Math.floor(this.rnd() * 5)) % EXERCISE_KINDS.length]
        : mode
    )
    const session: Session = {
      createdAt: this.deps.clock.now(),
      plan,
      asked: 0,
      correct: 0,
      usedSentences: new Set(),
      usedWords: new Set(),
      pending: null
    }
    this.sessions.set(sessionId, session)
    const exercise = this.nextExercise(sessionId, session)
    if (!exercise) {
      this.sessions.delete(sessionId)
      console.warn(
        `[practice] không sinh được bài (mode=${mode}, level=${this.deps.settings.get('learning.level')}, dictionary=${this.deps.dictionary.available()})`
      )
    }
    return exercise
  }

  answer(sessionId: string, exerciseId: string, answer: PracticeAnswer): PracticeAnswerResult {
    const session = this.sessions.get(sessionId)
    const pending = session?.pending
    if (!session || !pending || pending.id !== exerciseId || pending.data.kind !== answer.kind) {
      throw new AppError('NOT_FOUND', 'errors.notFound')
    }
    session.pending = null
    session.createdAt = this.deps.clock.now()

    const { correct, accuracy } = this.check(pending.data, answer)
    if (correct) session.correct++
    this.deps.progress?.record({
      source: 'practice',
      kind: pending.data.kind,
      skill: practiceKindSkill(pending.data.kind),
      level: this.deps.settings.get('learning.level'),
      correct: correct ? 1 : 0,
      total: 1
    })

    const next = session.asked < session.plan.length ? this.nextExercise(sessionId, session) : null
    const summary = next ? null : this.finish(sessionId, session)
    return { correct, solution: pending.data.solution, accuracy, next, summary }
  }

  // --- Chấm bài ---

  private check(
    pending: Pending,
    answer: PracticeAnswer
  ): { correct: boolean; accuracy: number | null } {
    switch (pending.kind) {
      case 'cloze':
      case 'listen_choice':
        return {
          correct: answer.kind === pending.kind && answer.choice === pending.correctIndex,
          accuracy: null
        }
      case 'word_order': {
        if (answer.kind !== 'word_order' || !isPermutation(answer.order, pending.tokens.length)) {
          return { correct: false, accuracy: null }
        }
        const built = answer.order.map((i) => pending.tokens[i]).join(' ')
        return { correct: sameSentence(built, pending.sentence), accuracy: null }
      }
      case 'dictation': {
        const accuracy =
          answer.kind === 'dictation' ? dictationAccuracy(pending.sentence, answer.text) : 0
        return { correct: accuracy >= DICTATION_PASS, accuracy }
      }
      case 'match_pairs': {
        const ok =
          answer.kind === 'match_pairs' &&
          answer.mapping.length === pending.mapping.length &&
          answer.mapping.every((m, i) => m === pending.mapping[i])
        return { correct: ok, accuracy: null }
      }
    }
  }

  private finish(sessionId: string, session: Session): PracticeSummary {
    this.sessions.delete(sessionId)
    const { xp, xpRepo, profiles, clock } = this.deps
    const profileId = profiles.activeId()
    const doneToday = xpRepo.countSince(profileId, PRACTICE_REASON, startOfLocalDay(clock.now()))
    let amount = 0
    let coins = 0
    if (doneToday < REWARDED_SESSIONS_PER_DAY) {
      amount = 5 + session.correct
      coins = 5
      xp.grant({ amount, coins, reason: PRACTICE_REASON, refId: sessionId })
    }
    return { correct: session.correct, total: session.asked, xp: amount, coins }
  }

  // --- Sinh bài ---

  private nextExercise(sessionId: string, session: Session): Exercise | null {
    // Dạng bài không sinh được (thiếu dữ liệu) → thử dạng khác trước khi bỏ cuộc
    const wanted = session.plan[session.asked]
    const order = [wanted, ...EXERCISE_KINDS.filter((k) => k !== wanted)]
    for (const kind of order) {
      const built = this.build(kind, session)
      if (!built) continue
      const id = `${sessionId}:e${session.asked + 1}`
      session.asked++
      session.pending = { id, data: built.pending }
      return {
        ...built.body,
        sessionId,
        id,
        index: session.asked,
        total: SESSION_SIZE
      } as Exercise
    }
    // Hết dữ liệu giữa chừng → coi phiên kết thúc ở số bài đã hỏi
    session.plan.length = session.asked
    return null
  }

  private build(kind: ExerciseKind, session: Session): Built | null {
    switch (kind) {
      case 'cloze':
        return this.buildCloze(session)
      case 'word_order':
        return this.buildWordOrder(session)
      case 'listen_choice':
        return this.buildListenChoice(session)
      case 'dictation':
        return this.buildDictation(session)
      case 'match_pairs':
        return this.buildMatchPairs(session)
    }
  }

  private options(): { childSafe: boolean } {
    return { childSafe: this.deps.profiles.active().isChild }
  }

  /** Level người học, một bậc dưới và một bậc trên */
  private levels(): LevelCode[] {
    return practiceLevels(this.deps.settings.get('learning.level'))
  }

  private pickSentences(
    session: Session,
    count: number,
    filter: { needVi?: boolean; minWords: number; maxWords: number }
  ): Array<{ id: string; en: string; vi: string | null }> {
    const rows = this.deps.dictionary.randomSentences(
      this.levels(),
      count + 6,
      filter,
      this.options()
    )
    return rows.filter((r) => !session.usedSentences.has(r.id)).slice(0, count)
  }

  private buildCloze(session: Session): Built | null {
    const { dictionary } = this.deps
    for (const s of this.pickSentences(session, 8, { minWords: 5, maxWords: 12 })) {
      const tokens = s.en.split(' ')
      const candidates = tokens
        .map((raw, i) => ({ raw, i, word: raw.replace(/[^A-Za-z]/g, '') }))
        .filter(
          (t) => t.word.length >= 3 && t.word === t.raw.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')
        )
      this.shuffle(candidates)
      for (const t of candidates) {
        const info = dictionary.wordByLemma(t.word.toLowerCase())
        if (!info || (info.freqRank ?? 0) <= STOPWORD_RANK || !info.pos[0]) continue
        const exclude = new Set(normalizeWords(s.en))
        const distractors = dictionary.distractorLemmas(
          info.pos[0],
          this.levels(),
          exclude,
          3,
          this.options()
        )
        if (distractors.length < 3) continue

        const capital = /^[A-Z]/.test(t.word)
        const fit = (w: string): string => (capital ? w[0].toUpperCase() + w.slice(1) : w)
        const choices = this.shuffle([t.word, ...distractors.map(fit)])
        const prompt = tokens
          .map((tok, i) => (i === t.i ? tok.replace(t.word, '____') : tok))
          .join(' ')
        session.usedSentences.add(s.id)
        return {
          body: { kind: 'cloze', prompt, hintVi: s.vi, choices },
          pending: {
            kind: 'cloze',
            correctIndex: choices.indexOf(t.word),
            solution: s.en
          }
        }
      }
    }
    return null
  }

  private buildWordOrder(session: Session): Built | null {
    const s = this.pickSentences(session, 1, { needVi: true, minWords: 4, maxWords: 9 })[0]
    if (!s?.vi) return null
    const tokens = s.en.split(' ')
    let shuffled = this.shuffle([...tokens])
    for (let tries = 0; tries < 5 && shuffled.join(' ') === tokens.join(' '); tries++) {
      shuffled = this.shuffle([...tokens])
    }
    session.usedSentences.add(s.id)
    return {
      body: { kind: 'word_order', hintVi: s.vi, tokens: shuffled },
      pending: { kind: 'word_order', tokens: shuffled, sentence: s.en, solution: s.en }
    }
  }

  private buildListenChoice(session: Session): Built | null {
    const pool = this.pickSentences(session, 4, { needVi: true, minWords: 4, maxWords: 10 })
    const target = pool[0]
    if (!target?.vi) return null
    const texts = new Set([target.vi.trim().toLowerCase()])
    const distractors: string[] = []
    for (const other of pool.slice(1)) {
      const vi = other.vi?.trim()
      if (!vi || texts.has(vi.toLowerCase())) continue
      texts.add(vi.toLowerCase())
      distractors.push(vi)
    }
    if (distractors.length < 2) return null
    const choices = this.shuffle([target.vi.trim(), ...distractors])
    session.usedSentences.add(target.id)
    return {
      body: { kind: 'listen_choice', audioText: target.en, choices },
      pending: {
        kind: 'listen_choice',
        correctIndex: choices.indexOf(target.vi.trim()),
        solution: `${target.en} — ${target.vi.trim()}`
      }
    }
  }

  private buildDictation(session: Session): Built | null {
    const s = this.pickSentences(session, 1, { minWords: 4, maxWords: 9 })[0]
    if (!s) return null
    session.usedSentences.add(s.id)
    return {
      body: { kind: 'dictation', audioText: s.en, wordCount: s.en.split(' ').length },
      pending: { kind: 'dictation', sentence: s.en, solution: s.en }
    }
  }

  private buildMatchPairs(session: Session): Built | null {
    const { dictionary } = this.deps
    const pairs: Array<{ en: string; vi: string }> = []
    const seenVi = new Set<string>()
    for (let tries = 0; tries < 20 && pairs.length < 5; tries++) {
      const entry = dictionary.randomWord(this.levels(), session.usedWords, this.options())
      if (!entry) break
      session.usedWords.add(entry.id)
      const vi = entry.vi[0]
      if (!vi || vi.length > 28 || seenVi.has(vi.toLowerCase())) continue
      seenVi.add(vi.toLowerCase())
      pairs.push({ en: entry.lemma, vi })
    }
    if (pairs.length < 3) return null
    const right = this.shuffle(pairs.map((p) => p.vi))
    return {
      body: { kind: 'match_pairs', left: pairs.map((p) => p.en), right },
      pending: {
        kind: 'match_pairs',
        mapping: pairs.map((p) => right.indexOf(p.vi)),
        solution: pairs.map((p) => `${p.en} = ${p.vi}`).join('; ')
      }
    }
  }

  // --- Tiện ích ---

  private rnd(): number {
    return (this.deps.random ?? Math.random)()
  }

  private shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.rnd() * (i + 1))
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }

  private cleanup(): void {
    const now = this.deps.clock.now()
    for (const [id, s] of this.sessions)
      if (now - s.createdAt > SESSION_TTL_MS) this.sessions.delete(id)
  }
}
