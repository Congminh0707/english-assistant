import { createEmptyCard } from 'ts-fsrs'
import {
  isPictureContentId,
  KIDS_MAX_REWARDS_PER_DAY,
  KIDS_NEW_PER_DAY,
  KIDS_PICTURE_ORDER,
  KIDS_TICK_MAX_SECONDS,
  pickChoices,
  pictureContentId,
  pictureIdOf,
  ratingFromTries,
  starsFor
} from '@shared/kids'
import { PICTURE_WORDS } from '@shared/pictures'
import type {
  KidsCard,
  KidsCompleteResult,
  KidsHome,
  KidsUnits,
  UsageStatus
} from '@shared/schemas/kids'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { localDayKey, startOfLocalDay } from '../core/localDay'
import type { KidsLibrary } from '../content/KidsLibrary'
import type { LessonRepository } from '../db/repositories/LessonRepository'
import type { UsageRepository } from '../db/repositories/UsageRepository'
import type { SrsCardRow, VocabRepository } from '../db/repositories/VocabRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { InventoryService } from './InventoryService'
import type { PetService } from './PetService'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'
import type { SrsService } from './SrsService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

/** Hoạt động lưu tiến độ ở lesson_progress với id 'kids.<mã hoạt động>' */
const PROGRESS_PREFIX = 'kids.'
const ACTIVITY_REASON = 'kids.activity'
const REWARD_REASON = 'kids.reward'
/** Đồ ăn thưởng cho bé (không gồm bánh sinh nhật hiếm) */
const REWARD_FOODS = ['food:onigiri', 'food:cake', 'food:watermelon', 'food:milk-tea'] as const
const XP_ACTIVITY = 10
const COINS_ACTIVITY = 5
const PASS_SCORE = 50

/**
 * Chế độ trẻ em: bộ thẻ "nghe → chạm hình" (SRS hướng audio_picture), hoạt động chữ cái/âm/ghép âm/từ nhìn là nhớ,
 * album sticker, quà đồ ăn cho thú cưng và giới hạn thời gian dùng mỗi ngày.
 * Trẻ không thấy chữ số/mức chấm: câu trả lời chỉ quy ra Quên/Khó/Được/Dễ để dùng chung lịch FSRS.
 */
export class KidsService {
  constructor(
    private readonly deps: {
      library: KidsLibrary
      vocab: VocabRepository
      lessonRepo: LessonRepository
      xpRepo: XpRepository
      usage: UsageRepository
      srs: SrsService
      xp: XpService
      inventory: InventoryService
      pet: PetService
      profiles: ProfileService
      settings: SettingsService
      clock: Clock
      transaction: Transaction
      random?: () => number
      /** Có đặt PIN phụ huynh chưa (để giao diện biết có cần hướng dẫn đặt PIN) */
      pinSet: () => boolean
      /** Số nơi đã xong / tổng số nơi trên bản đồ thế giới (KidsWorldService, nối qua hàm) */
      worldProgress?: () => { done: number; total: number }
      /**
       * Phần ôn (kids:next) tự đưa hình mới vào học theo KIDS_PICTURE_ORDER. Tắt khi có bản đồ thế giới:
       * từ mới chỉ vào qua lượt chơi ở các nơi (docs/19 §7.2). Mặc định bật.
       */
      introduceInReview?: () => boolean
    }
  ) {}

  // --- Thẻ nghe → chạm hình ---

  /** Thẻ kế tiếp: thẻ đến hạn, hoặc hình mới (tối đa KIDS_NEW_PER_DAY mỗi ngày); null khi hôm nay đã xong */
  nextCard(): { card: KidsCard | null; dueCount: number } {
    const { srs, vocab, profiles, clock } = this.deps
    const profileId = profiles.activeId()
    const now = clock.now()
    let row: SrsCardRow | undefined = srs.dueCards(1, ['audio_picture'], false)[0]
    if (!row) {
      const introduced = vocab.countCardsCreatedSince(
        profileId,
        'audio_picture',
        startOfLocalDay(now)
      )
      const allowed = this.deps.introduceInReview?.() ?? true
      if (allowed && introduced < KIDS_NEW_PER_DAY) row = this.introduceNext(profileId, now)
    }
    return { card: row ? this.toCard(row) : null, dueCount: srs.dueCount(['audio_picture']) }
  }

