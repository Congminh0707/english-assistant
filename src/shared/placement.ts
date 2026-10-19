// Bài kiểm tra đầu vào (từ vựng, thích nghi) — phần tính toán thuần, dùng ở main và test.
// docs/06-levels-and-progression.md#placement

import { LEVEL_CODES, type LevelCode } from './schemas/content/level'

/** Số câu mỗi bài kiểm tra */
export const PLACEMENT_QUESTIONS = 20
/** Bắt đầu ở A2.1 (giữa thang), rồi lên/xuống từng bậc theo câu trả lời */
export const PLACEMENT_START_INDEX = 4

/**
 * Kế hoạch 20 câu xen kẽ kỹ năng: 12 từ vựng, 5 ngữ pháp, 3 đọc hiểu.
 * Mỗi kỹ năng có "bậc thang" riêng (đúng → khó hơn, sai → dễ hơn).
 */
export const PLACEMENT_PLAN: readonly ('vocab' | 'grammar' | 'reading')[] = [
  'vocab',
  'vocab',
  'grammar',
  'vocab',
  'vocab',
  'grammar',
  'reading',
  'vocab',
  'grammar',
  'vocab',
  'grammar',
  'vocab',
  'reading',
  'vocab',
  'grammar',
  'vocab',
  'vocab',
  'reading',
  'vocab',
  'vocab'
]

/** Trọng số mỗi kỹ năng khi tính trình độ chung */
export const PLACEMENT_WEIGHTS = { vocab: 0.5, grammar: 0.3, reading: 0.2 } as const
/** Bỏ qua bấy nhiêu câu đầu khi ước lượng (thời gian "khởi động" tới đúng bậc) */
export const PLACEMENT_WARMUP = 5

const MAX_INDEX = LEVEL_CODES.length - 1

/** Câu đúng → câu sau khó hơn một bậc; sai (hoặc "không biết") → dễ hơn một bậc */
export function nextLevelIndex(index: number, correct: boolean): number {
  return Math.min(MAX_INDEX, Math.max(0, index + (correct ? 1 : -1)))
}

/**
 * Ước lượng trình độ: trung bình bậc của các câu đã hỏi sau giai đoạn khởi động, cộng bậc dự kiến kế tiếp
 * (phương pháp "staircase": người dùng dao động quanh đúng trình độ của mình).
 */
export function estimateLevel(askedIndexes: number[], nextIndex: number): LevelCode {
  const tail =
    askedIndexes.length > PLACEMENT_WARMUP ? askedIndexes.slice(PLACEMENT_WARMUP) : askedIndexes
  const samples = [...tail, nextIndex]
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  return LEVEL_CODES[Math.min(MAX_INDEX, Math.max(0, Math.round(mean)))]
}

/** Nhãn CEFR hiển thị cho level ('A2_1' → 'A2', 'PA1_2' → 'Pre-A1') */
export function cefrLabel(level: LevelCode): string {
  const base = level.split('_')[0]
  return base === 'PA1' ? 'Pre-A1' : base
}

/** Trình độ chung: trung bình có trọng số của bậc từng kỹ năng đã được kiểm tra */
export function combineLevels(
  levels: Partial<Record<keyof typeof PLACEMENT_WEIGHTS, LevelCode>>
): LevelCode {
  let sum = 0
  let weight = 0
  for (const [skill, level] of Object.entries(levels) as Array<
    [keyof typeof PLACEMENT_WEIGHTS, LevelCode]
  >) {
    sum += LEVEL_CODES.indexOf(level) * PLACEMENT_WEIGHTS[skill]
    weight += PLACEMENT_WEIGHTS[skill]
  }
  if (!weight) return LEVEL_CODES[PLACEMENT_START_INDEX]
  return LEVEL_CODES[Math.min(MAX_INDEX, Math.max(0, Math.round(sum / weight)))]
}
