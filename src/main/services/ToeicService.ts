import type {
  ToeicAttempt,
  ToeicBankInfo,
  ToeicGroup,
  ToeicGroupView,
  ToeicMode,
  ToeicPart,
  ToeicResult,
  ToeicSession
} from '@shared/schemas/toeic'
import {
  estimateScore,
  isListeningPart,
  TOEIC_FULL_SECONDS,
  TOEIC_MINI_SECONDS,
  TOEIC_PART_QUESTIONS,
  TOEIC_PARTS,
  targetCounts,
  type SectionTally
} from '@shared/toeic'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { ToeicBank } from '../content/ToeicBank'
import type { ExamRepository } from '../db/repositories/ExamRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { XpService } from './XpService'

/** Bài làm bị bỏ nếu quá thời gian này sau khi bắt đầu (full 2 giờ + dư) */
const SESSION_TTL_MS = 4 * 60 * 60_000
const XP_REASON = 'exam.toeic'
const XP_BY_MODE: Record<ToeicMode, number> = { part: 0, mini: 30, full: 80 }

interface Session {
  profileId: string
  mode: ToeicMode
  part: ToeicPart | null
  startedAt: number
  groups: ToeicGroup[]
}

/**
 * Luyện thi TOEIC: ba chế độ (theo Part không giới hạn giờ, mini ~30 phút, full 2 giờ).
 * Đáp án và lời giải chỉ nằm ở main; renderer nộp cả bài một lần rồi nhận kết quả + xem lại.
 * Điểm TOEIC chỉ là ước lượng từ bảng quy đổi xấp xỉ (shared/toeic.ts).
 */
export class ToeicService {
  private readonly sessions = new Map<string, Session>()
  private seq = 0

  constructor(
    private readonly deps: {
      bank: ToeicBank
      repo: ExamRepository
      profiles: ProfileService
      clock: Clock
      xp?: XpService
      xpRepo?: XpRepository
      random?: () => number
    }
  ) {}

  bank(): ToeicBankInfo {
    return this.deps.bank.info()
  }

  /** null nếu ngân hàng chưa đủ câu cho chế độ này */
  start(mode: ToeicMode, part?: ToeicPart): ToeicSession | null {
    this.cleanup()
    const { bank, clock, profiles, random } = this.deps
    const groups: ToeicGroup[] = []
    if (mode === 'part') {
      if (!part) throw new AppError('INVALID_INPUT', 'errors.invalidInput')
      const available = bank.questionCount(part)
      if (available === 0) return null
      const picked = bank.pick(part, Math.min(TOEIC_PART_QUESTIONS, available), random)
      if (!picked) return null
      groups.push(...picked)
    } else {
      const counts = targetCounts(mode)
      for (const p of TOEIC_PARTS) {
        const picked = bank.pick(p, counts[p], random)
        if (!picked) return null
        groups.push(...picked)
      }
    }
    const sessionId = `toeic:${clock.now()}:${++this.seq}`
    this.sessions.set(sessionId, {
      profileId: profiles.activeId(),
      mode,
      part: mode === 'part' ? (part ?? null) : null,
      startedAt: clock.now(),
      groups
    })
    return {
      sessionId,
      mode,
      timeLimitSec:
        mode === 'full' ? TOEIC_FULL_SECONDS : mode === 'mini' ? TOEIC_MINI_SECONDS : null,
      totalQuestions: groups.reduce((n, g) => n + g.questions.length, 0),
      groups: groups.map(toView)
    }
  }

  submit(
    sessionId: string,
    answers: Record<string, number | null>,
    elapsedSec: number
  ): ToeicResult {
    const session = this.sessions.get(sessionId)
    if (!session) throw new AppError('NOT_FOUND', 'errors.notFound')
    this.sessions.delete(sessionId)

    const perPart = new Map<number, { correct: number; total: number }>()
    const review: ToeicResult['review'] = []
    const listening: SectionTally = { correct: 0, total: 0 }
    const reading: SectionTally = { correct: 0, total: 0 }
    for (const g of session.groups) {
      for (const q of g.questions) {
        const raw = answers[q.id]
        const picked = typeof raw === 'number' && raw < q.choices.length ? raw : null
        const ok = picked === q.answer
        const tally = perPart.get(g.part) ?? { correct: 0, total: 0 }
        tally.total++
        if (ok) tally.correct++
        perPart.set(g.part, tally)
        const section = isListeningPart(g.part) ? listening : reading
        section.total++
        if (ok) section.correct++
        review.push({
          groupId: g.id,
          questionId: q.id,
          picked,
          answer: q.answer,
          explain: q.explain
        })
      }
    }
    const parts = [...perPart.entries()]
      .sort(([a], [b]) => a - b)
      .map(([part, t]) => ({ part, correct: t.correct, total: t.total }))
    const correct = listening.correct + reading.correct
    const total = listening.total + reading.total
    const estimate = estimateScore(listening, reading)

    const now = this.deps.clock.now()
    this.deps.repo.add(
      {
        profileId: session.profileId,
        exam: 'toeic',
        mode: session.mode,
        part: session.part,
        correct,
        total,
        estListening: estimate.listening,
        estReading: estimate.reading,
        estTotal: estimate.total,
        partResults: JSON.stringify(parts),
        elapsedSec,
        finishedAt: now
      },
      now
    )
    const xp = this.grantXp(session, now)
    return { mode: session.mode, correct, total, parts, estimate, xp, review }
  }

  history(limit = 20): ToeicAttempt[] {
    const { repo, profiles } = this.deps
    return repo.recent(profiles.activeId(), 'toeic', limit).map((r) => ({
      id: r.id,
      mode: r.mode as ToeicMode,
      part: r.part,
      correct: r.correct,
      total: r.total,
      estTotal: r.estTotal,
      elapsedSec: r.elapsedSec,
      finishedAt: r.finishedAt
    }))
  }

  /** Thưởng XP một lần mỗi ngày cho mỗi chế độ mini/full (tránh cày) */
  private grantXp(session: Session, now: number): number {
    const { xp, xpRepo } = this.deps
    const amount = XP_BY_MODE[session.mode]
    if (!amount || !xp || !xpRepo) return 0
    const day = new Date(now).toISOString().slice(0, 10)
    const refId = `${session.mode}:${day}`
    if (xpRepo.hasEvent(session.profileId, XP_REASON, refId)) return 0
    xp.grant({ amount, coins: 0, reason: XP_REASON, refId })
    return amount
  }

  private cleanup(): void {
    const now = this.deps.clock.now()
    for (const [id, s] of this.sessions) {
      if (now - s.startedAt > SESSION_TTL_MS) this.sessions.delete(id)
    }
  }
}

function toView(g: ToeicGroup): ToeicGroupView {
  return {
    id: g.id,
    part: g.part as ToeicPart,
    script: g.script ?? null,
    scene: g.scene ?? null,
    context: g.context ?? null,
    passage: g.passage ?? null,
    questions: g.questions.map((q) => ({ id: q.id, prompt: q.prompt, choices: q.choices }))
  }
}
