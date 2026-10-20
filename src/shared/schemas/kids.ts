// Chế độ trẻ em và phụ huynh: nội dung hoạt động (file tự soạn content/curated/kids/*.json) và dữ liệu giao diện.
import { z } from 'zod'

const Text = z.string().trim().min(1)

/**
 * Loại hoạt động: chữ cái, âm (phonics), ghép âm CVC, từ nhìn là nhớ, sách tranh (mỗi trang một hình + câu ngắn),
 * tập viết chữ (tô theo chữ mẫu), nói lặp lại (nghe rồi nói; chưa chấm giọng — chờ nhận dạng giọng nói ở Phase 3)
 */
export const KidsKindSchema = z.enum([
  'letters',
  'sounds',
  'blend',
  'sight',
  'book',
  'trace',
  'speak'
])
export type KidsKind = z.infer<typeof KidsKindSchema>

export const KidsItemSchema = z.object({
  /** Chữ/từ hiện to trên màn hình */
  text: Text,
  /** Chuỗi TTS đọc (mặc định = text) */
  say: Text.optional(),
  /** Từ ví dụ (vd chữ A → "apple") */
  word: Text.optional(),
  /** Id hình pixel minh hoạ (xem shared/pictures.ts) */
  picture: Text.optional(),
  /** blend: các chữ cái và âm của từng chữ để bấm nghe từng âm rồi ghép */
  letters: z.array(Text).min(2).max(5).optional(),
  sounds: z.array(Text).min(2).max(5).optional()
})
export type KidsItem = z.infer<typeof KidsItemSchema>

export const KidsActivitySchema = z.object({
  /** Mã hoạt động, vd 'letters-a-f' */
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Tên hiển thị (tiếng Anh, được đọc to) và nghĩa tiếng Việt (nhỏ, cho phụ huynh) */
  title: Text,
  vi: Text,
  /** Hình đại diện */
  picture: Text.optional(),
  kind: KidsKindSchema,
  items: z.array(KidsItemSchema).min(3).max(12)
})
export type KidsActivity = z.infer<typeof KidsActivitySchema>

export const KidsFileSchema = z.object({
  license: z.literal('proprietary-own'),
  unit: z.object({
    id: z.string().regex(/^[a-z0-9]+$/),
    title: Text,
    vi: Text,
    picture: Text,
    order: z.number().int().min(1)
  }),
  activities: z.array(KidsActivitySchema).min(1)
})
export type KidsFile = z.infer<typeof KidsFileSchema>

// --- Dữ liệu cho giao diện ---

export const KidsUnitsSchema = z.object({
  units: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      vi: z.string(),
      picture: z.string(),
      activities: z.array(
        KidsActivitySchema.extend({
          /** 0 = chưa chơi, 1–3 sao */
          stars: z.number().int().min(0).max(3)
        })
      )
    })
  )
})
export type KidsUnits = z.infer<typeof KidsUnitsSchema>

export const KidsCompleteInputSchema = z.object({
  activityId: z.string().min(1),
  correct: z.number().int().min(0).max(20),
  total: z.number().int().min(1).max(20)
})
export const KidsCompleteResultSchema = z.object({
  stars: z.number().int().min(0).max(3),
  /** Lần đầu hoàn thành hoạt động này → được thưởng */
  firstTime: z.boolean(),
  /** Món ăn tặng thú cưng (nếu có) */
  foodId: z.string().nullable()
})
export type KidsCompleteResult = z.infer<typeof KidsCompleteResultSchema>

/** Một thẻ "nghe → chạm hình" */
export const KidsCardSchema = z.object({
  cardId: z.string(),
  /** Id hình đúng, và các hình lựa chọn (đã xáo, gồm cả hình đúng) */
  pictureId: z.string(),
  word: z.string(),
  vi: z.string(),
  choices: z.array(z.string()).min(2).max(4),
  isNew: z.boolean()
})
export type KidsCard = z.infer<typeof KidsCardSchema>

