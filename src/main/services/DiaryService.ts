import { fnv1a64 } from '@shared/audioPack'
import {
  DIARY_MAX_CHARS,
  DIARY_MIN_WORDS,
  DIARY_PROMPT_COUNT,
  DiaryChangeSchema,
  diaryWordCount,
  type DiaryChange,
  type DiaryCorrectResult,
  type DiaryEntry,
  type DiaryToday
} from '@shared/schemas/diary'
import { z } from 'zod'
import type { AiService } from '../ai/AiService'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { localDayKey } from '../core/localDay'
import type { DiaryEntryRow, DiaryRepository } from '../db/repositories/DiaryRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'
import type { XpService } from './XpService'

export const DIARY_REASON = 'diary.written'
const XP_WRITTEN = 10
const COINS_WRITTEN = 3

/** Phần JSON lưu ở cột changes_json */
const StoredCorrectionSchema = z.object({
  changes: z.array(DiaryChangeSchema),
  praise_vi: z.string()
})

function toEntry(row: DiaryEntryRow): DiaryEntry {
  let changes: DiaryChange[] = []
  let praise: string | null = null
  if (row.changesJson) {
    try {
      const parsed = StoredCorrectionSchema.safeParse(JSON.parse(row.changesJson))
      if (parsed.success) {
        changes = parsed.data.changes
        praise = parsed.data.praise_vi || null
      }
    } catch {
      // JSON hỏng: coi như chưa có danh sách sửa (vẫn giữ bản corrected)
    }
  }
  return {
    id: row.id,
    day: row.day,
    text: row.text,
    corrected: row.corrected,
    changes,
    praise,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Nhật ký tiếng Anh buổi tối (docs/07 §14, docs/01 G3): mỗi ngày một đoạn ngắn; AI (key người dùng) sửa nhẹ khi bấm.
 * Viết ≥ 10 từ lần đầu trong ngày: +10 XP, +3 xu (một lần/ngày). Chỉ hồ sơ người lớn. Không ghi log nội dung.
 */
export class DiaryService {
  constructor(
    private readonly deps: {
      repo: DiaryRepository
      xpRepo: XpRepository
      xp: XpService
      ai: Pick<AiService, 'correctDiary' | 'status'>
      profiles: Pick<ProfileService, 'active'>
      settings: Pick<SettingsService, 'get'>
      clock: Clock
    }
  ) {}

  private day(): string {
    return localDayKey(this.deps.clock.now())
  }

  /** Hồ sơ người lớn đang dùng (trẻ em → null) */
  private adultId(): string | null {
    const profile = this.deps.profiles.active()
    return profile.isChild ? null : profile.id
  }

  today(): DiaryEntry | null {
    const id = this.adultId()
    if (!id) return null
    const row = this.deps.repo.get(id, this.day())
    return row ? toEntry(row) : null
  }

  /** Dữ liệu trang nhật ký: entry hôm nay, câu gợi ý, AI dùng được không */
  todayView(): DiaryToday {
    const ai = this.deps.ai.status()
    const adult = this.adultId() !== null
    return {
      entry: this.today(),
      promptKey: this.prompt(),
      aiReady: adult && ai.enabled && ai.hasKey
    }
  }

  save(rawText: string): DiaryEntry {
    const id = this.adultId()
    if (!id) throw new AppError('FORBIDDEN', 'errors.forbidden')
    const text = rawText.trim()
    if (!text || text.length > DIARY_MAX_CHARS) {
      throw new AppError('VALIDATION', 'errors.validation')
    }
    const day = this.day()
    const row = this.deps.repo.upsertText(id, day, text, this.deps.clock.now())
    if (
      diaryWordCount(text) >= DIARY_MIN_WORDS &&
      !this.deps.xpRepo.hasEvent(id, DIARY_REASON, day)
    ) {
      this.deps.xp.grant({
        amount: XP_WRITTEN,
        coins: COINS_WRITTEN,
        reason: DIARY_REASON,
        refId: day
      })
    }
    return toEntry(row)
  }

  /**
   * AI sửa đoạn hôm nay; lưu bản sửa + danh sách thay đổi. Không thưởng XP.
   * `stale = true`: người dùng đã lưu chữ khác trong lúc chờ AI → bỏ bản sửa, trả entry hiện tại.
   */
  async correct(): Promise<DiaryCorrectResult> {
    const id = this.adultId()
    if (!id) throw new AppError('FORBIDDEN', 'errors.aiOff')
    const day = this.day()
    const row = this.deps.repo.get(id, day)
    if (!row) throw new AppError('NOT_FOUND', 'errors.notFound')
    const out = await this.deps.ai.correctDiary({
      text: row.text,
      level: this.deps.settings.get('learning.level')
    })
    // Trong lúc chờ AI người dùng đã lưu chữ khác → bỏ bản sửa của chữ cũ
    const current = this.deps.repo.get(id, day)
    if (!current || current.text !== row.text) {
      return { entry: toEntry(current ?? row), stale: true }
    }
    const json = JSON.stringify({ changes: out.changes, praise_vi: out.praise_vi })
    const now = this.deps.clock.now()
    this.deps.repo.setCorrection(row.id, out.corrected, json, now)
    return {
      entry: toEntry({ ...current, corrected: out.corrected, changesJson: json, updatedAt: now }),
      stale: false
    }
  }

  list(limit = 30): DiaryEntry[] {
    const id = this.adultId()
    if (!id) return []
    return this.deps.repo.recent(id, limit).map(toEntry)
  }

  /** Khoá i18n câu gợi ý của hôm nay: study.diary.prompts.<1..12>, cố định trong một ngày */
  prompt(): string {
    const n = (parseInt(fnv1a64(this.day()).slice(0, 8), 16) % DIARY_PROMPT_COUNT) + 1
    return `study.diary.prompts.${n}`
  }
}
