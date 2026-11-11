// Trả lời câu hỏi bằng giọng nói (dạng bài `respond` = speak_answer — docs/07 "Trả lời câu hỏi bằng giọng nói"):
// hằng số, giới hạn và quyết định chấm thuần, dùng chung ở main (SpeakingService), renderer (store, chấm dự phòng khi
// IPC lỗi) và test.
import { spokenWordCount, STT_MAX_SECONDS, type TimedWord } from './speech'

/** Câu trả lời đạt khi điểm tổng AI chấm (0–100) từ mức này trở lên (cùng mức với bài viết, WRITE_PASS) */
export const RESPOND_PASS = 60
/** Độ dài tối đa lời nhận dạng gửi lên main (ký tự) — 30 giây nói không bao giờ dài hơn */
export const RESPOND_MAX_CHARS = 1500
/** Số từ có mốc thời gian tối đa gửi lên main */
export const RESPOND_MAX_WORDS = 200
/** Độ dài tối đa một từ (ký tự) */
export const RESPOND_MAX_WORD_CHARS = 40
/** Mốc thời gian tối đa của một từ (giây): giới hạn ghi âm 30 giây + dư cho phần đệm Whisper */
export const RESPOND_MAX_TIME_SEC = STT_MAX_SECONDS + 5
/** Độ dài tối đa câu hỏi và câu trả lời mẫu trong nội dung bài */
export const RESPOND_QUESTION_MAX_CHARS = 300
export const RESPOND_SAMPLE_MAX_CHARS = 400

/** Kết luận câu trả lời: có điểm AI → đạt khi `overall ≥ RESPOND_PASS`; không có AI → đạt khi nói đủ `minWords` từ */
export function respondVerdict(
  words: number,
  minWords: number,
  ai: { overall: number } | null
): boolean {
  return ai ? ai.overall >= RESPOND_PASS : words >= minWords
}

/**
 * Đưa lời nhận dạng về trong giới hạn của kênh `speaking:feedback` trước khi gửi (Whisper đôi khi lặp vòng ra chuỗi
 * rất dài): cắt chữ, số từ, độ dài từng từ; mốc thời gian không hợp lệ bị kẹp vào [0, RESPOND_MAX_TIME_SEC] và
 * `end ≥ start`. Main vẫn kiểm tra lại bằng zod.
 */
export function boundAnswer(
  text: string,
  words: TimedWord[]
): { transcript: string; words: TimedWord[] } {
  const clamp = (n: number): number =>
    Number.isFinite(n) ? Math.min(RESPOND_MAX_TIME_SEC, Math.max(0, n)) : 0
  return {
    transcript: text.trim().slice(0, RESPOND_MAX_CHARS),
    words: words.slice(0, RESPOND_MAX_WORDS).map((w) => {
      const start = clamp(w.start)
      return {
        word: w.word.slice(0, RESPOND_MAX_WORD_CHARS),
        start,
        end: Math.max(start, clamp(w.end))
      }
    })
  }
}

/** Số từ đã nói của lời nhận dạng (không tính từ đệm) */
export const respondWordCount = spokenWordCount
