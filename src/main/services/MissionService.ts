import type { MissionsState } from '@shared/schemas/study'
import { localDayKey, startOfLocalDay } from '../core/localDay'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import type { VocabRepository } from '../db/repositories/VocabRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { SettingsService } from './SettingsService'
import type { SrsService } from './SrsService'
import type { XpService } from './XpService'

export const MISSION_REASON = 'mission.completed'
/** Số từ mới cần lưu mỗi ngày */
export const LEARN_TARGET = 3

interface MissionDef {
  id: 'review' | 'learn' | 'clear'
  xp: number
  coins: number
}

const MISSIONS: MissionDef[] = [
  { id: 'review', xp: 20, coins: 10 },
  { id: 'learn', xp: 10, coins: 5 },
  { id: 'clear', xp: 15, coins: 10 }
]
const BONUS = { xp: 25, coins: 20 }
const BONUS_ID = 'all'

/**
 * Nhiệm vụ ngày (docs/06-levels-and-progression.md): ôn đủ số thẻ mục tiêu, lưu 3 từ mới, ôn hết thẻ đến hạn;
 * làm cả ba được thưởng thêm. Tiến độ tính trực tiếp từ dữ liệu (nhật ký ôn, sổ XP) nên không lưu bảng riêng;
 * phần thưởng ghi vào sổ XP với refId `<ngày>:<nhiệm vụ>` để mỗi nhiệm vụ chỉ thưởng một lần mỗi ngày.
 */
export class MissionService {
  constructor(
    private readonly deps: {
      vocab: VocabRepository
      xpRepo: XpRepository
      xp: XpService
      srs: SrsService
      profiles: ProfileService
      settings: SettingsService
      clock: Clock
      bus: EventBus
    }
  ) {
    // Mỗi lần ôn thẻ / lưu từ mới (sau khi XP đã ghi sổ) → kiểm tra có nhiệm vụ nào vừa xong không
    deps.bus.on('xp.granted', ({ reason }) => {
      if (reason === 'card.reviewed' || reason === 'word.saved') this.evaluate()
    })
  }

  state(): MissionsState {
    const { settings, clock, profiles, xpRepo } = this.deps
    const now = clock.now()
    const day = localDayKey(now)
    const profileId = profiles.activeId()
    const goal = settings.get('learning.dailyGoal')
    const progress = this.progress(profileId, now)

    const missions = MISSIONS.map((m) => {
      const target = m.id === 'review' ? goal : m.id === 'learn' ? LEARN_TARGET : 1
      const done = xpRepo.hasEvent(profileId, MISSION_REASON, `${day}:${m.id}`)
      return {
        id: m.id,
        progress: Math.min(progress[m.id], target),
        target,
        done,
        xp: m.xp,
        coins: m.coins
      }
    })
    const bonusDone = xpRepo.hasEvent(profileId, MISSION_REASON, `${day}:${BONUS_ID}`)
    return {
      day,
      goal,
      missions,
      bonus: { ...BONUS, done: bonusDone },
      allDone: missions.every((m) => m.done)
    }
  }

  /** Thưởng các nhiệm vụ vừa hoàn thành (idempotent: mỗi nhiệm vụ một lần mỗi ngày) */
  evaluate(): void {
    const { clock, xp, bus } = this.deps
    const day = localDayKey(clock.now())

    for (const m of this.state().missions) {
      if (m.done || m.progress < m.target) continue
      const def = MISSIONS.find((x) => x.id === m.id)!
      xp.grant({
        amount: def.xp,
        coins: def.coins,
        reason: MISSION_REASON,
        refId: `${day}:${m.id}`
      })
      bus.emit('mission.completed', { id: m.id, xp: def.xp, coins: def.coins, all: false })
    }

    const after = this.state()
    if (after.allDone && !after.bonus.done) {
      xp.grant({
        amount: BONUS.xp,
        coins: BONUS.coins,
        reason: MISSION_REASON,
        refId: `${day}:${BONUS_ID}`
      })
      bus.emit('mission.completed', { id: BONUS_ID, ...BONUS, all: true })
    }
  }

  private progress(profileId: string, now: number): Record<MissionDef['id'], number> {
    const { vocab, xpRepo, srs } = this.deps
    const since = startOfLocalDay(now)
    const reviewed = vocab.countReviewsSince(profileId, since)
    return {
      review: reviewed,
      learn: xpRepo.countSince(profileId, 'word.saved', since),
      clear: reviewed > 0 && srs.dueCount() === 0 ? 1 : 0
    }
  }
}
