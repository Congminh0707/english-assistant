import {
  cefrLabel,
  CHECKPOINT_PASS_RATIO,
  CHECKPOINT_PLAN,
  CHECKPOINT_REWARD,
  combineLevels,
  estimateLevel,
  nextLevelIndex,
  PLACEMENT_PLAN,
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
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { ProgressService } from './ProgressService'
import type { SettingsService } from './SettingsService'
import type { XpService } from './XpService'

/** Bài kiểm tra bị bỏ nếu không có hoạt động sau thời gian này */
const SESSION_TTL_MS = 60 * 60_000
export const CHECKPOINT_REASON = 'level.checkpoint'

const SKILLS: readonly PlacementSkill[] = ['vocab', 'grammar', 'reading', 'listening']

const SKILL_SETTING = {
  vocab: 'learning.levelVocab',
  grammar: 'learning.levelGrammar',
  reading: 'learning.levelReading',
  listening: 'learning.levelListening'
} as const

type Mode = 'placement' | 'checkpoint'

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
  mode: Mode
  createdAt: number
  /** Kế hoạch kỹ năng từng câu */
  plan: readonly PlacementSkill[]
  /** Kiểm tra lên cấp: bậc đang thi và bậc hiện tại của người học */
  target: number
  from: LevelCode
  skills: Record<PlacementSkill, SkillState>
  askedWords: Set<string>
  askedItems: Set<string>
  asked: number
  pending: Pending | null
}

const newSkill = (index: number): SkillState => ({ index, askedLevels: [], correct: 0 })

