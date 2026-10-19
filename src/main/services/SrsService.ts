import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import { isPhraseId, makeCloze, type CardDirection } from '@shared/cards'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import { startOfLocalDay } from '../core/localDay'
import type { DictionaryService } from '../content/DictionaryService'
import type { CardSchedule, SrsCardRow, VocabRepository } from '../db/repositories/VocabRepository'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

/** 1 Quên · 2 Khó · 3 Được · 4 Dễ (thang của FSRS/Anki) */
export type SrsRating = 1 | 2 | 3 | 4

/** XP mỗi lần ôn một thẻ (docs/06-levels-and-progression.md#6) */
const XP_CARD_REVIEWED = 2
const DAY_MS = 86_400_000
/** FSRS state = Review: từ đã "thuộc" ở mức ôn dài hạn */
const STATE_REVIEW = 2

interface LastReview {
  profileId: string
  cardId: string
  reviewId: string
  before: CardSchedule
}

/**
 * Lặp lại ngắt quãng bằng FSRS (ts-fsrs). Mỗi lần ôn: tính lịch mới, ghi nhật ký srs_reviews,
 * cộng XP cho thú cưng. Khi thẻ gốc (en_vi) của một từ vào ôn dài hạn, tạo thêm các thẻ phụ
 * (Việt→Anh, nghe-gõ, điền từ) theo cài đặt. Hạn mức từ mới mỗi ngày và thứ tự ôn cũng áp dụng ở đây.
 * docs/07-learning-modules.md#3-module-từ-vựng--srs-p0
 */
export class SrsService {
  private readonly scheduler = fsrs({ enable_fuzz: true })
  private last: LastReview | null = null

  constructor(
    private readonly deps: {
      vocab: VocabRepository
      profiles: ProfileService
      settings: SettingsService
      dictionary: DictionaryService
      xp: XpService
      clock: Clock
      bus: EventBus
      transaction: Transaction
    }
  ) {}

  /** Số từ mới còn được đưa vào ôn hôm nay (Infinity nếu không giới hạn) */
  private newAllowance(): number {
    const { vocab, profiles, settings, clock } = this.deps
    const quota = settings.get('review.newPerDay')
    if (!quota) return Infinity
    const introduced = vocab.countNewIntroducedSince(
      profiles.activeId(),
      startOfLocalDay(clock.now())
    )
    return Math.max(0, quota - introduced)
  }

  dueCount(directions?: CardDirection[]): number {
    const { vocab, profiles, clock } = this.deps
    const profileId = profiles.activeId()
    const now = clock.now()
    const seen = vocab.countDue(profileId, now, { directions, fresh: 'exclude' })
    const fresh = vocab.countDue(profileId, now, { directions, fresh: 'only' })
    return seen + Math.min(fresh, this.newAllowance())
  }

