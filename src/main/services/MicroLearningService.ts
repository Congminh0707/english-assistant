import { LEVEL_CODES, type LevelCode } from '@shared/schemas/content'
import type { NewWordQuiz, Quiz, QuizAnswerResult, ReviewQuiz } from '@shared/schemas/quiz'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { DictionaryService } from '../content/DictionaryService'
import type { VocabRepository } from '../db/repositories/VocabRepository'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'
import type { SrsRating, SrsService } from './SrsService'

/** Trả lời đúng trong thời gian này → "Được"; chậm hơn → "Khó" */
const FAST_ANSWER_MS = 6000
/** Câu hỏi chưa trả lời bị bỏ sau thời gian này */
const QUIZ_TTL_MS = 30 * 60_000

interface PendingReview {
  kind: 'review'
  cardId: string
  correctIndex: number
  correctText: string
  createdAt: number
}

/**
 * Micro-learning qua mascot (docs/01-features.md D1–D2):
 * ưu tiên hỏi ôn thẻ SRS đến hạn (trắc nghiệm 4 đáp án); không có thẻ nào thì giới thiệu "Từ của khoảnh khắc".
 * Đáp án đúng chỉ nằm ở main; renderer gửi lựa chọn, main chấm và cập nhật lịch FSRS.
 */
export class MicroLearningService {
  private readonly pending = new Map<string, PendingReview>()
  private seq = 0

  constructor(
    private readonly deps: {
      srs: SrsService
      dictionary: DictionaryService
      vocab: VocabRepository
      profiles: ProfileService
      settings: SettingsService
      clock: Clock
      random?: () => number
    }
  ) {}

  /** Câu hỏi tiếp theo cho mascot, hoặc null nếu chưa có gói từ điển / không chọn được từ */
  next(): Quiz | null {
    this.cleanup()
    return this.nextReview() ?? this.nextNewWord()
  }

  answer(quizId: string, choiceIndex: number, elapsedMs: number): QuizAnswerResult {
    const quiz = this.pending.get(quizId)
    if (!quiz) throw new AppError('NOT_FOUND', 'errors.notFound')
    this.pending.delete(quizId)
    const correct = choiceIndex === quiz.correctIndex
    const rating: SrsRating = !correct ? 1 : elapsedMs <= FAST_ANSWER_MS ? 3 : 2
    const { intervalDays } = this.deps.srs.review(quiz.cardId, rating, {
      elapsedMs,
      source: 'mascot'
    })
    return {
      correct,
      correctIndex: quiz.correctIndex,
      correctText: quiz.correctText,
      intervalDays
    }
  }

  private nextReview(): ReviewQuiz | null {
    const due = this.deps.srs.dueCards(10)
    for (const card of due) {
      const data = this.deps.dictionary.quizData(card.contentId, this.dictionaryOptions())
      if (!data || data.distractors.length < 1) continue
      const choices = this.shuffle([data.correct, ...data.distractors])
      const id = this.newId('review')
      this.pending.set(id, {
        kind: 'review',
        cardId: card.id,
        correctIndex: choices.indexOf(data.correct),
        correctText: data.correct,
        createdAt: this.deps.clock.now()
      })
      return {
        kind: 'review',
        id,
        lemma: data.entry.lemma,
        ipa: data.entry.ipaUs ?? data.entry.ipaUk,
        pos: data.entry.pos,
        choices,
        dueCount: this.deps.srs.dueCount()
      }
    }
    return null
  }

  private nextNewWord(): NewWordQuiz | null {
    const level = this.deps.settings.get('learning.level')
    const saved = new Set(this.deps.vocab.savedContentIdList(this.deps.profiles.activeId()))
    const entry = this.deps.dictionary.randomWord(
      nearbyLevels(level),
      saved,
      this.dictionaryOptions()
    )
    if (!entry) return null
    return {
      kind: 'new',
      id: this.newId('new'),
      wordId: entry.id,
      lemma: entry.lemma,
      ipa: entry.ipaUs ?? entry.ipaUk,
      pos: entry.pos,
      level: entry.level,
      vi: entry.vi.slice(0, 3),
      example: entry.examples[0] ?? null
    }
  }

  /** Profile trẻ em không được hỏi/gợi ý từ nhạy cảm */
  private dictionaryOptions(): { childSafe: boolean } {
    return { childSafe: this.deps.profiles.active().isChild }
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

  private newId(kind: string): string {
    return `quiz:${kind}:${this.deps.clock.now()}:${++this.seq}`
  }

  private cleanup(): void {
    const now = this.deps.clock.now()
    for (const [id, q] of this.pending) if (now - q.createdAt > QUIZ_TTL_MS) this.pending.delete(id)
  }
}

/** Level hiện tại + level kế tiếp (từ mới hơi khó hơn một chút) */
function nearbyLevels(level: LevelCode): LevelCode[] {
  const i = LEVEL_CODES.indexOf(level)
  return LEVEL_CODES.slice(Math.max(0, i), i + 2)
}
