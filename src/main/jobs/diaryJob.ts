import { localDayKey } from '../core/localDay'
import type { Container } from '../container'
import type { Scheduler } from './Scheduler'

const CHECK_MS = 5 * 60_000

/**
 * DiaryReminderJob (docs/07 §14): mỗi 5 phút xem đã tới giờ `diary.hour` chưa; nếu hôm nay chưa viết nhật ký
 * thì mascot hỏi "Hôm nay bạn làm gì?" — tối đa một lần mỗi ngày (docs/00 nguyên tắc 1: không làm phiền).
 * Bỏ qua: tắt nhắc (null), hồ sơ trẻ em, mascot đang ẩn/yên lặng/ngủ hoặc popup đang mở (do canShow quyết định).
 * Chỉ đánh dấu "đã nhắc" khi thật sự hiện bong bóng. Trả về `check()` để test gọi trực tiếp.
 */
export function scheduleDiaryJob(
  scheduler: Scheduler,
  c: Container,
  opts: { canShow: () => boolean; show: () => void }
): { check: () => boolean } {
  let remindedDay: string | null = null

  const check = (): boolean => {
    const hour = c.settings.get('diary.hour')
    if (hour === null) return false
    const now = c.clock.now()
    const day = localDayKey(now)
    if (remindedDay === day || new Date(now).getHours() < hour) return false
    if (c.profiles.active().isChild || c.diary.today() || !opts.canShow()) return false
    remindedDay = day
    opts.show()
    return true
  }

  scheduler.every('diary-reminder', CHECK_MS, () => void check())
  return { check }
}
