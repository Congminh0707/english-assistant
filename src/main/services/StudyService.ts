import { createEmptyCard } from 'ts-fsrs'
import { isPhraseId, makeCloze } from '@shared/cards'
import type { SaveWordResult } from '@shared/schemas/dictionary'
import type {
  SaveManyResult,
  StudyCard,
  StudyNext,
  StudyOverview,
  StudyRateResult,
  StudyRating,
  WordListItem
} from '@shared/schemas/study'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { localDayKey, localOffsetSeconds, startOfLocalDay } from '../core/localDay'
import type { DictionaryService } from '../content/DictionaryService'
import type { PhrasebookLibrary } from '../content/PhrasebookLibrary'
import type { SrsCardRow, VocabRepository } from '../db/repositories/VocabRepository'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'
import type { SrsService } from './SrsService'
import type { Transaction } from './types'
import type { VocabService } from './VocabService'

const DAY_MS = 86_400_000
/** Chỉ xét streak trong ngần này ngày gần nhất */
const STREAK_WINDOW_DAYS = 400
const WORD_LIST_LIMIT = 1000
/** Số thẻ đến hạn lấy ra mỗi lần để tìm thẻ có nội dung hiển thị được */
const CANDIDATES = 8

/**
 * Cửa sổ Học tập: số liệu trang chủ, phiên ôn thẻ SRS (nhiều dạng thẻ → chấm 1–4, hoàn tác), sổ từ và quản lý thẻ.
 * Dùng chung SrsService với mascot nên lịch ôn và XP luôn thống nhất.
 */
