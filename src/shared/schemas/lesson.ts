// Bài học nền tảng (chữ cái, phát âm, mẫu câu, các thì...) — định dạng file nội dung tự soạn:
//   content/curated/lessons/<số>-<tên>.json  (một file = một chương gồm nhiều bài)
// Giải thích bằng tiếng Việt; ví dụ tiếng Anh nghe được bằng TTS; bài tập chấm tại chỗ.
import { z } from 'zod'
import { LevelCode } from './content/level'

const Text = z.string().trim().min(1)

/**
 * Văn bản giải thích dùng cú pháp rất nhỏ (không HTML):
 * đoạn cách nhau bằng dòng trống; dòng bắt đầu "- " là mục danh sách;
 * **chữ đậm**; `cụm tiếng Anh` hiển thị nổi bật.
 */
export const LessonBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), md: Text }),
  /** Hộp lưu ý / mẹo / lỗi hay gặp của người Việt */
  z.object({ type: z.literal('tip'), md: Text }),
  /** Ví dụ câu có nút nghe */
  z.object({
    type: z.literal('examples'),
    title: Text.optional(),
    items: z.array(z.object({ en: Text, vi: Text, note: Text.optional() })).min(1)
  }),
  z.object({
    type: z.literal('table'),
    title: Text.optional(),
    head: z.array(Text).min(2).max(6),
    rows: z.array(z.array(z.string())).min(1)
  }),
  /** Lưới âm/từ để bấm nghe (chữ cái, âm, từ mẫu) */
  z.object({
    type: z.literal('sounds'),
    title: Text.optional(),
    items: z
      .array(
        z.object({
          /** Hiển thị trên ô */
          text: Text,
          /** Phiên âm IPA (Mỹ) */
          ipa: Text.optional(),
          /** Ghi chú ngắn (vd mẹo phát âm, từ ví dụ) */
          note: Text.optional(),
          /** Chuỗi đưa cho TTS đọc nếu khác `text` (vd chữ cái "A" đọc là "ay") */
          say: Text.optional()
        })
      )
      .min(1)
  })
])
export type LessonBlock = z.infer<typeof LessonBlockSchema>

export const LessonExerciseSchema = z.discriminatedUnion('type', [
  /** Trắc nghiệm */
  z.object({
    type: z.literal('mcq'),
    prompt: Text,
    choices: z.array(Text).min(2).max(4),
    answer: z.number().int().min(0).max(3),
    explain: Text.optional()
  }),
  /** Điền chỗ trống "___" (gõ, hoặc chọn nếu có `choices`) */
  z.object({
    type: z.literal('gap'),
    /** Câu có đúng một chỗ trống "___" */
    prompt: Text,
    /** Các đáp án chấp nhận (không phân biệt hoa/thường) */
    answers: z.array(Text).min(1),
    choices: z.array(Text).min(2).max(4).optional(),
    explain: Text.optional()
  }),
  /** Sắp xếp các từ thành câu đúng */
  z.object({
    type: z.literal('order'),
    /** Gợi ý nghĩa tiếng Việt */
    hint: Text,
    answer: Text,
    explain: Text.optional()
  }),
  /** Ghép cặp */
  z.object({
    type: z.literal('match'),
    prompt: Text.optional(),
    pairs: z
      .array(z.object({ left: Text, right: Text }))
      .min(3)
      .max(6)
  }),
  /** Nghe rồi chọn */
  z.object({
    type: z.literal('listen'),
    /** Chuỗi TTS đọc */
    say: Text,
    prompt: Text.optional(),
    choices: z.array(Text).min(2).max(4),
    answer: z.number().int().min(0).max(3),
    explain: Text.optional()
  })
])
export type LessonExercise = z.infer<typeof LessonExerciseSchema>

export const LessonSchema = z.object({
  /** '<mã chương>.<mã bài>', vd 'alphabet.letters' */
  id: z.string().regex(/^[a-z0-9]+\.[a-z0-9-]+$/),
  title: Text,
  summary: Text,
  /** Trình độ phù hợp (thang level chung) */
  level: LevelCode,
  /** Thời gian học dự kiến (phút) */
  minutes: z.number().int().min(1).max(30),
  blocks: z.array(LessonBlockSchema).min(2),
  exercises: z.array(LessonExerciseSchema).min(6).max(12)
})
export type Lesson = z.infer<typeof LessonSchema>

export const LessonUnitSchema = z.object({
  /** Mã chương, vd 'alphabet' — mọi bài trong chương có id bắt đầu bằng mã này */
  id: z.string().regex(/^[a-z0-9]+$/),
  title: Text,
  summary: Text,
  icon: Text,
  /** Thứ tự chương trong lộ trình */
  order: z.number().int().min(1)
})

/** Một file nội dung = một chương */
export const LessonUnitFileSchema = z.object({
  /** Nội dung tự soạn (docs/08-content-sources.md: proprietary-own) */
  license: z.literal('proprietary-own'),
  unit: LessonUnitSchema,
  lessons: z.array(LessonSchema).min(1)
})
export type LessonUnitFile = z.infer<typeof LessonUnitFileSchema>

// --- Dữ liệu trả về cho giao diện ---

export const LessonProgressSchema = z.object({
  /** Điểm cao nhất (0–100); null = chưa làm */
  best: z.number().int().nullable(),
  /** Đã hoàn thành (điểm ≥ ngưỡng đạt) */
  done: z.boolean()
})

export const LessonSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  level: LevelCode,
  minutes: z.number().int(),
  exerciseCount: z.number().int(),
  progress: LessonProgressSchema
})

export const LessonCatalogSchema = z.object({
  units: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      icon: z.string(),
      lessons: z.array(LessonSummarySchema)
    })
  ),
  doneCount: z.number().int(),
  totalCount: z.number().int()
})
export type LessonCatalog = z.infer<typeof LessonCatalogSchema>

export const LessonCompleteInputSchema = z.object({
  lessonId: z.string().min(1),
  correct: z.number().int().min(0).max(12),
  total: z.number().int().min(1).max(12)
})
export const LessonCompleteResultSchema = z.object({
  /** Điểm lần này (0–100) */
  score: z.number().int(),
  best: z.number().int(),
  /** Lần đầu đạt ngưỡng → có thưởng */
  firstCompletion: z.boolean(),
  xp: z.number().int(),
  coins: z.number().int(),
  /** Bài kế tiếp trong lộ trình (null nếu là bài cuối) */
  nextLessonId: z.string().nullable()
})
export type LessonCompleteResult = z.infer<typeof LessonCompleteResultSchema>

/** Điểm tối thiểu (%) để tính là hoàn thành bài */
export const LESSON_PASS_PERCENT = 70
