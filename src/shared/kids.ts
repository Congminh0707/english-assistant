// Chế độ trẻ em: bộ thẻ "nghe → chạm hình" (hướng thẻ audio_picture), cách chấm, giới hạn thời gian — phần thuần dùng ở
// main, renderer và test. docs/07-learning-modules.md#9-phonics--mầm-non-p1
import { ALL_PICTURE_IDS } from './pictures'

/** Thẻ hình của trẻ: contentId = 'pic:<id hình>' (không phụ thuộc gói từ điển) */
export const PICTURE_CARD_PREFIX = 'pic:'
export const pictureContentId = (pictureId: string): string => `${PICTURE_CARD_PREFIX}${pictureId}`
export const isPictureContentId = (contentId: string): boolean =>
  contentId.startsWith(PICTURE_CARD_PREFIX)
export const pictureIdOf = (contentId: string): string =>
  contentId.slice(PICTURE_CARD_PREFIX.length)

/** Số hình mới tối đa đưa vào ôn mỗi ngày */
export const KIDS_NEW_PER_DAY = 6
/** Mỗi chừng này câu đúng liên tiếp được tặng một món ăn cho thú cưng */
export const KIDS_REWARD_EVERY = 5
/** Số món quà tối đa mỗi ngày (tránh bấm bừa để lấy đồ ăn) */
export const KIDS_MAX_REWARDS_PER_DAY = 8
/** Trả lời đúng lần đầu trong chừng này ms → chấm "Dễ" thay vì "Được" */
export const KIDS_FAST_MS = 4000

/** Thứ tự đưa hình vào học: vật quen thuộc, dễ nhận ra trước */
const FIRST = [
  'dog',
  'cat',
  'apple',
  'ball',
  'sun',
  'fish',
  'banana',
  'car',
  'house',
  'tree',
  'cow',
  'pig',
  'bird',
  'milk',
  'egg',
  'star',
  'duck',
  'flower',
  'bread',
  'bear'
]
export const KIDS_PICTURE_ORDER: readonly string[] = [
  ...FIRST.filter((id) => ALL_PICTURE_IDS.includes(id)),
  ...ALL_PICTURE_IDS.filter((id) => !FIRST.includes(id))
]

/**
 * Chấm theo số lần thử: đúng ngay lần đầu → Được (hoặc Dễ nếu nhanh), đúng ở lần hai → Khó,
 * không ra (tries = 0) → Quên. Trẻ chỉ thấy cười/buồn, không thấy mức chấm.
 */
export function ratingFromTries(tries: 0 | 1 | 2, elapsedMs: number): 1 | 2 | 3 | 4 {
  if (tries === 1) return elapsedMs <= KIDS_FAST_MS ? 4 : 3
  if (tries === 2) return 2
  return 1
}

/** Chọn lựa chọn cho một câu: đáp án + (count − 1) hình khác, ưu tiên hình đã học, rồi xáo trộn */
export function pickChoices(
  answer: string,
  preferred: readonly string[],
  count: number,
  random: () => number = Math.random
): string[] {
  const shuffle = <T>(items: T[]): T[] => {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  const others: string[] = []
  for (const pool of [
    shuffle(preferred.filter((id) => id !== answer)),
    shuffle(KIDS_PICTURE_ORDER.filter((id) => id !== answer))
  ]) {
    for (const id of pool) if (!others.includes(id) && others.length < count - 1) others.push(id)
  }
  return shuffle([answer, ...others])
}

/** Phụ huynh chọn tối đa bấy nhiêu phút mỗi ngày (0 = không giới hạn) */
export const KIDS_DAILY_MINUTES = [0, 10, 15, 20, 30, 45, 60] as const

/** Mỗi lần kiểm tra thời gian cách nhau tối đa bấy nhiêu giây (chặn gửi số giây phóng đại) */
export const KIDS_TICK_MAX_SECONDS = 60

/** Số ngày trong báo cáo phụ huynh */
export const PARENT_REPORT_DAYS = 7
