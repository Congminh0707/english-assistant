import {
  bandDifficultyLevel,
  bandOfLevel,
  FREE_WRITING_FEEDBACK_MIN_WORDS,
  FREE_WRITING_PAGE_SIZE,
  FREE_WRITING_REWARD_MIN_WORDS,
  freeWritingWordCount,
  lengthRange
} from '@shared/freeWriting'
import { WritingFeedbackSchema, type WritingFeedback } from '@shared/schemas/ai'
import { WRITE_PASS } from '@shared/writing'
import {
  FreeWritingBandSchema,
  FreeWritingLengthSchema,
  type FreeWritingCreateInput,
  type FreeWritingEntry,
  type FreeWritingFeedbackResult,
  type FreeWritingList,
  type FreeWritingUpdateInput,
  type FreeWritingView
} from '@shared/schemas/freeWriting'
import type { AiService } from '../ai/AiService'
import type { FreeWritingTopics } from '../content/FreeWritingTopics'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { localDayKey } from '../core/localDay'
import type {
  FreeWritingRepository,
  FreeWritingRow
} from '../db/repositories/FreeWritingRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { ProgressService } from './ProgressService'
import type { SettingsService } from './SettingsService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

export const FREE_WRITING_REASON = 'free-writing.written'
const XP_WRITTEN = 15
const COINS_WRITTEN = 5
/** Dạng bài ghi ở exercise_stats cho viết tự do (nguồn `free-writing`, kỹ năng `writing`) */
export const FREE_WRITING_KIND = 'free'

