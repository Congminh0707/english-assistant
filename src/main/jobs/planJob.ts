import type { DailyPlan } from '@shared/schemas/study'
import { localDayKey } from '../core/localDay'
import type { Container } from '../container'
import type { Scheduler } from './Scheduler'

const CHECK_MS = 5 * 60_000

/** Phần còn lại của lộ trình hôm nay: số mục chưa xong và tổng phút của chúng */
export interface PlanRemaining {
  count: number
  minutes: number
}

export function planRemaining(plan: DailyPlan): PlanRemaining {
  const left = plan.items.filter((i) => !i.done)
  return { count: left.length, minutes: left.reduce((n, i) => n + i.minutes, 0) }
}

/**
 * PlanReminderJob: mỗi 5 phút xem đã tới giờ `plan.reminderHour` chưa; nếu lộ trình hôm nay còn mục chưa xong
 * thì mascot nói "Hôm nay còn N việc, khoảng M phút. Học nhé?" (bấm bong bóng → trang chủ cửa sổ Học tập).
 * Tối đa một lần mỗi ngày cục bộ — ngày đã nhắc lưu ở `plan.remindedDay` để mở lại app không nhắc lần nữa.
 * Bỏ qua: tắt nhắc (null), hồ sơ trẻ em, lộ trình đã xong/trống, mascot đang ẩn/yên lặng/ngủ hoặc popup đang mở
 * (do canShow quyết định, giống nhắc nhật ký). Chỉ đánh dấu "đã nhắc" khi thật sự hiện bong bóng.
 * Trả về `check()` để test gọi trực tiếp.
 */
export function schedulePlanJob(
  scheduler: Scheduler,
  c: Container,
  opts: { canShow: () => boolean; show: (left: PlanRemaining) => void }
): { check: () => boolean } {
  const check = (): boolean => {
    const hour = c.settings.get('plan.reminderHour')
    if (hour === null) return false
    const now = c.clock.now()
    const day = localDayKey(now)
    if (c.settings.get('plan.remindedDay') === day || new Date(now).getHours() < hour) return false
    if (c.profiles.active().isChild || !opts.canShow()) return false
    // Tính lộ trình sau cùng (nặng nhất)
    const left = planRemaining(c.dailyPlan.plan())
    if (left.count === 0) return false
    c.settings.set('plan.remindedDay', day)
    opts.show(left)
    return true
  }

  scheduler.every('plan-reminder', CHECK_MS, () => void check())
  return { check }
}
