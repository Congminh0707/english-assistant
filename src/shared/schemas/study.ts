import { z } from 'zod'
import { DictExampleSchema, DictSenseSchema } from './dictionary'

/** Số liệu trang chủ cửa sổ Học tập */
export const StudyOverviewSchema = z.object({
  /** Thẻ đã đến hạn ôn ngay bây giờ */
  dueCount: z.number().int(),
  /** Tổng số thẻ đang học (không tính thẻ đã xoá/tạm dừng) */
  totalCards: z.number().int(),
  /** Thẻ đã vào giai đoạn ôn dài hạn (FSRS state = Review) */
  learnedCards: z.number().int(),
  reviewedToday: z.number().int(),
  /** Số ngày liên tiếp có ôn từ (tính cả hôm nay; chưa ôn hôm nay thì tính tới hôm qua) */
  streakDays: z.number().int(),
  /** Chưa có gói từ điển nên không hiển thị được thẻ */
  packMissing: z.boolean()
})
export type StudyOverview = z.infer<typeof StudyOverviewSchema>

export const StudyRatingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
export type StudyRating = z.infer<typeof StudyRatingSchema>

/** Dạng hiển thị của thẻ trong phiên ôn */
export const StudyCardDirectionSchema = z.enum(['en_vi', 'vi_en', 'audio_en', 'cloze'])
export type StudyCardDirection = z.infer<typeof StudyCardDirectionSchema>

/** Một thẻ trong phiên ôn: hiện mặt trước, lật ra (hoặc gõ đáp án) rồi chấm 1–4 */
export const StudyCardSchema = z.object({
  cardId: z.string(),
  /** en_vi: thấy từ → nhớ nghĩa · vi_en: thấy nghĩa → gõ từ · audio_en: nghe → gõ từ · cloze: điền chỗ trống */
  direction: StudyCardDirectionSchema,
  lemma: z.string(),
  ipaUs: z.string().nullable(),
  ipaUk: z.string().nullable(),
  pos: z.array(z.string()),
  level: z.string(),
  vi: z.array(z.string()),
  viGenerated: z.boolean(),
  senses: z.array(DictSenseSchema),
  examples: z.array(DictExampleSchema),
  /** Câu ngữ cảnh lúc người dùng lưu từ */
  context: z.string().nullable(),
  /** Câu điền chỗ trống (direction = cloze) */
  cloze: z.object({ before: z.string(), after: z.string(), answer: z.string() }).nullable(),
  /** Các đáp án gõ được chấp nhận (vi_en, audio_en, cloze) */
  answers: z.array(z.string()),
  /** Gợi ý tiếng Việt cho thẻ điền chỗ trống */
  hint: z.string().nullable(),
  /** Thẻ của một mẫu câu (không phải từ trong từ điển) */
  isPhrase: z.boolean(),
  /** Thẻ nhận diện (en_vi) có trắc nghiệm nghĩa: 4 lựa chọn (đã xáo) và chỉ số đáp án đúng; null nếu không có */
  choices: z.array(z.string()).nullable(),
  choiceAnswer: z.number().int().nullable(),
  /** Thẻ mới học lần đầu (state = New) */
  isNew: z.boolean(),
  /** Bao lâu nữa sẽ ôn lại nếu chấm 1/2/3/4 (ngày; < 1 là thẻ đang học) */
  intervals: z.tuple([z.number(), z.number(), z.number(), z.number()])
})
export type StudyCard = z.infer<typeof StudyCardSchema>

export const StudyNextSchema = z.object({
  /** null = hết thẻ đến hạn (hoặc chưa có gói từ điển) */
  card: StudyCardSchema.nullable(),
  /** Số thẻ còn đến hạn, kể cả thẻ đang hiện */
  dueCount: z.number().int()
})
export type StudyNext = z.infer<typeof StudyNextSchema>

export const StudyRateInputSchema = z.object({
  cardId: z.string().min(1),
  rating: StudyRatingSchema,
  elapsedMs: z.number().int().min(0).max(600_000)
})

export const StudyRateResultSchema = z.object({
  intervalDays: z.number(),
  dueCount: z.number().int()
})
export type StudyRateResult = z.infer<typeof StudyRateResultSchema>

/** Nhiệm vụ ngày */
export const MissionSchema = z.object({
  id: z.enum(['review', 'learn', 'clear']),
  progress: z.number().int(),
  target: z.number().int(),
  /** Đã nhận thưởng hôm nay */
  done: z.boolean(),
  xp: z.number().int(),
  coins: z.number().int()
})
export const MissionsStateSchema = z.object({
  /** Ngày cục bộ YYYY-MM-DD */
  day: z.string(),
  goal: z.number().int(),
  missions: z.array(MissionSchema),
  /** Thưởng thêm khi xong cả ba */
  bonus: z.object({ xp: z.number().int(), coins: z.number().int(), done: z.boolean() }),
  allDone: z.boolean()
})
export type MissionsState = z.infer<typeof MissionsStateSchema>

/** Một từ trong sổ từ */
export const WordListItemSchema = z.object({
  cardId: z.string(),
  contentId: z.string(),
  lemma: z.string(),
  vi: z.string().nullable(),
  level: z.string().nullable(),
  /** 0 Mới · 1 Đang học · 2 Ôn · 3 Học lại */
  state: z.number().int(),
  due: z.number(),
  reps: z.number().int(),
  lapses: z.number().int(),
  savedAt: z.number(),
  /** Đang tạm dừng ôn (mọi thẻ của từ) */
  suspended: z.boolean(),
  /** Số thẻ phụ đang có (Việt→Anh, nghe-gõ, điền từ) */
  siblings: z.number().int(),
  /** Mẫu câu thay vì từ đơn */
  isPhrase: z.boolean()
})
export type WordListItem = z.infer<typeof WordListItemSchema>

export const StudyBackfillResultSchema = z.object({ created: z.number().int() })

export const SaveManyInputSchema = z.object({
  items: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(60),
        context: z.string().max(500).nullable().optional()
      })
    )
    .min(1)
    .max(60)
})
export const SaveManyResultSchema = z.object({
  /** Từ mới được lưu */
  saved: z.number().int(),
  /** Từ đã có trong sổ */
  already: z.number().int(),
  /** Không tìm thấy trong từ điển */
  missing: z.number().int()
})
export type SaveManyResult = z.infer<typeof SaveManyResultSchema>