function parseFeedback(json: string | null): WritingFeedback | null {
  if (!json) return null
  try {
    const parsed = WritingFeedbackSchema.safeParse(JSON.parse(json))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function toEntry(row: FreeWritingRow): FreeWritingEntry {
  const feedback = parseFeedback(row.feedbackJson)
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    topicId: row.topicId,
    title: row.title,
    task: row.task,
    // Cột text: giá trị lạ (không thể có qua service) rơi về mức thấp nhất thay vì làm hỏng cả danh sách
    band: FreeWritingBandSchema.catch('A1').parse(row.band),
    length: FreeWritingLengthSchema.catch('short').parse(row.length),
    minWords: row.minWords,
    maxWords: row.maxWords,
    text: row.text,
    words: row.wordCount,
    feedback,
    score: feedback ? row.score : null
  }
}

/** Lý do không có nhận xét AI (khoá i18n): lỗi có kiểu của AiService giữ nguyên, lỗi khác → errors.aiFailed */
function aiReasonOf(err: unknown): string {
  return err instanceof AppError ? err.messageKey : 'errors.aiFailed'
}

/**
 * Viết tự do theo đề (docs/07 "Viết tự do", decisions #60). Đề tự soạn lấy từ nội dung theo mã (renderer không gửi chữ
 * đề), hoặc đề tự đặt ≤ 200 ký tự; chữ đề luôn vào prompt AI như dữ liệu trong thẻ <task> (writing_feedback).
 * Lưu trước rồi mới xin nhận xét → AI tắt/hết lượt/lỗi không làm mất bài, bấm lại sau được. Không chấm đạt/trượt
 * trên giao diện; nhận xét AI đầu tiên của mỗi bài được tính một lần vào rating Viết (decisions #62). Bài đầu tiên ≥ 20 từ mỗi ngày: +15 XP, +5 xu (một lần/ngày). Chỉ hồ sơ người lớn; mọi truy vấn theo
 * id lọc theo hồ sơ đang dùng. Không ghi log chữ người học.
 */
export class FreeWritingService {
  constructor(
    private readonly deps: {
      repo: FreeWritingRepository
      xpRepo: XpRepository
      xp: XpService
      topics: FreeWritingTopics
      ai: Pick<AiService, 'writingFeedback' | 'status'>
      profiles: Pick<ProfileService, 'active' | 'activeId'>
      settings: Pick<SettingsService, 'get'>
      progress: Pick<ProgressService, 'record'>
      transaction: Transaction
      clock: Clock
    }
  ) {}

  /** Hồ sơ người lớn đang dùng; trẻ em → FORBIDDEN (như nhật ký) */
  private adultId(): string {
    const profile = this.deps.profiles.active()
    if (profile.isChild) throw new AppError('FORBIDDEN', 'errors.forbidden')
    return profile.id
  }

  private row(profileId: string, id: string): FreeWritingRow {
    const row = this.deps.repo.get(profileId, id)
    if (!row) throw new AppError('NOT_FOUND', 'errors.notFound')
    return row
  }

  view(): FreeWritingView {
    const profileId = this.adultId()
    const ai = this.deps.ai.status()
    return {
      profileId,
      topics: this.deps.topics.list(),
      band: bandOfLevel(this.deps.settings.get('learning.level')),
      aiReady: ai.enabled && ai.ready
    }
  }

  create(input: FreeWritingCreateInput): FreeWritingEntry {
    const profileId = this.adultId()
    let topic: {
      topicId: string | null
      title: string
      task: string
      band: FreeWritingEntry['band']
    }
    if (input.topic.kind === 'topic') {
      const found = this.deps.topics.find(input.topic.id)
      if (!found) throw new AppError('NOT_FOUND', 'errors.notFound')
      topic = { topicId: found.id, title: found.title, task: found.prompt, band: found.band }
    } else {
      const text = input.topic.text.trim()
      topic = { topicId: null, title: text, task: text, band: input.topic.band }
    }
    const text = input.text.trim()
    const range = lengthRange(topic.band, input.length)
    const wordCount = freeWritingWordCount(text)
    const row = this.deps.repo.insert(
      {
        profileId,
        ...topic,
        length: input.length,
        minWords: range.min,
        maxWords: range.max,
        text,
        wordCount
      },
      this.deps.clock.now()
    )
    this.reward(profileId, wordCount)
    return toEntry(row)
  }

  update(input: FreeWritingUpdateInput): FreeWritingEntry {
    const profileId = this.adultId()
    const text = input.text.trim()
    const wordCount = freeWritingWordCount(text)
    const before = this.row(profileId, input.id)
    const now = this.deps.clock.now()
    const row = this.deps.repo.updateText(profileId, input.id, text, wordCount, now)
    if (!row) throw new AppError('NOT_FOUND', 'errors.notFound')
    // Chỉ thưởng khi sửa chữ của một bài viết hôm nay (mở bài cũ bấm Sửa → Lưu không phải "bài mới" của hôm nay)
    if (before.text !== text && localDayKey(before.createdAt) === localDayKey(now)) {
      this.reward(profileId, wordCount)
    }
    return toEntry(row)
  }

  get(id: string): FreeWritingEntry {
    return toEntry(this.row(this.adultId(), id))
  }

  remove(id: string): void {
    if (!this.deps.repo.remove(this.adultId(), id)) {
      throw new AppError('NOT_FOUND', 'errors.notFound')
    }
  }

  list(offset: number): FreeWritingList {
    const profileId = this.adultId()
    return {
      entries: this.deps.repo
        .page(profileId, offset, FREE_WRITING_PAGE_SIZE)
        .map(toEntry)
        .map(({ id, createdAt, title, words, score }) => ({ id, createdAt, title, words, score })),
      total: this.deps.repo.count(profileId)
    }
  }

  /**
   * Xin AI nhận xét bài đã lưu. Đã có nhận xét → trả luôn (không tốn lượt). AI không dùng được / lỗi → `aiReason`,
   * bài giữ nguyên. Chữ đổi trong lúc chờ → `stale`, bỏ nhận xét của chữ cũ.
   */
  async feedback(id: string): Promise<FreeWritingFeedbackResult> {
    const profileId = this.adultId()
    const row = this.row(profileId, id)
    if (row.wordCount < FREE_WRITING_FEEDBACK_MIN_WORDS) {
      throw new AppError('VALIDATION', 'errors.validation')
    }
    if (parseFeedback(row.feedbackJson))
      return { entry: toEntry(row), aiReason: null, stale: false }
    if (!this.deps.ai.status().enabled) {
      return { entry: toEntry(row), aiReason: 'errors.aiOff', stale: false }
    }
    let feedback: WritingFeedback
    try {
      feedback = await this.deps.ai.writingFeedback({
        prompt: row.task,
        text: row.text,
        minWords: row.minWords,
        maxWords: row.maxWords,
        level: this.deps.settings.get('learning.level')
      })
    } catch (err) {
      const current = this.deps.repo.get(profileId, id) ?? row
      return { entry: toEntry(current), aiReason: aiReasonOf(err), stale: false }
    }
    const current = this.row(profileId, id)
    if (current.text !== row.text) return { entry: toEntry(current), aiReason: null, stale: true }
    const now = this.deps.clock.now()
    const json = JSON.stringify(feedback)
    this.deps.transaction(() => {
      this.deps.repo.setFeedback(profileId, id, json, feedback.overall, now)
      this.rate(profileId, id, current, feedback.overall, now)
    })
    return {
      entry: toEntry({ ...current, feedbackJson: json, score: feedback.overall, updatedAt: now }),
      aiReason: null,
      stale: false
    }
  }

  /**
   * Tính bài vào rating Viết, tối đa một lần mỗi bài (cột `rated_at`): một "câu" ở độ khó theo bậc đề, đúng khi
   * `overall ≥ WRITE_PASS`. `ProgressService` ghi cho hồ sơ đang dùng → đổi hồ sơ trong lúc chờ AI thì bỏ qua (chỉ lưu
   * nhận xét, `rated_at` vẫn null). Gọi trong transaction cùng lúc lưu nhận xét.
   */
  private rate(
    profileId: string,
    id: string,
    row: FreeWritingRow,
    overall: number,
    now: number
  ): void {
    if (this.deps.profiles.activeId() !== profileId) return
    if (!this.deps.repo.markRated(profileId, id, now)) return
    this.deps.progress.record({
      source: 'free-writing',
      kind: FREE_WRITING_KIND,
      skill: 'writing',
      level: bandDifficultyLevel(FreeWritingBandSchema.catch('A1').parse(row.band)),
      correct: overall >= WRITE_PASS ? 1 : 0,
      total: 1
    })
  }

  /** Bài đầu tiên đủ từ trong ngày cục bộ: +15 XP, +5 xu (idempotent theo ngày) */
  private reward(profileId: string, wordCount: number): void {
    const day = localDayKey(this.deps.clock.now())
    if (wordCount < FREE_WRITING_REWARD_MIN_WORDS) return
    if (this.deps.xpRepo.hasEvent(profileId, FREE_WRITING_REASON, day)) return
    this.deps.xp.grant({
      amount: XP_WRITTEN,
      coins: COINS_WRITTEN,
      reason: FREE_WRITING_REASON,
      refId: day
    })
  }
}