  /** Ghi kết quả một thẻ: tries 1 = đúng ngay, 2 = đúng lần hai, 0 = không ra */
  rateCard(cardId: string, tries: 0 | 1 | 2, elapsedMs: number): { stickerNew: boolean } {
    const { srs, vocab, profiles } = this.deps
    const profileId = profiles.activeId()
    const row = vocab.findCard(profileId, cardId)
    if (!row || row.direction !== 'audio_picture')
      throw new AppError('NOT_FOUND', 'errors.notFound')
    const rating = ratingFromTries(tries, elapsedMs)
    const had = new Set(vocab.earnedPictureContentIds(profileId)).has(row.contentId)
    srs.review(cardId, rating, { elapsedMs, source: 'study' })
    return { stickerNew: rating >= 3 && !had }
  }

  /** Album sticker: mỗi hình bé đã trả lời tốt một lần thì được dán */
  stickers(): {
    stickers: Array<{ pictureId: string; word: string; vi: string; earned: boolean }>
    earned: number
    total: number
  } {
    const { vocab, profiles } = this.deps
    const earnedIds = new Set(vocab.earnedPictureContentIds(profiles.activeId()))
    const stickers = KIDS_PICTURE_ORDER.map((pictureId) => ({
      pictureId,
      word: PICTURE_WORDS[pictureId]?.en ?? pictureId,
      vi: PICTURE_WORDS[pictureId]?.vi ?? '',
      earned: earnedIds.has(pictureContentId(pictureId))
    }))
    return { stickers, earned: stickers.filter((s) => s.earned).length, total: stickers.length }
  }

  // --- Hoạt động ---

  units(): KidsUnits {
    const progress = this.progressByActivity()
    return {
      units: this.deps.library.units().map((unit) => ({
        id: unit.id,
        title: unit.title,
        vi: unit.vi,
        picture: unit.picture,
        activities: unit.activities.map((a) => ({
          ...a,
          stars: starsFor(progress.get(a.id) ?? null)
        }))
      }))
    }
  }

  activityProgress(): { done: number; total: number } {
    const progress = this.progressByActivity()
    const done = this.deps.library
      .units()
      .flatMap((u) => u.activities)
      .filter((a) => starsFor(progress.get(a.id) ?? null) > 0).length
    return { done, total: this.deps.library.activityCount }
  }

  /** Xong một hoạt động: tính sao, lưu tiến độ; lần đầu hoàn thành được thưởng đồ ăn */
  completeActivity(activityId: string, correct: number, total: number): KidsCompleteResult {
    const { library, lessonRepo, xpRepo, xp, profiles, clock, transaction } = this.deps
    if (!library.activity(activityId) || correct > total) {
      throw new AppError('VALIDATION', 'errors.validation')
    }
    const score = Math.round((correct / total) * 100)
    return transaction(() => {
      const profileId = profiles.activeId()
      lessonRepo.record(
        profileId,
        `${PROGRESS_PREFIX}${activityId}`,
        score,
        score >= PASS_SCORE,
        clock.now()
      )
      const stars = starsFor(score)
      const firstTime = stars > 0 && !xpRepo.hasEvent(profileId, ACTIVITY_REASON, activityId)
      let foodId: string | null = null
      if (firstTime) {
        xp.grant({
          amount: XP_ACTIVITY,
          coins: COINS_ACTIVITY,
          reason: ACTIVITY_REASON,
          refId: activityId
        })
        foodId = this.giveFood()
      }
      return { stars, firstTime, foodId }
    })
  }

  /** Quà đồ ăn khi bé trả lời đúng nhiều câu liên tiếp; null nếu hôm nay đã nhận đủ */
  reward(): string | null {
    const { xpRepo, xp, profiles, clock } = this.deps
    const profileId = profiles.activeId()
    const today = xpRepo.countSince(profileId, REWARD_REASON, startOfLocalDay(clock.now()))
    if (today >= KIDS_MAX_REWARDS_PER_DAY) return null
    xp.grant({ amount: 0, reason: REWARD_REASON, refId: String(clock.now()) })
    return this.giveFood()
  }

