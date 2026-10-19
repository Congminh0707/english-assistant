import type {
  StudyCard,
  StudyNext,
  StudyOverview,
  StudyRateResult,
  StudyRating,
  WordListItem
} from '@shared/schemas/study'
import type { Clock } from '../core/Clock'
import type { DictionaryService } from '../content/DictionaryService'
import type { SrsCardRow, VocabRepository } from '../db/repositories/VocabRepository'
import type { ProfileService } from './ProfileService'
import type { SrsService } from './SrsService'
import type { VocabService } from './VocabService'

const DAY_MS = 86_400_000
/** Chỉ xét streak trong ngần này ngày gần nhất */
const STREAK_WINDOW_DAYS = 400
const WORD_LIST_LIMIT = 1000
/** Số thẻ đến hạn lấy ra mỗi lần để tìm thẻ có nội dung hiển thị được */
const CANDIDATES = 8

/**
 * Cửa sổ Học tập: số liệu trang chủ, phiên ôn thẻ SRS (lật thẻ → chấm 1–4), sổ từ.
 * Dùng chung SrsService với mascot nên lịch ôn và XP luôn thống nhất.
 */
export class StudyService {
  constructor(
    private readonly deps: {
      vocab: VocabRepository
      vocabService: VocabService
      srs: SrsService
      dictionary: DictionaryService
      profiles: ProfileService
      clock: Clock
    }
  ) {}

  overview(): StudyOverview {
    const { vocab, profiles, clock, srs, dictionary } = this.deps
    const profileId = profiles.activeId()
    const now = clock.now()
    const offsetSeconds = localOffsetSeconds(now)
    const todayStart = startOfLocalDay(now)
    return {
      dueCount: srs.dueCount(),
      totalCards: vocab.countCards(profileId),
      learnedCards: vocab.countLearned(profileId),
      reviewedToday: vocab.countReviewsSince(profileId, todayStart),
      streakDays: computeStreak(
        vocab.reviewDays(profileId, now - STREAK_WINDOW_DAYS * DAY_MS, offsetSeconds),
        dayKey(now, offsetSeconds)
      ),
      packMissing: !dictionary.available()
    }
  }

  /** Thẻ đến hạn kế tiếp; bỏ qua thẻ không còn mục từ trong gói từ điển */
  next(): StudyNext {
    const { srs, dictionary } = this.deps
    const dueCount = srs.dueCount()
    for (const row of srs.dueCards(CANDIDATES)) {
      const entry = dictionary.entryById(row.contentId)
      if (!entry) continue
      const card: StudyCard = {
        cardId: row.id,
        lemma: entry.lemma,
        ipaUs: entry.ipaUs,
        ipaUk: entry.ipaUk,
        pos: entry.pos,
        level: entry.level,
        vi: entry.vi,
        viGenerated: entry.viGenerated,
        senses: entry.senses,
        examples: entry.examples,
        context: row.contextSentence,
        isNew: row.state === 0,
        intervals: srs.previewIntervals(row.id)
      }
      return { card, dueCount }
    }
    return { card: null, dueCount }
  }

  rate(cardId: string, rating: StudyRating, elapsedMs: number): StudyRateResult {
    const { intervalDays } = this.deps.srs.review(cardId, rating, { elapsedMs, source: 'study' })
    return { intervalDays, dueCount: this.deps.srs.dueCount() }
  }

  /** Sổ từ của người dùng, mới lưu trước */
  words(): WordListItem[] {
    const { vocab, profiles, dictionary } = this.deps
    const profileId = profiles.activeId()
    return vocab.listCards(profileId, WORD_LIST_LIMIT).map((row) => toWordItem(row, dictionary))
  }

  removeWord(contentId: string): boolean {
    return this.deps.vocabService.remove(contentId)
  }
}

function toWordItem(row: SrsCardRow, dictionary: DictionaryService): WordListItem {
  const entry = dictionary.entryById(row.contentId)
  return {
    cardId: row.id,
    contentId: row.contentId,
    lemma: entry?.lemma ?? row.contentId.replace(/^word:en:/, ''),
    vi: entry?.vi.slice(0, 3).join('; ') || null,
    level: entry?.level ?? null,
    state: row.state,
    due: row.due,
    reps: row.reps,
    lapses: row.lapses,
    savedAt: row.createdAt
  }
}

/** Chênh lệch múi giờ cục bộ so với UTC, tính bằng giây (cộng vào epoch để ra "giờ treo tường") */
function localOffsetSeconds(now: number): number {
  return -new Date(now).getTimezoneOffset() * 60
}

function startOfLocalDay(now: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dayKey(ms: number, offsetSeconds: number): string {
  return new Date(ms + offsetSeconds * 1000).toISOString().slice(0, 10)
}

/**
 * Số ngày liên tiếp có ôn từ. `days` là các ngày YYYY-MM-DD có ôn, mới nhất trước.
 * Hôm nay chưa ôn thì streak vẫn còn tới hết hôm nay (tính từ hôm qua).
 */
export function computeStreak(days: string[], today: string): number {
  const set = new Set(days)
  const cursor = new Date(`${today}T00:00:00Z`)
  if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1)
  let streak = 0
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
