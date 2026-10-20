// Tiến bộ theo kỹ năng: gán kỹ năng cho dạng bài và rating Elo (thang 0–1200 như level) — phần thuần dùng ở main,
// renderer và test. docs/06-levels-and-progression.md
import { LEVEL_CODES, type LevelCode } from './schemas/content/level'

export const SKILLS = ['vocab', 'grammar', 'reading', 'listening'] as const
export type Skill = (typeof SKILLS)[number]

/** Nguồn của kết quả bài tập */
export type ProgressSource =
  'lesson' | 'grammar' | 'reading' | 'listening' | 'practice' | 'checkpoint'

/** Kỹ năng mà một dạng bài của bài học (lesson/grammar/reading/listening) rèn luyện */
export function lessonExerciseSkill(source: ProgressSource, type: string): Skill {
  if (type === 'listen') return 'listening'
  if (source === 'listening') return 'listening'
  if (source === 'reading') return 'reading'
  if (source === 'grammar') return 'grammar'
  // Bài học nền tảng: điền chỗ trống và sắp xếp câu là ngữ pháp, còn lại là từ vựng
  return type === 'gap' || type === 'order' ? 'grammar' : 'vocab'
}

/** Kỹ năng của các dạng bài luyện tập sinh từ câu Tatoeba */
export function practiceKindSkill(kind: string): Skill {
  switch (kind) {
    case 'word_order':
      return 'grammar'
    case 'listen_choice':
    case 'dictation':
      return 'listening'
    default:
      return 'vocab'
  }
}

// --- Elo ---

/** Hệ số K lớn lúc đầu (chưa đủ dữ liệu) rồi giảm dần */
export function eloK(games: number): number {
  return games < 30 ? 24 : 12
}

/** Xác suất đúng kỳ vọng của người có rating `rating` với bài có độ khó `difficulty` */
export function eloExpected(rating: number, difficulty: number): number {
  return 1 / (1 + 10 ** ((difficulty - rating) / 400))
}

/**
 * Cập nhật rating sau một loạt `total` câu cùng độ khó, đúng `correct` câu. Chia căn bậc hai số câu để một phiên
 * dài không làm rating nhảy quá mạnh. Kết quả giữ trong [0, 1200).
 */
export function eloUpdate(
  rating: number,
  difficulty: number,
  correct: number,
  total: number,
  games: number
): number {
  if (total <= 0) return rating
  const expected = eloExpected(rating, difficulty)
  const delta = (eloK(games) * (correct - total * expected)) / Math.sqrt(total)
  return Math.min(1199, Math.max(0, rating + delta))
}

/** Rating → level (mỗi bậc rộng 100) */
export function ratingToLevel(rating: number): LevelCode {
  return LEVEL_CODES[Math.min(LEVEL_CODES.length - 1, Math.max(0, Math.floor(rating / 100)))]
}

/** Số bậc level mà rating vượt level hiện tại (≥ 1: nên làm bài kiểm tra lên cấp) */
export function levelsAhead(rating: number, current: LevelCode): number {
  return LEVEL_CODES.indexOf(ratingToLevel(rating)) - LEVEL_CODES.indexOf(current)
}

/** Cần ít nhất chừng này câu cho kỹ năng thì mới tin rating (gợi ý lên cấp) */
export const MIN_GAMES_FOR_SUGGESTION = 20
