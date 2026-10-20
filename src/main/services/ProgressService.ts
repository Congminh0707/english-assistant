import {
  eloUpdate,
  MIN_GAMES_FOR_SUGGESTION,
  ratingToLevel,
  SKILLS,
  type ProgressSource,
  type Skill
} from '@shared/progress'
import { levelMidRating, type LevelCode } from '@shared/schemas/content/level'
import type { Clock } from '../core/Clock'
import { localDayKey } from '../core/localDay'
import type { AccuracyRow, ProgressRepository } from '../db/repositories/ProgressRepository'
import type { UsageRepository } from '../db/repositories/UsageRepository'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'

export interface SkillRating {
  skill: Skill
  rating: number
  level: LevelCode
  games: number
  /** Đủ dữ liệu để tin rating (dùng cho gợi ý lên cấp) */
  reliable: boolean
}

const SKILL_LEVEL_SETTING = {
  vocab: 'learning.levelVocab',
  grammar: 'learning.levelGrammar',
  reading: 'learning.levelReading',
  listening: 'learning.levelListening'
} as const

/**
 * Ghi kết quả bài tập theo dạng bài/kỹ năng (cho thống kê độ chính xác) và cập nhật rating Elo của kỹ năng đó.
 * Độ khó của câu hỏi lấy từ level của bài/nội dung; rating khởi đầu lấy từ trình độ theo kỹ năng của bài kiểm tra đầu vào.
 */
export class ProgressService {
  constructor(
    private readonly deps: {
      repo: ProgressRepository
      usage?: UsageRepository
      profiles: ProfileService
      settings: SettingsService
      clock: Clock
    }
  ) {}

  /** Ghi một loạt `total` câu cùng dạng, đúng `correct` câu, ở độ khó `level` */
  record(input: {
    source: ProgressSource
    kind: string
    skill: Skill
    level: LevelCode
    correct: number
    total: number
  }): void {
    const { repo, profiles, clock } = this.deps
    if (input.total <= 0) return
    const profileId = profiles.activeId()
    const now = clock.now()
    const correct = Math.max(0, Math.min(input.correct, input.total))
    repo.addStat(
      {
        profileId,
        day: localDayKey(now),
        source: input.source,
        kind: input.kind,
        skill: input.skill,
        correct,
        total: input.total
      },
      now
    )
    const current = this.ratingOf(profileId, input.skill)
    repo.setRating(
      profileId,
      input.skill,
      eloUpdate(current.rating, levelMidRating(input.level), correct, input.total, current.games),
      current.games + input.total,
      now
    )
  }

  private ratingOf(profileId: string, skill: Skill): { rating: number; games: number } {
    const row = this.deps.repo.ratings(profileId).find((r) => r.skill === skill)
    if (row) return { rating: row.rating, games: row.games }
    return { rating: levelMidRating(this.deps.settings.get(SKILL_LEVEL_SETTING[skill])), games: 0 }
  }

  /** Rating hiện tại của từng kỹ năng (kỹ năng chưa có dữ liệu lấy từ trình độ của bài kiểm tra đầu vào) */
  ratings(): SkillRating[] {
    const profileId = this.deps.profiles.activeId()
    return SKILLS.map((skill) => {
      const { rating, games } = this.ratingOf(profileId, skill)
      return {
        skill,
        rating: Math.round(rating),
        level: ratingToLevel(rating),
        games,
        reliable: games >= MIN_GAMES_FOR_SUGGESTION
      }
    })
  }

  /** Đặt lại rating của một kỹ năng sau bài kiểm tra đầu vào / lên cấp (giữ số câu đã có) */
  setLevel(skill: Skill, level: LevelCode): void {
    const { repo, profiles, clock } = this.deps
    const profileId = profiles.activeId()
    repo.setRating(
      profileId,
      skill,
      levelMidRating(level),
      this.ratingOf(profileId, skill).games,
      clock.now()
    )
  }

  /** Cộng thời gian đang dùng app (giao diện báo định kỳ khi cửa sổ đang hiện); chặn số giây phóng đại */
  tickTime(seconds: number): void {
    const { usage, profiles, clock } = this.deps
    const add = Math.max(0, Math.min(60, Math.round(seconds)))
    if (!usage || add <= 0) return
    const now = clock.now()
    usage.addSeconds(profiles.activeId(), localDayKey(now), add, now)
  }

  /** Độ chính xác từ `fromDay` trở đi */
  accuracySince(fromDay: string): AccuracyRow[] {
    return this.deps.repo.accuracySince(this.deps.profiles.activeId(), fromDay)
  }
}
