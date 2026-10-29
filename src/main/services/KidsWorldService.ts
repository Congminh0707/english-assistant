import {
  KIDS_NEW_PER_DAY,
  pickChoices,
  pictureIdOf,
  isPictureContentId,
  starsFor
} from '@shared/kids'
import {
  isThirsty,
  pickVisitBatch,
  placeState,
  tierUnlocked,
  wordStage,
  type PlaceWords,
  type WordStage
} from '@shared/kidsWorld'
import { PICTURE_WORDS } from '@shared/pictures'
import type {
  KidsVisit,
  KidsVisitDoneInput,
  KidsVisitDoneResult,
  KidsWorldView
} from '@shared/schemas/kidsWorld'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { startOfLocalDay } from '../core/localDay'
import type { KidsWorldLibrary } from '../content/KidsWorldLibrary'
import type { LessonRepository } from '../db/repositories/LessonRepository'
import type { SettingsRepository } from '../db/repositories/SettingsRepository'
import type { SrsCardRow, VocabRepository } from '../db/repositories/VocabRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { KidsService } from './KidsService'
import type { ProfileService } from './ProfileService'
import type { SrsService } from './SrsService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

/** Tiến độ lưu ở lesson_progress: từ đã qua đủ 5 bước / nơi đã xong (docs/19 §7.1) */
const WORD_PREFIX = 'kids.word.'
const PLACE_PREFIX = 'kids.place.'
const PLACE_REASON = 'kids.place'
/** Nơi thú cưng đang đứng: settings theo hồ sơ */
const PLACE_KEY = 'kids.worldPlace'
const profileScope = (profileId: string): string => `profile:${profileId}`
const XP_PLACE = 20
const COINS_PLACE = 10

interface Snapshot {
  profileId: string
  now: number
  cards: Map<string, SrsCardRow>
  stages: Map<string, WordStage>
  completed: Set<string>
  placeBest: Map<string, number>
  donePlaces: Set<string>
  unlocked: Set<string>
}

/**
 * Bản đồ thế giới của bé (docs/19-kids-world.md): trạng thái tầng/nơi/từ, lượt chơi 5 bước tại một nơi,
 * ghi tiến độ khi xong lượt và rương thưởng lần đầu xong nơi. Từ mới dùng chung thẻ hình `pic:<id>` (FSRS ẩn).
 */
export class KidsWorldService {
  constructor(
    private readonly deps: {
      library: KidsWorldLibrary
      vocab: VocabRepository
      lessonRepo: LessonRepository
      xpRepo: XpRepository
      settingsRepo: SettingsRepository
      srs: SrsService
      xp: XpService
      kids: KidsService
      profiles: ProfileService
      clock: Clock
      transaction: Transaction
      random?: () => number
    }
  ) {}

  get enabled(): boolean {
    return this.deps.library.enabled
  }

  /** Số nơi đã xong / tổng số nơi (ô Chơi ở trang chính của bé) */
  progress(): { done: number; total: number } {
    const s = this.snapshot()
    return { done: s.donePlaces.size, total: this.deps.library.places.length }
  }

