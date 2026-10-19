import { ACHIEVEMENT_REWARDS } from '@shared/achievements'
import type { EventBus } from '../core/EventBus'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { StatsService } from './StatsService'
import type { XpService } from './XpService'

export const ACHIEVEMENT_REASON = 'achievement.unlocked'

/**
 * Thưởng khi mở khoá thành tựu (docs/06-levels-and-progression.md): thành tựu tính từ số liệu thống kê, còn việc
 * "đã thưởng chưa" ghi trong sổ XP với refId = id thành tựu → mỗi thành tựu chỉ thưởng một lần cho mỗi hồ sơ.
 * Chạy sau mỗi lần cộng XP (ôn thẻ, lưu từ, luyện tập, bài học...). Lần đầu sau khi cập nhật app sẽ thưởng bù
 * các thành tựu đã đạt từ trước và báo gộp một thông báo.
 */
export class AchievementService {
  private running = false

  constructor(
    private readonly deps: {
      stats: StatsService
      xpRepo: XpRepository
      xp: XpService
      profiles: ProfileService
      bus: EventBus
    }
  ) {
    deps.bus.on('xp.granted', ({ reason }) => {
      if (reason !== ACHIEVEMENT_REASON) this.evaluate()
    })
  }

  /** Thưởng các thành tựu vừa đạt; trả về id các thành tựu mới */
  evaluate(): string[] {
    if (this.running) return [] // xp.grant bên dưới lại phát 'xp.granted'
    this.running = true
    try {
      const { stats, xpRepo, xp, profiles, bus } = this.deps
      const profileId = profiles.activeId()
      const fresh = stats
        .stats()
        .achievements.filter(
          (a) => a.unlocked && !xpRepo.hasEvent(profileId, ACHIEVEMENT_REASON, a.id)
        )
      let totalXp = 0
      let totalCoins = 0
      for (const a of fresh) {
        const reward = ACHIEVEMENT_REWARDS[a.tier]
        xp.grant({
          amount: reward.xp,
          coins: reward.coins,
          reason: ACHIEVEMENT_REASON,
          refId: a.id
        })
        totalXp += reward.xp
        totalCoins += reward.coins
      }
      if (fresh.length) {
        bus.emit('achievement.unlocked', {
          ids: fresh.map((a) => a.id),
          xp: totalXp,
          coins: totalCoins
        })
      }
      return fresh.map((a) => a.id)
    } finally {
      this.running = false
    }
  }
}