  /**
   * Các thẻ đến hạn theo thứ tự trong cài đặt: xen kẽ theo hạn (mặc định), thẻ mới trước hoặc thẻ cũ trước.
   * Thẻ mới bị giới hạn bởi hạn mức mỗi ngày.
   */
  dueCards(limit = 20, directions?: CardDirection[]): SrsCardRow[] {
    const { vocab, profiles, clock, settings } = this.deps
    const profileId = profiles.activeId()
    const now = clock.now()
    const allowed = this.newAllowance()
    const seen = vocab.dueCards(profileId, now, limit, { directions, fresh: 'exclude' })
    const fresh =
      allowed > 0
        ? vocab.dueCards(profileId, now, Math.min(limit, allowed), { directions, fresh: 'only' })
        : []
    switch (settings.get('review.order')) {
      case 'new-first':
        return [...fresh, ...seen].slice(0, limit)
      case 'review-first':
        return [...seen, ...fresh].slice(0, limit)
      default:
        return [...seen, ...fresh].sort((a, b) => a.due - b.due).slice(0, limit)
    }
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
      const reviewId = vocab.insertReview({
        profileId,
        cardId: row.id,
        rating,
        stateBefore: row.state,
        dueBefore: row.due,
        elapsedMs: opts.elapsedMs ?? null,
        source: opts.source,
        reviewedAt: now
      })
      if (opts.source === 'study') {
        this.last = { profileId, cardId: row.id, reviewId, before: scheduleOf(row) }
      }
      if (row.direction === 'en_vi' && next.state === STATE_REVIEW) this.ensureSiblings(row, now)
      return { due: next.due.getTime(), intervalDays: (next.due.getTime() - now) / DAY_MS }
    })

    this.deps.bus.emit('card.reviewed', { cardId, rating })
    this.deps.xp.grant({ amount: XP_CARD_REVIEWED, reason: 'card.reviewed', refId: cardId })
    return result
  }

  /**
   * Hoàn tác lần chấm gần nhất trong phiên ôn: trả lại lịch cũ của thẻ và xoá lượt ôn khỏi nhật ký.
   * XP đã cộng không bị thu hồi (sổ XP chỉ ghi thêm). Trả về id thẻ, hoặc null nếu không còn gì để hoàn tác.
   */
  undoLast(): string | null {
    const { vocab, profiles, clock, transaction } = this.deps
    const last = this.last
    if (!last || last.profileId !== profiles.activeId()) return null
    this.last = null
    transaction(() => {
      vocab.updateSchedule(last.cardId, last.before, clock.now())
      vocab.deleteReview(last.reviewId)
    })
    return last.cardId
  }

  /** Tạo thẻ phụ cho các từ đã thuộc từ trước (hoặc sau khi bật thêm hướng thẻ trong cài đặt); trả về số thẻ mới */
  backfillSiblings(): number {
    const { vocab, profiles, clock, transaction } = this.deps
    return transaction(() => {
      const now = clock.now()
      let created = 0
      for (const row of vocab.learnedBaseCards(profiles.activeId())) {
        created += this.ensureSiblings(row, now)
      }
      return created
    })
  }

  /** Tạo (hoặc dùng lại thẻ đã xoá mềm) các thẻ phụ được bật trong cài đặt; trả về số thẻ tạo/khôi phục */
  private ensureSiblings(base: SrsCardRow, now: number): number {
    const { vocab, settings, dictionary } = this.deps
    const wanted: CardDirection[] = []
    if (settings.get('review.dirViEn')) wanted.push('vi_en')
    if (settings.get('review.dirAudio')) wanted.push('audio_en')
    if (settings.get('review.dirCloze') && !isPhraseId(base.contentId)) {
      const sentence = base.contextSentence
      const entry = dictionary.entryById(base.contentId)
      const usable =
        (sentence && entry && makeCloze(sentence, entry.lemma)) ||
        (entry && entry.examples.some((e) => makeCloze(e.en, entry.lemma)))
      if (usable) wanted.push('cloze')
    }

    let created = 0
    for (const direction of wanted) {
      const existing = vocab.findCardByContent(base.profileId, base.contentId, direction)
      if (existing?.deletedAt) {
        vocab.reviveCard(existing.id, now + DAY_MS)
        created++
      } else if (!existing) {
        const card = createEmptyCard(new Date(now + DAY_MS)) // thẻ phụ bắt đầu từ ngày mai
        vocab.insertCard(
          {
            profileId: base.profileId,
            contentId: base.contentId,
            direction,
            contextSentence: base.contextSentence,
            due: card.due.getTime(),
            stability: card.stability,
            difficulty: card.difficulty,
            elapsedDays: card.elapsed_days,
            scheduledDays: card.scheduled_days,
            learningSteps: card.learning_steps,
            reps: card.reps,
            lapses: card.lapses,
            state: card.state,
            lastReview: null,
            suspended: false
          },
          now
        )
        created++
      }
    }
    return created
  }
}

function scheduleOf(row: SrsCardRow): CardSchedule {
  return {
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsedDays,
    scheduledDays: row.scheduledDays,
    learningSteps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    lastReview: row.lastReview
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
