// Luyện viết trong bài học (dạng bài `translate`, `write` — docs/07 "Luyện viết"): hằng số và quyết định chấm thuần,
// dùng chung ở main (WritingService), renderer (khoá nút nộp, chấm dự phòng khi IPC lỗi) và test.
import { diaryWordCount } from './schemas/diary'

/** Độ dài tối đa câu dịch (ký tự) — câu tiếng Việt và đáp án mẫu cũng không dài hơn */
export const TRANSLATE_MAX_CHARS = 400
/** Độ dài tối đa bài viết (ký tự), cùng cỡ với nhật ký (DIARY_MAX_CHARS) */
export const WRITE_MAX_CHARS = 1200
/** Bài viết đạt khi điểm tổng AI chấm (0–100) từ mức này trở lên */
export const WRITE_PASS = 60

/** Đếm từ: cùng cách đếm với nhật ký (các cụm cách nhau bởi khoảng trắng) */
export const writingWordCount = diaryWordCount

/** Số từ so với yêu cầu của đề: thiếu / thừa / vừa */
export function writeLength(
  text: string,
  minWords: number,
  maxWords?: number
): { words: number; status: 'short' | 'long' | 'ok' } {
  const words = writingWordCount(text)
  const status =
    words < minWords ? 'short' : maxWords !== undefined && words > maxWords ? 'long' : 'ok'
  return { words, status }
}

/** Cách đã chấm câu dịch: khớp đáp án mẫu / AI xét / không khớp và không có AI (so khớp tại máy) */
export type TranslateGradedBy = 'match' | 'ai' | 'local'

/**
 * Kết luận câu dịch: khớp đáp án mẫu → đúng (không cần AI); không khớp → theo AI nếu có kết quả, không thì sai
 * (hiện đáp án mẫu)
 */
export function translateVerdict(
  matched: boolean,
  ai: { ok: boolean } | null
): { correct: boolean; gradedBy: TranslateGradedBy } {
  if (matched) return { correct: true, gradedBy: 'match' }
  if (ai) return { correct: ai.ok, gradedBy: 'ai' }
  return { correct: false, gradedBy: 'local' }
}

/** Kết luận bài viết: có điểm AI → đạt khi `overall ≥ WRITE_PASS`; không có AI → đạt khi đủ `minWords` từ */
export function writeVerdict(
  words: number,
  minWords: number,
  ai: { overall: number } | null
): boolean {
  return ai ? ai.overall >= WRITE_PASS : words >= minWords
}
