type Translate = (key: string, params?: Record<string, unknown>) => string

/** "10 phút" / "3 giờ" / "5 ngày" cho khoảng thời gian tính bằng ngày (dùng khoá quiz.* có sẵn) */
export function formatInterval(days: number, t: Translate): string {
  if (days < 1 / 24) return t('quiz.minutes', { n: Math.max(1, Math.round(days * 1440)) })
  if (days < 1) return t('quiz.hours', { n: Math.round(days * 24) })
  return t('quiz.days', { n: Math.round(days) })
}
