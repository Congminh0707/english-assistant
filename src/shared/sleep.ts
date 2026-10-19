// Quy tắc "mascot đi ngủ" thuần (không phụ thuộc electron/DB) — dùng ở main và test.
// docs/05-mascot-system.md (trạng thái sleep).

/** Người dùng không đụng chuột/bàn phím lâu hơn mức này → mascot ngủ */
export const AFK_SLEEP_SECONDS = 10 * 60
/** Năng lượng thấp tới mức này thì mascot đi ngủ... */
export const TIRED_BELOW = 20
/** ...và ngủ tới khi năng lượng hồi lại tới mức này */
export const RESTED_AT = 45
/** Năng lượng hồi mỗi giờ khi đang ngủ */
export const REST_PER_HOUR = 12

export type SleepReason = 'afk' | 'tired'

export interface SleepState {
  sleeping: boolean
  /** Đang trong giấc ngủ vì mệt (có độ trễ để không chập chờn quanh ngưỡng) */
  tired: boolean
  reason: SleepReason | null
}

export const AWAKE: SleepState = { sleeping: false, tired: false, reason: null }

/** Trạng thái ngủ kế tiếp từ trạng thái trước, thời gian người dùng vắng mặt và năng lượng */
export function nextSleepState(prev: SleepState, idleSeconds: number, energy: number): SleepState {
  const tired = prev.tired ? energy < RESTED_AT : energy <= TIRED_BELOW
  const afk = idleSeconds >= AFK_SLEEP_SECONDS
  const reason: SleepReason | null = afk ? 'afk' : tired ? 'tired' : null
  return { sleeping: reason !== null, tired, reason }
}