  world(): KidsWorldView {
    const { library, srs } = this.deps
    const s = this.snapshot()
    const current = this.currentPlaceId(s.profileId)
    let today: string | null = null
    const openPlaces = library.places
      .filter((p) => s.unlocked.has(p.place.tier) && !s.donePlaces.has(p.place.id))
      .sort((a, b) => a.place.suggestOrder - b.place.suggestOrder)
    if (openPlaces.length > 0) {
      // Ưu tiên nơi đang học dở, rồi theo thứ tự gợi ý
      const started = openPlaces.find((p) => p.words.some((w) => s.cards.has(w.picture)))
      today = (started ?? openPlaces[0]).place.id
    }
    return {
      tiers: library.tiers.map((tier) => ({
        id: tier.id,
        title: tier.title,
        vi: tier.vi,
        scene: tier.scene,
        unlocked: s.unlocked.has(tier.id),
        places: library.placesOfTier(tier.id).map(({ place, words }) => {
          const { tier: _tier, ...rest } = place
          void _tier
          const pictures = words.map((w) => w.picture)
          return {
            ...rest,
            state: placeState(s.unlocked.has(tier.id), pictures, s.completed),
            stars: starsFor(s.placeBest.get(place.id) ?? null),
            words: words.map((w) => ({
              pictureId: w.picture,
              word: PICTURE_WORDS[w.picture]?.en ?? w.picture,
              vi: PICTURE_WORDS[w.picture]?.vi ?? '',
              stage: s.stages.get(w.picture) ?? 'hidden',
              thirsty: isThirsty(s.cards.get(w.picture), s.now),
              done: s.completed.has(w.picture)
            }))
          }
        })
      })),
      currentPlaceId: current,
      todayPlaceId: today,
      newLeftToday: this.newLeftToday(s.profileId, s.now),
      dueCount: srs.dueCount(['audio_picture'])
    }
  }

  /** Bắt đầu lượt chơi tại một nơi: chọn đợt ≤ 4 từ, tạo thẻ cho từ mới (bước 1), đặt thú cưng đứng ở nơi đó */
  visit(placeId: string): KidsVisit {
    const { library, kids, settingsRepo, transaction } = this.deps
    const file = library.place(placeId)
    if (!file) throw new AppError('NOT_FOUND', 'errors.notFound')
    return transaction(() => {
      const s = this.snapshot()
      if (!s.unlocked.has(file.place.tier)) throw new AppError('FORBIDDEN', 'errors.placeLocked')
      const pictures = file.words.map((w) => w.picture)
      const batch = pickVisitBatch({
        words: pictures,
        completed: s.completed,
        hasCard: new Set(s.cards.keys()),
        newLeftToday: this.newLeftToday(s.profileId, s.now),
        stages: s.stages
      })
      for (const pictureId of batch.newWords) {
        s.cards.set(pictureId, kids.introducePicture(s.profileId, pictureId, s.now))
      }
      settingsRepo.set(PLACE_KEY, placeId, s.now, profileScope(s.profileId))
      const learned = [...s.cards.keys()]
      const sentence = new Map(file.words.map((w) => [w.picture, w.sentence]))
      return {
        placeId,
        reviewOnly: batch.reviewOnly,
        batch: batch.words.map((pictureId) => {
          const card = s.cards.get(pictureId)!
          return {
            pictureId,
            word: PICTURE_WORDS[pictureId]?.en ?? pictureId,
            vi: PICTURE_WORDS[pictureId]?.vi ?? '',
            cardId: card.id,
            isNew: card.state === 0,
            sentence: sentence.get(pictureId)!,
            choices: pickChoices(pictureId, learned, 3, () => this.rnd())
          }
        })
      }
    })
  }