/**
 * Kiểm tra trình độ, hai chế độ:
 * - Đầu vào (placement): 20 câu xen kẽ từ vựng/ngữ pháp/đọc/nghe, mỗi kỹ năng một "bậc thang" thích nghi
 *   (đúng → khó hơn, sai → dễ hơn); xong lưu trình độ từng kỹ năng và trình độ chung.
 * - Lên cấp (checkpoint): 10 câu không thích nghi ở bậc kế tiếp; đạt ≥ 80% thì lên một bậc (lần đầu qua bậc có thưởng).
 * Đáp án đúng chỉ nằm ở main.
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
      progress?: ProgressService
      xp?: XpService
      xpRepo?: XpRepository
      clock: Clock
      random?: () => number
    }
  ) {}

  start(): PlacementQuestion | null {
    return this.open('placement')
  }

  /** Bắt đầu bài kiểm tra lên cấp; null nếu đã ở bậc cao nhất hoặc chưa đủ dữ liệu */
  startCheckpoint(): PlacementQuestion | null {
    return this.open('checkpoint')
  }

  private open(mode: Mode): PlacementQuestion | null {
    this.cleanup()
    const { settings, clock } = this.deps
    const from = settings.get('learning.level')
    const target = LEVEL_CODES.indexOf(from) + 1
    if (mode === 'checkpoint' && target >= LEVEL_CODES.length) return null
    const sessionId = `${mode}:${clock.now()}:${++this.seq}`
    const start = mode === 'checkpoint' ? target : PLACEMENT_START_INDEX
    const session: Session = {
      mode,
      createdAt: clock.now(),
      plan: mode === 'checkpoint' ? CHECKPOINT_PLAN : PLACEMENT_PLAN,
      target,
      from,
      skills: {
        vocab: newSkill(start),
        grammar: newSkill(start),
        reading: newSkill(start),
        listening: newSkill(start)
      },
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
    // Kiểm tra lên cấp giữ nguyên bậc đang thi; đầu vào thì lên/xuống theo câu trả lời
    if (session.mode === 'placement') state.index = nextLevelIndex(state.index, correct)

    const next = session.asked < session.plan.length ? this.ask(sessionId, session) : null
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
    const planned = session.plan[session.asked] ?? 'vocab'
    // Kỹ năng theo kế hoạch trước; hết câu thì thử các kỹ năng khác để bài không kết thúc sớm
    const order: PlacementSkill[] = [planned, ...SKILLS.filter((s) => s !== planned)]
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
      if (session.mode === 'placement') state.index = index
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
        total: session.plan.length,
        lemma: entry.lemma,
        ipa: entry.ipaUs ?? entry.ipaUk,
        prompt: null,
        passage: null,
        say: null,
        choices
      }
    }
    return null
  }

  private askItem(
    sessionId: string,
    session: Session,
    skill: 'grammar' | 'reading' | 'listening'
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
    if (session.mode === 'placement') state.index = index
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
      total: session.plan.length,
      lemma: '',
      ipa: null,
      prompt: item.prompt,
      passage: item.passage ?? null,
      say: item.say ?? null,
      choices: choices.map((c) => c.text)
    }
  }

  private finish(sessionId: string, session: Session): PlacementResult {
    this.sessions.delete(sessionId)
    return session.mode === 'checkpoint'
      ? this.finishCheckpoint(session)
      : this.finishPlacement(session)
  }

  private skillResults(session: Session): {
    skills: PlacementResult['skills']
    levels: Partial<Record<PlacementSkill, LevelCode>>
  } {
    const skills: PlacementResult['skills'] = []
    const levels: Partial<Record<PlacementSkill, LevelCode>> = {}
    for (const skill of SKILLS) {
      const state = session.skills[skill]
      if (!state.askedLevels.length) continue
      const level = estimateLevel(state.askedLevels, state.index)
      levels[skill] = level
      skills.push({
        skill,
        level,
        cefr: cefrLabel(level),
        correct: state.correct,
        total: state.askedLevels.length
      })
    }
    return { skills, levels }
  }

  private finishPlacement(session: Session): PlacementResult {
    const { settings } = this.deps
    const { skills, levels } = this.skillResults(session)
    for (const s of skills) {
      settings.set(SKILL_SETTING[s.skill], s.level)
      this.deps.progress?.setLevel(s.skill, s.level)
    }
    const level = combineLevels(levels)
    settings.set('learning.level', level)
    return {
      level,
      cefr: cefrLabel(level),
      correct: skills.reduce((n, s) => n + s.correct, 0),
      total: skills.reduce((n, s) => n + s.total, 0),
      skills,
      checkpoint: null
    }
  }

  private finishCheckpoint(session: Session): PlacementResult {
    const { settings, progress, xp, xpRepo, profiles } = this.deps
    const { skills } = this.skillResults(session)
    const correct = skills.reduce((n, s) => n + s.correct, 0)
    const total = skills.reduce((n, s) => n + s.total, 0)
    const passed = total > 0 && correct / total >= CHECKPOINT_PASS_RATIO
    const toLevel = LEVEL_CODES[session.target]
    let reward = { xp: 0, coins: 0 }
    if (passed) {
      settings.set('learning.level', toLevel)
      for (const s of skills) {
        // Kỹ năng đã được kiểm tra và đạt thì nâng lên bậc mới (không hạ kỹ năng đang cao hơn)
        const current = settings.get(SKILL_SETTING[s.skill])
        if (LEVEL_CODES.indexOf(current) < session.target) {
          settings.set(SKILL_SETTING[s.skill], toLevel)
          progress?.setLevel(s.skill, toLevel)
        }
      }
      const refId = `to:${toLevel}`
      if (xp && xpRepo && !xpRepo.hasEvent(profiles.activeId(), CHECKPOINT_REASON, refId)) {
        xp.grant({
          amount: CHECKPOINT_REWARD.xp,
          coins: CHECKPOINT_REWARD.coins,
          reason: CHECKPOINT_REASON,
          refId
        })
        reward = CHECKPOINT_REWARD
      }
    }
    return {
      level: passed ? toLevel : session.from,
      cefr: cefrLabel(passed ? toLevel : session.from),
      correct,
      total,
      skills,
      checkpoint: {
        passed,
        from: session.from,
        to: passed ? toLevel : null,
        ...reward
      }
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
