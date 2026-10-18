import { z } from 'zod'

// Thang trình độ thống nhất — docs/06-levels-and-progression.md §1
export const LEVEL_CODES = [
  'PA1_1',
  'PA1_2',
  'A1_1',
  'A1_2',
  'A2_1',
  'A2_2',
  'B1_1',
  'B1_2',
  'B2_1',
  'B2_2',
  'C1',
  'C2'
] as const

export const LevelCode = z.enum(LEVEL_CODES)
export type LevelCode = z.infer<typeof LevelCode>

/** Vị trí của level trên thang (0 = PA1_1 … 11 = C2) — dùng để so sánh/sắp xếp. */
export function levelIndex(level: LevelCode): number {
  return LEVEL_CODES.indexOf(level)
}

/** Rating giữa bậc (thang 0–1200) — khởi tạo độ khó item. */
export function levelMidRating(level: LevelCode): number {
  return levelIndex(level) * 100 + 50
}

export const TRACKS = ['preschool', 'primary', 'teen', 'general', 'toeic', 'ielts'] as const
export const Track = z.enum(TRACKS)
export type Track = z.infer<typeof Track>
