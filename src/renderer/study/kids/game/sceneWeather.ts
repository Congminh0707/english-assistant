export type Weather = 'clear' | 'sun' | 'rain' | 'night'

/** Giờ địa phương [19, 6) là đêm */
const NIGHT_FROM = 19
const NIGHT_TO = 6

/**
 * Thời tiết khi bé vào một cảnh: đêm theo giờ máy, ban ngày chọn ngẫu nhiên mưa 20 % / nắng 35 % / quang 45 %.
 * Gọi một lần lúc vào cảnh: đang ở trong cảnh thì không đổi, thoát ra rồi vào lại mới chọn lại (chủ dự án 2026-11-04).
 */
export function pickWeather(now: Date = new Date(), rnd: () => number = Math.random): Weather {
  const h = now.getHours()
  if (h >= NIGHT_FROM || h < NIGHT_TO) return 'night'
  const r = rnd()
  if (r < 0.2) return 'rain'
  if (r < 0.55) return 'sun'
  return 'clear'
}