export const KidsNextSchema = z.object({
  card: KidsCardSchema.nullable(),
  /** Số thẻ còn đến hạn (không tính hình mới sắp giới thiệu) */
  dueCount: z.number().int()
})

export const KidsRateInputSchema = z.object({
  cardId: z.string().min(1),
  /** 1 = đúng ngay lần đầu, 2 = đúng ở lần hai, 0 = không ra */
  tries: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  elapsedMs: z.number().int().min(0).max(600_000)
})
export const KidsRateResultSchema = z.object({
  /** Hình này lần đầu được dán vào album */
  stickerNew: z.boolean()
})

export const KidsStickersSchema = z.object({
  stickers: z.array(
    z.object({ pictureId: z.string(), word: z.string(), vi: z.string(), earned: z.boolean() })
  ),
  earned: z.number().int(),
  total: z.number().int()
})

export type KidsStickers = z.infer<typeof KidsStickersSchema>

export const KidsRewardResultSchema = z.object({
  /** null = hôm nay đã nhận đủ quà */
  foodId: z.string().nullable()
})

/** Tình trạng thời gian dùng hôm nay */
export const UsageStatusSchema = z.object({
  usedSeconds: z.number().int(),
  /** Giới hạn hôm nay (đã tính phần phụ huynh gia hạn); 0 = không giới hạn */
  limitSeconds: z.number().int(),
  locked: z.boolean()
})
export type UsageStatus = z.infer<typeof UsageStatusSchema>

export const KidsHomeSchema = z.object({
  petName: z.string(),
  dueCount: z.number().int(),
  stickersEarned: z.number().int(),
  stickersTotal: z.number().int(),
  activitiesDone: z.number().int(),
  activitiesTotal: z.number().int(),
  pinSet: z.boolean(),
  usage: UsageStatusSchema
})
export type KidsHome = z.infer<typeof KidsHomeSchema>

export const KidsTickInputSchema = z.object({ seconds: z.number().int().min(1).max(60) })

// --- Phụ huynh ---

export const PinSchema = z.string().regex(/^\d{4}$/)

export const ParentStatusSchema = z.object({ pinSet: z.boolean() })

export const ParentSetPinInputSchema = z.object({
  pin: PinSchema,
  /** Bắt buộc khi đã có PIN */
  currentPin: PinSchema.optional()
})

export const ParentVerifyInputSchema = z.object({ pin: z.string().max(8) })
export const ParentVerifyResultSchema = z.object({
  ok: z.boolean(),
  /** Nhập sai quá nhiều: phải chờ bấy nhiêu giây */
  retryAfterSeconds: z.number().int()
})

export const ParentExtendInputSchema = z.object({
  pin: z.string().max(8),
  minutes: z.number().int().min(5).max(60)
})

/** Câu hỏi nhân khi quên PIN: a × b */
export const ParentForgotSchema = z.object({
  id: z.string(),
  a: z.number().int(),
  b: z.number().int()
})
export const ParentResetInputSchema = z.object({
  id: z.string().min(1),
  answer: z.number().int().min(0).max(9999)
})

export const ParentReportSchema = z.object({
  /** Giới hạn mỗi ngày (phút; 0 = không giới hạn) */
  dailyLimitMinutes: z.number().int(),
  days: z.array(
    z.object({
      day: z.string(),
      /** Số giây dùng app */
      seconds: z.number().int(),
      /** Số thẻ đã ôn */
      reviews: z.number().int()
    })
  ),
  stickersEarned: z.number().int(),
  stickersTotal: z.number().int(),
  activitiesDone: z.number().int(),
  activitiesTotal: z.number().int(),
  /** Các từ bé hay chưa nhớ (nhiều lần quên nhất) */
  hardest: z.array(z.object({ word: z.string(), vi: z.string(), lapses: z.number().int() }))
})
export type ParentReport = z.infer<typeof ParentReportSchema>
