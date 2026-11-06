import type { ToeicMode, ToeicPart } from './schemas/toeic'

/** Số câu chuẩn mỗi Part của đề full (docs/07 §12) */
export const TOEIC_FULL_COUNTS: Record<ToeicPart, number> = {
  1: 6,
  2: 25,
  3: 39,
  4: 30,
  5: 30,
  6: 16,
  7: 54
}

/** Mini test ≈ 30 phút: 44 câu, tỉ lệ các Part giống đề thật */
export const TOEIC_MINI_COUNTS: Record<ToeicPart, number> = {
  1: 2,
  2: 8,
  3: 6,
  4: 6,
  5: 8,
  6: 4,
  7: 10
}

export const TOEIC_MINI_SECONDS = 30 * 60
export const TOEIC_FULL_SECONDS = 120 * 60
/** Luyện theo Part: số câu mỗi lượt (không giới hạn giờ; nhóm chọn nguyên khối nên có thể vượt vài câu) */
export const TOEIC_PART_QUESTIONS = 10

export const TOEIC_PARTS: readonly ToeicPart[] = [1, 2, 3, 4, 5, 6, 7]

export const isListeningPart = (part: number): boolean => part <= 4

/** Số câu mục tiêu mỗi Part theo chế độ (chế độ 'part' do người dùng chọn Part) */
export function targetCounts(mode: ToeicMode): Record<ToeicPart, number> {
  return mode === 'full' ? TOEIC_FULL_COUNTS : TOEIC_MINI_COUNTS
}

/**
 * Bảng quy đổi số câu đúng → điểm mỗi phần (Listening hoặc Reading, tối đa 100 câu, điểm 5–495).
 * Đây là bảng xấp xỉ tự lập theo mẫu công khai, KHÔNG phải bảng chính thức của ETS → chỉ để ước lượng.
 * Mỗi điểm: [số câu đúng, điểm].
 */
const SCALE: ReadonlyArray<readonly [number, number]> = [
  [0, 5],
  [10, 25],
  [20, 70],
  [30, 130],
  [40, 195],
  [50, 255],
  [60, 310],
  [70, 365],
  [80, 420],
  [90, 470],
  [100, 495]
]

/** Quy đổi tỉ lệ đúng (0–1) của một phần sang điểm 5–495, nội suy tuyến tính, làm tròn bội của 5 */
export function scaleSection(ratio: number): number {
  const x = Math.min(1, Math.max(0, ratio)) * 100
  for (let i = 1; i < SCALE.length; i++) {
    const [x1, y1] = SCALE[i]
    if (x <= x1) {
      const [x0, y0] = SCALE[i - 1]
      const y = y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
      return Math.round(y / 5) * 5
    }
  }
  return 495
}

export interface SectionTally {
  correct: number
  total: number
}

/**
 * Điểm ước lượng. Phần nào không có câu thì bỏ qua (null); tổng chỉ cộng các phần có làm,
 * nếu chỉ làm một phần thì nhân đôi để quy về thang 990 (chỉ là ước lượng thô).
 */
export function estimateScore(
  listening: SectionTally,
  reading: SectionTally
): { listening: number | null; reading: number | null; total: number } {
  const l = listening.total > 0 ? scaleSection(listening.correct / listening.total) : null
  const r = reading.total > 0 ? scaleSection(reading.correct / reading.total) : null
  let total = 0
  if (l !== null && r !== null) total = l + r
  else if (l !== null) total = l * 2
  else if (r !== null) total = r * 2
  return { listening: l, reading: r, total: Math.min(990, Math.max(0, total)) }
}
