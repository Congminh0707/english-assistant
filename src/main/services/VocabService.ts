import { createEmptyCard } from 'ts-fsrs'
import type { SaveWordInput, SaveWordResult } from '@shared/schemas/dictionary'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import type { VocabRepository } from '../db/repositories/VocabRepository'
import type { ProfileService } from './ProfileService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

/** XP khi lưu một từ mới (docs/06-levels-and-progression.md#6) */
const XP_WORD_SAVED = 1

/**
 * Sổ từ: lưu từ người dùng tra (kèm câu ngữ cảnh) và tạo thẻ ôn tập SRS (FSRS) cho từ có trong từ điển.
 * Phiên ôn tập (chấm Quên/Khó/Được/Dễ) làm ở bước sau.
 */
export class VocabService {
  constructor(
    private readonly deps: {
      vocab: VocabRepository
      profiles: ProfileService
      xp: XpService
      clock: Clock
      bus: EventBus
      transaction: Transaction
    }
  ) {}

  save(input: SaveWordInput): SaveWordResult {
    const { vocab, profiles, clock, transaction } = this.deps
    const text = input.text.trim().toLowerCase()
    const context = input.context?.trim() || null

    const result = transaction(() => {
      const profileId = profiles.activeId()
      const now = clock.now()
      const isNew = !vocab.findSaved(profileId, text)
      vocab.upsertSaved(profileId, { contentId: input.contentId, text, context }, now)

      let cardCreated = false
      if (input.contentId && !vocab.hasCard(profileId, input.contentId, 'en_vi')) {
        const card = createEmptyCard(new Date(now))
        vocab.insertCard(
          {
            profileId,
            contentId: input.contentId,
            direction: 'en_vi',
            contextSentence: context,
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
        cardCreated = true
      }
      return { isNew, cardCreated }
    })

    if (result.isNew) {
      this.deps.bus.emit('word.saved', { text, contentId: input.contentId })
      this.deps.xp.grant({ amount: XP_WORD_SAVED, reason: 'word.saved', refId: input.contentId })
    }
    return result
  }

  savedContentIds(contentIds: string[]): Set<string> {
    return this.deps.vocab.savedContentIds(this.deps.profiles.activeId(), contentIds)
  }
}
