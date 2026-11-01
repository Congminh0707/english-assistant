export type Weather = 'clear' | 'sun' | 'rain' | 'night'

/** Giờ địa phương [19, 6) là đêm */
const NIGHT_FROM = 19
const NIGHT_TO = 6

/** Thời tiết của một cảnh: đêm theo giờ máy, ban ngày chọn mưa / nắng / quang theo (ngày, nơi) để cả ngày không đổi */
export function pickWeather(placeId: string, now: Date = new Date()): Weather {
  const h = now.getHours()
  if (h >= NIGHT_FROM || h < NIGHT_TO) return 'night'
  const s = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}:${placeId}`
  let x = 2166136261
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619)
  const r = ((x >>> 0) % 100) / 100
  if (r < 0.2) return 'rain'
  if (r < 0.55) return 'sun'
  return 'clear'
}
