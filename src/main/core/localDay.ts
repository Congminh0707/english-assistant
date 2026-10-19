// Ngày theo múi giờ cục bộ của máy người dùng (streak, nhiệm vụ ngày tính theo "ngày của người dùng").

/** Chênh lệch múi giờ cục bộ so với UTC, tính bằng giây (cộng vào epoch ra "giờ treo tường") */
export function localOffsetSeconds(ms: number): number {
  return -new Date(ms).getTimezoneOffset() * 60
}

/** 00:00 hôm nay (cục bộ) tính bằng epoch ms */
export function startOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 'YYYY-MM-DD' của ngày cục bộ chứa thời điểm này */
export function localDayKey(ms: number): string {
  return new Date(ms + localOffsetSeconds(ms) * 1000).toISOString().slice(0, 10)
}
