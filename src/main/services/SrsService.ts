import { fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import type { SrsCardRow, VocabRepository } from '../db/repositories/VocabRepository'
import type { ProfileService } from './ProfileService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

/** 1 Quên · 2 Khó · 3 Được · 4 Dễ (thang của FSRS/Anki) */
export type SrsRating = 1 | 2 | 3 | 4

/** XP mỗi lần ôn một thẻ (docs/06-levels-and-progression.md#6) */
const XP_CARD_REVIEWED = 2
const DAY_MS = 86_400_000

/**
 * Lặp lại ngắt quãng bằng FSRS (ts-fsrs). Mỗi lần ôn: tính lịch mới, ghi nhật ký srs_reviews,
 * cộng XP cho thú cưng. docs/07-learning-modules.md#3-module-từ-vựng--srs-p0
 */
export class SrsService {
  private readonly scheduler = fsrs({ enable_fuzz: true })

  constructor(
    private readonly deps: {
      vocab: VocabRepository
      profiles: ProfileService
      xp: XpService
      clock: Clock
      bus: EventBus
      transaction: Transaction
    }
  ) {}

  dueCount(): number {
    return this.deps.vocab.countDue(this.deps.profiles.activeId(), this.deps.clock.now())
  }

  dueCards(limit = 20): SrsCardRow[] {
    return this.deps.vocab.dueCards(this.deps.profiles.activeId(), this.deps.clock.now(), limit)
  }

  /** Bao lâu nữa (ngày) sẽ ôn lại thẻ nếu chấm 1/2/3/4 — để hiện trên nút chấm điểm */
  previewIntervals(cardId: string): [number, number, number, number] {
    const row = this.deps.vocab.findCard(this.deps.profiles.activeId(), cardId)
    if (!row) throw new AppError('NOT_FOUND', 'errors.notFound')
    const now = this.deps.clock.now()
    const options = this.scheduler.repeat(toFsrsCard(row), new Date(now))
    const days = (grade: Grade): number => (options[grade].card.due.getTime() - now) / DAY_MS
    return [days(Rating.Again), days(Rating.Hard), days(Rating.Good), days(Rating.Easy)]
  }

  review(
    cardId: string,
    rating: SrsRating,
    opts: { elapsedMs?: number; source: 'study' | 'mascot' }
  ): { due: number; intervalDays: number } {
    const { vocab, profiles, clock, transaction } = this.deps
    const result = transaction(() => {
      const profileId = profiles.activeId()
      const row = vocab.findCard(profileId, cardId)
      if (!row) throw new AppError('NOT_FOUND', 'errors.notFound')
      const now = clock.now()
      const next = this.scheduler.next(toFsrsCard(row), new Date(now), rating as Grade).card
      vocab.updateSchedule(
        row.id,
        {
          due: next.due.getTime(),
          stability: next.stability,
          difficulty: next.difficulty,
          elapsedDays: next.elapsed_days,
          scheduledDays: next.scheduled_days,
          learningSteps: next.learning_steps,
          reps: next.reps,
          lapses: next.lapses,
          state: next.state,
          lastReview: now
        },
        now
      )
      vocab.insertReview({
        profileId,
        cardId: row.id,
        rating,
        stateBefore: row.state,
        dueBefore: row.due,
        elapsedMs: opts.elapsedMs ?? null,
        source: opts.source,
        reviewedAt: now
      })
      return { due: next.due.getTime(), intervalDays: (next.due.getTime() - now) / DAY_MS }
    })

    this.deps.bus.emit('card.reviewed', { cardId, rating })
    this.deps.xp.grant({ amount: XP_CARD_REVIEWED, reason: 'card.reviewed', refId: cardId })
    return result
  }
}

function toFsrsCard(row: SrsCardRow): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsedDays,
    scheduled_days: row.scheduledDays,
    learning_steps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    ...(row.lastReview ? { last_review: new Date(row.lastReview) } : {})
  }
}
