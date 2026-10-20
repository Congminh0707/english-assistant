import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { PARENT_REPORT_DAYS, pictureIdOf } from '@shared/kids'
import { PICTURE_WORDS } from '@shared/pictures'
import { dayRange } from '@shared/stats'
import type { ParentReport } from '@shared/schemas/kids'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { localDayKey, localOffsetSeconds } from '../core/localDay'
import type { SettingsRepository } from '../db/repositories/SettingsRepository'
import type { UsageRepository } from '../db/repositories/UsageRepository'
import type { VocabRepository } from '../db/repositories/VocabRepository'
import type { KidsService } from './KidsService'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'

const PIN_KEY = 'parent.pin'
/** Sai chừng này lần thì khoá một lúc */
const MAX_FAILURES = 5
const LOCK_MS = 60_000
const DAY_MS = 86_400_000

interface StoredPin {
  salt: string
  hash: string
}

const hashPin = (salt: string, pin: string): string =>
  createHash('sha256').update(`${salt}:${pin}`).digest('hex')

/**
 * Khu vực phụ huynh: mã PIN 4 số (khoá trẻ em — không phải ranh giới bảo mật, chỉ chặn bé bấm nhầm), gia hạn thời gian,
 * báo cáo 7 ngày. PIN lưu dạng băm có muối, ngoài bảng cài đặt có kiểu nên không bao giờ gửi xuống giao diện hay ghi log.
 */
export class ParentService {
  private failures = 0
  private lockedUntil = 0

  constructor(
    private readonly deps: {
      settingsRepo: SettingsRepository
      settings: SettingsService
      usage: UsageRepository
      vocab: VocabRepository
      kids: KidsService
      profiles: ProfileService
      clock: Clock
    }
  ) {}

  private stored(): StoredPin | null {
    const row = this.deps.settingsRepo.all().find((r) => r.key === PIN_KEY)
    const value = row?.value as StoredPin | undefined
    return value?.salt && value.hash ? value : null
  }

  pinSet(): boolean {
    return this.stored() !== null
  }

  /** Kiểm tra PIN; sai nhiều lần thì phải chờ. Không có PIN thì luôn coi là sai. */
  verify(pin: string): { ok: boolean; retryAfterSeconds: number } {
    const now = this.deps.clock.now()
    if (now < this.lockedUntil) {
      return { ok: false, retryAfterSeconds: Math.ceil((this.lockedUntil - now) / 1000) }
    }
    const stored = this.stored()
    const ok =
      !!stored && timingSafeEqual(Buffer.from(hashPin(stored.salt, pin)), Buffer.from(stored.hash))
    if (ok) {
      this.failures = 0
      return { ok: true, retryAfterSeconds: 0 }
    }
    this.failures++
    if (this.failures >= MAX_FAILURES) {
      this.failures = 0
      this.lockedUntil = now + LOCK_MS
      return { ok: false, retryAfterSeconds: Math.ceil(LOCK_MS / 1000) }
    }
    return { ok: false, retryAfterSeconds: 0 }
  }

  /** Đặt PIN lần đầu, hoặc đổi PIN (phải nhập PIN hiện tại) */
  setPin(pin: string, currentPin?: string): void {
    if (this.pinSet() && !(currentPin && this.verify(currentPin).ok)) {
      throw new AppError('FORBIDDEN', 'errors.pinWrong')
    }
    const salt = randomBytes(8).toString('hex')
    this.deps.settingsRepo.set(
      PIN_KEY,
      { salt, hash: hashPin(salt, pin) } satisfies StoredPin,
      this.deps.clock.now()
    )
  }

  /** Cho trẻ dùng thêm thời gian hôm nay (cần PIN) */
  extend(pin: string, minutes: number): void {
    if (!this.verify(pin).ok) throw new AppError('FORBIDDEN', 'errors.pinWrong')
    const { usage, profiles, clock } = this.deps
    const now = clock.now()
    usage.addBonus(profiles.activeId(), localDayKey(now), minutes * 60, now)
  }

  /** Báo cáo cho phụ huynh: thời gian dùng và số thẻ ôn 7 ngày gần nhất, tiến độ sticker, từ bé hay quên */
  report(): ParentReport {
    const { usage, vocab, profiles, clock, settings, kids } = this.deps
    const profileId = profiles.activeId()
    const now = clock.now()
    const today = localDayKey(now)
    const days = dayRange(today, PARENT_REPORT_DAYS)
    const used = new Map(usage.since(profileId, days[0]).map((r) => [r.day, r.seconds]))
    const reviews = new Map(
      vocab
        .reviewCountsByDay(
          profileId,
          now - (PARENT_REPORT_DAYS + 1) * DAY_MS,
          localOffsetSeconds(now)
        )
        .map((r) => [r.day, r.n])
    )
    const stickers = kids.stickers()
    const progress = kids.activityProgress()
    return {
      dailyLimitMinutes: settings.get('kids.dailyMinutes'),
      days: days.map((day) => ({
        day,
        seconds: used.get(day) ?? 0,
        reviews: reviews.get(day) ?? 0
      })),
      stickersEarned: stickers.earned,
      stickersTotal: stickers.total,
      activitiesDone: progress.done,
      activitiesTotal: progress.total,
      hardest: vocab.hardestByDirection(profileId, 'audio_picture', 5).map((h) => {
        const word = PICTURE_WORDS[pictureIdOf(h.contentId)]
        return { word: word?.en ?? h.contentId, vi: word?.vi ?? '', lapses: h.lapses }
      })
    }
  }
}
