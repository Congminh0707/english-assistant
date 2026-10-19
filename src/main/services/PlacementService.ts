import {
  cefrLabel,
  combineLevels,
  estimateLevel,
  nextLevelIndex,
  PLACEMENT_PLAN,
  PLACEMENT_QUESTIONS,
  PLACEMENT_START_INDEX
} from '@shared/placement'
import { LEVEL_CODES, type LevelCode } from '@shared/schemas/content/level'
import type {
  PlacementAnswerResult,
  PlacementQuestion,
  PlacementResult,
  PlacementSkill
} from '@shared/schemas/placement'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { DictionaryService } from '../content/DictionaryService'
import type { PlacementBank } from '../content/PlacementBank'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'

/** Bài kiểm tra bị bỏ nếu không có hoạt động sau thời gian này */
const SESSION_TTL_MS = 60 * 60_000

const SKILL_SETTING = {
  vocab: 'learning.levelVocab',
  grammar: 'learning.levelGrammar',
  reading: 'learning.levelReading'
} as const

interface Pending {
  questionId: string
  skill: PlacementSkill
  correctIndex: number
  correctText: string
}

/** "Bậc thang" độ khó riêng của một kỹ năng */
interface SkillState {
  /** Bậc (0–11) của câu sắp hỏi */
  index: number
  askedLevels: number[]
  correct: number
}

interface Session {
  createdAt: number
  skills: Record<PlacementSkill, SkillState>
  askedWords: Set<string>
  askedItems: Set<string>
  asked: number
  pending: Pending | null
}

const newSkill = (): SkillState => ({ index: PLACEMENT_START_INDEX, askedLevels: [], correct: 0 })

/**
 * Bài kiểm tra đầu vào: 20 câu trắc nghiệm xen kẽ từ vựng (12), ngữ pháp (5), đọc hiểu (3); mỗi kỹ năng có
 * độ khó thích nghi riêng (đúng → khó hơn, sai → dễ hơn). Đáp án đúng chỉ nằm ở main.
 * Kết thúc thì lưu trình độ theo kỹ năng và trình độ chung vào cài đặt.
 */
export class PlacementService {
  private readonly sessions = new Map<string, Session>()
  private seq = 0

  constructor(
    private readonly deps: {
      dictionary: DictionaryService
      bank: PlacementBank
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
      skills: { vocab: newSkill(), grammar: newSkill(), reading: newSkill() },
      askedWords: new Set(),
      askedItems: new Set(),
      asked: 0,
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
    const state = session.skills[pending.skill]
    if (correct) state.correct++
    state.index = nextLevelIndex(state.index, correct)

    const next = session.asked < PLACEMENT_QUESTIONS ? this.ask(sessionId, session) : null
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
    const planned = PLACEMENT_PLAN[session.asked] ?? 'vocab'
    // Kỹ năng theo kế hoạch trước; hết câu thì thử các kỹ năng khác để bài không kết thúc sớm
    const order: PlacementSkill[] = [
      planned,
      ...(['vocab', 'grammar', 'reading'] as const).filter((s) => s !== planned)
    ]
    for (const skill of order) {
      const question =
        skill === 'vocab'
          ? this.askVocab(sessionId, session)
          : this.askItem(sessionId, session, skill)
      if (question) return question
    }
    return null
  }

  private questionId(sessionId: string, session: Session): string {
    return `${sessionId}:q${session.asked + 1}`
  }

  private askVocab(sessionId: string, session: Session): PlacementQuestion | null {
    const { dictionary, profiles } = this.deps
    const state = session.skills.vocab
    const options = { childSafe: profiles.active().isChild }
    // Thử bậc hiện tại, rồi các bậc lân cận nếu hết từ ở bậc đó
    const order = [0, 1, -1, 2, -2]
      .map((d) => state.index + d)
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
      const questionId = this.questionId(sessionId, session)
      session.askedWords.add(entry.id)
      state.askedLevels.push(index)
      state.index = index
      session.asked++
      session.pending = {
        questionId,
        skill: 'vocab',
        correctIndex: choices.indexOf(data.correct),
        correctText: data.correct
      }
      return {
        kind: 'vocab',
        sessionId,
        id: questionId,
        index: session.asked,
        total: PLACEMENT_QUESTIONS,
        lemma: entry.lemma,
        ipa: entry.ipaUs ?? entry.ipaUk,
        prompt: null,
        passage: null,
        choices
      }
    }
    return null
  }

  private askItem(
    sessionId: string,
    session: Session,
    skill: 'grammar' | 'reading'
  ): PlacementQuestion | null {
    const state = session.skills[skill]
    const picked = this.deps.bank.pick(skill, state.index, session.askedItems, this.deps.random)
    if (!picked) return null
    const { item, index } = picked
    // Xáo lựa chọn rồi tính lại vị trí đáp án đúng
    const choices = this.shuffle(
      item.choices.map((text, i) => ({ text, right: i === item.answer }))
    )
    const questionId = this.questionId(sessionId, session)
    session.askedItems.add(item.id)
    state.askedLevels.push(index)
    state.index = index
    session.asked++
    const correctIndex = choices.findIndex((c) => c.right)
    session.pending = {
      questionId,
      skill,
      correctIndex,
      correctText: choices[correctIndex].text
    }
    return {
      kind: skill,
      sessionId,
      id: questionId,
      index: session.asked,
      total: PLACEMENT_QUESTIONS,
      lemma: '',
      ipa: null,
      prompt: item.prompt,
      passage: item.passage ?? null,
      choices: choices.map((c) => c.text)
    }
  }

  private finish(sessionId: string, session: Session): PlacementResult {
    this.sessions.delete(sessionId)
    const { settings } = this.deps
    const skills: PlacementResult['skills'] = []
    const levels: Partial<Record<PlacementSkill, LevelCode>> = {}
    for (const skill of ['vocab', 'grammar', 'reading'] as const) {
      const state = session.skills[skill]
      if (!state.askedLevels.length) continue
      const level = estimateLevel(state.askedLevels, state.index)
      levels[skill] = level
      settings.set(SKILL_SETTING[skill], level)
      skills.push({
        skill,
        level,
        cefr: cefrLabel(level),
        correct: state.correct,
        total: state.askedLevels.length
      })
    }
    const level = combineLevels(levels)
    settings.set('learning.level', level)
    return {
      level,
      cefr: cefrLabel(level),
      correct: skills.reduce((n, s) => n + s.correct, 0),
      total: skills.reduce((n, s) => n + s.total, 0),
      skills
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
