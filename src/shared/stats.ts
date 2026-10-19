// Tính toán thống kê thuần (ngày dạng 'YYYY-MM-DD'), dùng ở main, renderer và test.

const DAY_MS = 86_400_000

const toUtc = (day: string): number => Date.parse(`${day}T00:00:00Z`)
const toKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/** Cộng/trừ số ngày cho một ngày 'YYYY-MM-DD' */
export function addDays(day: string, delta: number): string {
  return toKey(toUtc(day) + delta * DAY_MS)
}

/** `count` ngày liên tiếp kết thúc ở `last`, cũ nhất trước */
export function dayRange(last: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(last, i - count + 1))
}

/** Chuỗi ngày liên tiếp dài nhất trong tập ngày có hoạt động */
export function longestStreak(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort()
  let best = 0
  let run = 0
  let prev: number | null = null
  for (const day of sorted) {
    const ms = toUtc(day)
    run = prev !== null && ms - prev === DAY_MS ? run + 1 : 1
    best = Math.max(best, run)
    prev = ms
  }
  return best
}

/** Thứ trong tuần của một ngày: 0 = Thứ Hai … 6 = Chủ Nhật */
export function weekdayIndex(day: string): number {
  return (new Date(toUtc(day)).getUTCDay() + 6) % 7
}

/**
 * Mức đậm (0–4) của một ô lịch hoạt động theo "điểm hoạt động" trong ngày:
 * 0 = không học; càng nhiều càng đậm.
 */
export function activityLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) return 0
  if (score < 8) return 1
  if (score < 20) return 2
  if (score < 40) return 3
  return 4
}

/** Điểm hoạt động trong ngày: lượt ôn + 2 điểm/từ mới + 5 điểm/phiên luyện tập */
export const activityScore = (d: { reviews: number; saved: number; practice: number }): number =>
  d.reviews + d.saved * 2 + d.practice * 5