  /**
   * Xong lượt: từ qua đủ 5 bước (chạm hình + nghe câu có trả lời ra, đã chơi, đã nói theo) được ghi là xong;
   * nơi xong hết từ lần đầu → rương thưởng (XP, xu, đồ ăn). Không chấm FSRS lại (bước 2 đã chấm qua kids:rate).
   */
  visitDone(input: KidsVisitDoneInput): KidsVisitDoneResult {
    const { library, lessonRepo, xpRepo, xp, kids, transaction } = this.deps
    const file = library.place(input.placeId)
    if (!file) throw new AppError('NOT_FOUND', 'errors.notFound')
    const own = new Set(file.words.map((w) => w.picture))
    if (input.results.some((r) => !own.has(r.pictureId))) {
      throw new AppError('VALIDATION', 'errors.validation')
    }
    return transaction(() => {
      const before = this.snapshot()
      if (!before.unlocked.has(file.place.tier))
        throw new AppError('FORBIDDEN', 'errors.placeLocked')
      const { profileId, now } = before
      let firstTry = 0
      for (const r of input.results) {
        firstTry += (r.tapTries === 1 ? 1 : 0) + (r.sentenceTries === 1 ? 1 : 0)
        const passed =
          r.tapTries > 0 &&
          r.sentenceTries > 0 &&
          r.played &&
          r.spoke &&
          before.cards.has(r.pictureId)
        const score = r.tapTries === 1 && r.sentenceTries === 1 ? 100 : passed ? 70 : 0
        lessonRepo.record(profileId, `${WORD_PREFIX}${r.pictureId}`, score, passed, now)
      }
      const score = Math.round((firstTry / (input.results.length * 2)) * 100)
      const after = this.snapshot()
      const placeDone = file.words.every((w) => after.completed.has(w.picture))
      let firstTime = false
      let foodId: string | null = null
      if (placeDone) {
        lessonRepo.record(profileId, `${PLACE_PREFIX}${file.place.id}`, score, true, now)
        if (!xpRepo.hasEvent(profileId, PLACE_REASON, file.place.id)) {
          firstTime = true
          xp.grant({
            amount: XP_PLACE,
            coins: COINS_PLACE,
            reason: PLACE_REASON,
            refId: file.place.id
          })
          foodId = kids.giveFood()
        }
      }
      const unlockedNow = library.tiers.find(
        (t) => !before.unlocked.has(t.id) && after.unlocked.has(t.id)
      )
      return {
        stars: starsFor(score),
        placeDone,
        firstTime,
        foodId,
        tierUnlocked: unlockedNow?.id ?? null,
        stages: input.results.map((r) => ({
          pictureId: r.pictureId,
          stage: after.stages.get(r.pictureId) ?? 'hidden'
        }))
      }
    })
  }

  // --- nội bộ ---

  private rnd(): number {
    return (this.deps.random ?? Math.random)()
  }

  private newLeftToday(profileId: string, now: number): number {
    const used = this.deps.vocab.countCardsCreatedSince(
      profileId,
      'audio_picture',
      startOfLocalDay(now)
    )
    return Math.max(0, KIDS_NEW_PER_DAY - used)
  }

  private currentPlaceId(profileId: string): string | null {
    const { library, settingsRepo } = this.deps
    const saved = settingsRepo.all(profileScope(profileId)).find((r) => r.key === PLACE_KEY)?.value
    if (typeof saved === 'string' && library.place(saved)) return saved
    const first = library.tiers[0]
    if (!first) return null
    const start = [...library.placesOfTier(first.id)].sort(
      (a, b) => a.place.suggestOrder - b.place.suggestOrder
    )[0]
    return start?.place.id ?? null
  }

  private snapshot(): Snapshot {
    const { library, vocab, lessonRepo, profiles, clock } = this.deps
    const profileId = profiles.activeId()
    const now = clock.now()
    const cards = new Map<string, SrsCardRow>()
    for (const card of vocab.cardsByDirection(profileId, 'audio_picture')) {
      if (isPictureContentId(card.contentId)) cards.set(pictureIdOf(card.contentId), card)
    }
    const stages = new Map<string, WordStage>()
    for (const [id, card] of cards) stages.set(id, wordStage(card))
    const completed = new Set<string>()
    const placeBest = new Map<string, number>()
    for (const row of lessonRepo.list(profileId)) {
      if (row.lessonId.startsWith(WORD_PREFIX) && row.completedAt !== null) {
        completed.add(row.lessonId.slice(WORD_PREFIX.length))
      } else if (row.lessonId.startsWith(PLACE_PREFIX)) {
        placeBest.set(row.lessonId.slice(PLACE_PREFIX.length), row.best)
      }
    }
    const placeWords: PlaceWords[] = library.places.map((p) => ({
      id: p.place.id,
      tier: p.place.tier,
      words: p.words.map((w) => w.picture)
    }))
    const donePlaces = new Set(
      placeWords.filter((p) => p.words.every((w) => completed.has(w))).map((p) => p.id)
    )
    const unlocked = new Set(
      library.tiers.filter((t) => tierUnlocked(t, placeWords, donePlaces, stages)).map((t) => t.id)
    )
    return { profileId, now, cards, stages, completed, placeBest, donePlaces, unlocked }
  }
}