export class StudyService {
  constructor(
    private readonly deps: {
      vocab: VocabRepository
      vocabService: VocabService
      srs: SrsService
      dictionary: DictionaryService
      phrasebook: PhrasebookLibrary
      profiles: ProfileService
      settings: SettingsService
      clock: Clock
      transaction: Transaction
      /** Nguồn ngẫu nhiên cho xáo lựa chọn (test truyền giá trị cố định) */
      random?: () => number
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
        localDayKey(now)
      ),
      packMissing: !dictionary.available()
    }
  }

  /** Thẻ đến hạn kế tiếp; bỏ qua thẻ không còn nội dung hiển thị được (từ không còn trong gói từ điển) */
  next(): StudyNext {
    const { srs } = this.deps
    const dueCount = srs.dueCount()
    for (const row of srs.dueCards(CANDIDATES)) {
      const card = this.toCard(row)
      if (card) return { card, dueCount }
    }
    return { card: null, dueCount }
  }

  rate(cardId: string, rating: StudyRating, elapsedMs: number): StudyRateResult {
    const { intervalDays } = this.deps.srs.review(cardId, rating, { elapsedMs, source: 'study' })
    return { intervalDays, dueCount: this.deps.srs.dueCount() }
  }

  /** Hoàn tác lần chấm gần nhất rồi hiện lại đúng thẻ đó; card = null nếu không có gì để hoàn tác */
  undo(): StudyNext {
    const { srs, vocab, profiles } = this.deps
    const cardId = srs.undoLast()
    const row = cardId ? vocab.findCard(profiles.activeId(), cardId) : undefined
    return { card: row ? this.toCard(row) : null, dueCount: srs.dueCount() }
  }

  /** Sổ từ của người dùng, mới lưu trước */
  words(): WordListItem[] {
    const { vocab, profiles } = this.deps
    const profileId = profiles.activeId()
    const siblings = vocab.siblingCounts(profileId)
    return vocab
      .listCards(profileId, WORD_LIST_LIMIT)
      .map((row) => this.toWordItem(row, siblings.get(row.contentId) ?? 0))
  }

  removeWord(contentId: string): boolean {
    return this.deps.vocabService.remove(contentId)
  }

  /** Tạm dừng / tiếp tục ôn mọi thẻ của một từ */
  setSuspended(contentId: string, suspended: boolean): boolean {
    const { vocab, profiles, clock } = this.deps
    return vocab.setSuspended(profiles.activeId(), contentId, suspended, clock.now())
  }

  /** Đặt lại tiến độ của từ: thẻ gốc về "mới", các thẻ phụ bị gỡ (sẽ tạo lại khi từ thuộc lần nữa) */
  resetWord(contentId: string): boolean {
    const { vocab, profiles, clock, transaction } = this.deps
    return transaction(() => {
      const profileId = profiles.activeId()
      const row = vocab.findCardByContent(profileId, contentId, 'en_vi')
      if (!row || row.deletedAt) return false
      const now = clock.now()
      const fresh = createEmptyCard(new Date(now))
      vocab.updateSchedule(
        row.id,
        {
          due: fresh.due.getTime(),
          stability: fresh.stability,
          difficulty: fresh.difficulty,
          elapsedDays: fresh.elapsed_days,
          scheduledDays: fresh.scheduled_days,
          learningSteps: fresh.learning_steps,
          reps: fresh.reps,
          lapses: fresh.lapses,
          state: fresh.state,
          lastReview: null
        },
        now
      )
      vocab.softDeleteSiblings(profileId, contentId, now)
      return true
    })
  }

  /** Tạo thẻ phụ cho các từ đã thuộc (sau khi bật thêm hướng thẻ trong cài đặt) */
  backfill(): number {
    return this.deps.srs.backfillSiblings()
  }

  /** Lưu nhiều từ một lúc (vd các từ khó của bài đọc): tra từ điển để lấy từ gốc, tạo thẻ cho từ mới */
  saveMany(items: Array<{ text: string; context?: string | null }>): SaveManyResult {
    const { dictionary, vocabService, profiles } = this.deps
    const options = { childSafe: profiles.active().isChild }
    const result: SaveManyResult = { saved: 0, already: 0, missing: 0 }
    for (const item of items) {
      const entry = dictionary.lookup(item.text, undefined, options).entries[0]
      if (!entry || entry.via === 'search') {
        result.missing++
        continue
      }
      const saved = vocabService.save({
        contentId: entry.id,
        text: entry.lemma,
        context: item.context ?? null
      })
      if (saved.isNew) result.saved++
      else result.already++
    }
    return result
  }

  /** Lưu một mẫu câu của Phrasebook vào sổ thẻ */
  savePhrase(contentId: string): SaveWordResult {
    const phrase = this.deps.phrasebook.find(contentId)
    if (!phrase) throw new AppError('NOT_FOUND', 'errors.notFound')
    return this.deps.vocabService.save({ contentId, text: phrase.en, context: null })
  }

  /** Dựng thẻ hiển thị từ một dòng srs_cards; null nếu không còn nội dung (từ/mẫu câu đã bị gỡ) */
  private toCard(row: SrsCardRow): StudyCard | null {
    const { dictionary, phrasebook, srs } = this.deps
    const base = {
      cardId: row.id,
      context: row.contextSentence,
      isNew: row.state === 0,
      choices: null as string[] | null,
      choiceAnswer: null as number | null,
      intervals: srs.previewIntervals(row.id)
    }

    if (isPhraseId(row.contentId)) {
      const phrase = phrasebook.find(row.contentId)
      if (!phrase) return null
      const direction = row.direction === 'cloze' ? 'en_vi' : toDirection(row.direction)
      return {
        ...base,
        direction,
        lemma: phrase.en,
        ipaUs: null,
        ipaUk: null,
        pos: ['phrase'],
        level: phrase.level ?? 'A2_1',
        vi: [phrase.vi],
        viGenerated: false,
        senses: [],
        examples: [],
        context: phrase.note ?? null,
        cloze: null,
        answers: [phrase.en],
        hint: null,
        isPhrase: true,
        choices: null,
        choiceAnswer: null
      }
    }

    const entry = dictionary.entryById(row.contentId)
    if (!entry) return null
    let direction = toDirection(row.direction)
    let cloze: StudyCard['cloze'] = null
    let hint: string | null = null
    let answers = [entry.lemma]
    if (direction === 'cloze') {
      // Câu ngữ cảnh người dùng đã lưu trước, rồi đến câu ví dụ của từ điển
      const candidates = [
        ...(row.contextSentence ? [{ en: row.contextSentence, vi: null as string | null }] : []),
        ...entry.examples
      ]
      for (const c of candidates) {
        const made = makeCloze(c.en, entry.lemma)
        if (made) {
          cloze = made
          hint = c.vi ?? entry.vi[0] ?? null
          answers = [made.answer, entry.lemma]
          break
        }
      }
      if (!cloze) direction = 'en_vi' // không dựng được câu → ôn như thẻ thường
    }
    // Thẻ nhận diện: thêm trắc nghiệm 4 nghĩa (cùng định dạng nghĩa với mascot) nếu bật trong cài đặt
    const choices =
      direction === 'en_vi' && this.deps.settings.get('review.choices')
        ? this.buildChoices(row.contentId)
        : null
    return {
      ...base,
      ...(choices ?? {}),
      direction,
      lemma: entry.lemma,
      ipaUs: entry.ipaUs,
      ipaUk: entry.ipaUk,
      pos: entry.pos,
      level: entry.level,
      vi: entry.vi,
      viGenerated: entry.viGenerated,
      senses: entry.senses,
      examples: entry.examples,
      cloze,
      answers,
      hint,
      isPhrase: false
    }
  }

  /** 4 lựa chọn nghĩa (đã xáo) + chỉ số đáp án đúng; null nếu không dựng được (từ không có nghĩa / ít từ nhiễu) */
  private buildChoices(contentId: string): { choices: string[]; choiceAnswer: number } | null {
    const { dictionary, profiles } = this.deps
    const data = dictionary.quizData(contentId, { childSafe: profiles.active().isChild })
    if (!data || data.distractors.length < 3) return null
    const options = [data.correct, ...data.distractors]
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor((this.deps.random ?? Math.random)() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    return { choices: options, choiceAnswer: options.indexOf(data.correct) }
  }

  private toWordItem(row: SrsCardRow, siblings: number): WordListItem {
    const { dictionary, phrasebook } = this.deps
    const common = {
      cardId: row.id,
      contentId: row.contentId,
      state: row.state,
      due: row.due,
      reps: row.reps,
      lapses: row.lapses,
      savedAt: row.createdAt,
      suspended: row.suspended,
      siblings
    }
    if (isPhraseId(row.contentId)) {
      const phrase = phrasebook.find(row.contentId)
      return {
        ...common,
        lemma: phrase?.en ?? row.contentId,
        vi: phrase?.vi ?? null,
        level: phrase?.level ?? null,
        isPhrase: true
      }
    }
    const entry = dictionary.entryById(row.contentId)
    return {
      ...common,
      lemma: entry?.lemma ?? row.contentId.replace(/^word:en:/, ''),
      vi: entry?.vi.slice(0, 3).join('; ') || null,
      level: entry?.level ?? null,
      isPhrase: false
    }
  }
}

function toDirection(direction: SrsCardRow['direction']): StudyCard['direction'] {
  return direction === 'audio_picture' ? 'en_vi' : direction
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