  // --- Thời gian dùng ---

  usageStatus(): UsageStatus {
    const { usage, profiles, clock, settings } = this.deps
    const row = usage.get(profiles.activeId(), localDayKey(clock.now()))
    const used = row?.seconds ?? 0
    const daily = settings.get('kids.dailyMinutes') * 60
    const limit = daily > 0 ? daily + (row?.bonusSeconds ?? 0) : 0
    return { usedSeconds: used, limitSeconds: limit, locked: limit > 0 && used >= limit }
  }

  /** Cộng thêm số giây bé đang dùng app (giao diện báo định kỳ khi đang hoạt động) */
  tick(seconds: number): UsageStatus {
    const { usage, profiles, clock } = this.deps
    const now = clock.now()
    const add = Math.max(0, Math.min(KIDS_TICK_MAX_SECONDS, Math.round(seconds)))
    if (add > 0) usage.addSeconds(profiles.activeId(), localDayKey(now), add, now)
    return this.usageStatus()
  }

  home(): KidsHome {
    const { srs, pet, pinSet, worldProgress } = this.deps
    const stickers = this.stickers()
    const progress = this.activityProgress()
    const world = worldProgress?.() ?? { done: 0, total: 0 }
    return {
      petName: pet.get().name,
      dueCount: srs.dueCount(['audio_picture']),
      stickersEarned: stickers.earned,
      stickersTotal: stickers.total,
      activitiesDone: progress.done,
      activitiesTotal: progress.total,
      worldPlacesDone: world.done,
      worldPlacesTotal: world.total,
      pinSet: pinSet(),
      usage: this.usageStatus()
    }
  }

  // --- nội bộ ---

  private rnd(): number {
    return (this.deps.random ?? Math.random)()
  }

  /** Tặng một món ăn ngẫu nhiên cho thú cưng (dùng chung cho thưởng hoạt động và rương bản đồ) */
  giveFood(): string {
    const foodId = REWARD_FOODS[Math.floor(this.rnd() * REWARD_FOODS.length)]
    this.deps.inventory.add(foodId, 1)
    return foodId
  }

  private progressByActivity(): Map<string, number> {
    const rows = this.deps.lessonRepo.list(this.deps.profiles.activeId())
    return new Map(
      rows
        .filter((r) => r.lessonId.startsWith(PROGRESS_PREFIX))
        .map((r) => [r.lessonId.slice(PROGRESS_PREFIX.length), r.best])
    )
  }

  /** Đưa hình kế tiếp (chưa có thẻ) vào học: tạo thẻ mới đến hạn ngay */
  private introduceNext(profileId: string, now: number): SrsCardRow | undefined {
    const have = new Set(this.deps.vocab.contentIdsByDirection(profileId, 'audio_picture'))
    const pictureId = KIDS_PICTURE_ORDER.find((id) => !have.has(pictureContentId(id)))
    return pictureId ? this.introducePicture(profileId, pictureId, now) : undefined
  }

  /** Tạo thẻ hình mới (đến hạn ngay) cho một hình — dùng cả khi bé học từ mới ở bản đồ thế giới */
  introducePicture(profileId: string, pictureId: string, now: number): SrsCardRow {
    const card = createEmptyCard(new Date(now))
    return this.deps.vocab.insertCard(
      {
        profileId,
        contentId: pictureContentId(pictureId),
        direction: 'audio_picture',
        contextSentence: null,
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
  }

  private toCard(row: SrsCardRow): KidsCard | null {
    if (!isPictureContentId(row.contentId)) return null
    const pictureId = pictureIdOf(row.contentId)
    const word = PICTURE_WORDS[pictureId]
    if (!word) return null
    const learned = this.deps.vocab
      .contentIdsByDirection(this.deps.profiles.activeId(), 'audio_picture')
      .map(pictureIdOf)
    return {
      cardId: row.id,
      pictureId,
      word: word.en,
      vi: word.vi,
      choices: pickChoices(pictureId, learned, 3, () => this.rnd()),
      isNew: row.state === 0
    }
  }
}
