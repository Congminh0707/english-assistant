// Bản đồ thế giới của bé: nội dung tự soạn content/curated/kids/world/ (world.json + places/*.json).
// docs/19-kids-world.md §4
import { z } from 'zod'

const Text = z.string().trim().min(1)
const Id = z.string().regex(/^[a-z0-9-]+$/)
/** Từ khung (I, see, it's...) viết thường, không dấu câu */
const FrameWord = z.string().regex(/^[a-z']+$/)

export const KidsTierUnlockSchema = z.object({
  /** Tầng phải xong trước */
  tier: Id,
  /** Tỉ lệ số nơi của tầng đó đã xong (0.75 = 6/8, 9/12…) */
  placesDoneShare: z.number().gt(0).max(1),
  /** Tỉ lệ từ của tầng đó đạt mức mầm trở lên */
  sproutShare: z.number().min(0).max(1)
})
export type KidsTierUnlock = z.infer<typeof KidsTierUnlockSchema>

export const KidsTierSchema = z.object({
  id: Id,
  order: z.number().int().min(1),
  /** Tên đọc to (tiếng Anh) và tên cho phụ huynh */
  title: Text,
  vi: Text,
  /** Id cảnh bản đồ (2D/3D) của tầng */
  scene: Id,
  wordsPerPlace: z.number().int().min(2).max(20),
  maxSentenceWords: z.number().int().min(2).max(12),
  /** Tổng số từ mới của tầng phải nằm trong khoảng bậc (docs/06) */
  wordRange: z.tuple([z.number().int().min(0), z.number().int().min(1)]),
  frameWords: z.array(FrameWord),
  /** null = có sẵn từ đầu */
  unlock: KidsTierUnlockSchema.nullable()
})
export type KidsTier = z.infer<typeof KidsTierSchema>

export const KidsWorldFileSchema = z.object({
  license: z.literal('proprietary-own'),
  tiers: z.array(KidsTierSchema).min(1)
})
export type KidsWorldFile = z.infer<typeof KidsWorldFileSchema>

export const KidsWorldWordSchema = z.object({
  /** Id hình (shared/pictures.ts) — cũng là từ mới của nơi này */
  picture: Id,
  /** Câu bé nghe ở bước 5 (có chứa từ) */
  sentence: z.object({ en: Text, vi: Text })
})
export type KidsWorldWord = z.infer<typeof KidsWorldWordSchema>

export const KidsPlaceSchema = z.object({
  id: Id,
  tier: Id,
  /** Miền/vùng (vd north, central, south) — chỉ để nhóm trên bản đồ */
  region: Id.optional(),
  order: z.number().int().min(1),
  /** Thứ tự gợi ý "hôm nay nên tới" (chủ điểm gần gũi trước); bé vẫn chọn tự do */
  suggestOrder: z.number().int().min(1),
  title: Text,
  vi: Text,
  topic: Text,
  topicVi: Text,
  /** Id công trình nổi bật (mô hình voxel, src/shared/voxels/landmarks) */
  landmark: Id,
  landmarkVi: Text,
  /** Vị trí trên cảnh 2D 16:9, tính theo % */
  pos: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  /** Vị trí thật (vĩ độ, kinh độ) — tầng có bản đồ địa lý (Việt Nam) đặt nơi theo toạ độ này */
  geo: z
    .object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) })
    .optional(),
  /** Đường từ nơi trước (order − 1) tới nơi này đi qua các điểm [kinh độ, vĩ độ] — để đường bám đất liền */
  via: z.array(z.tuple([z.number(), z.number()])).optional(),
  /** Đoạn cuối (sau điểm `via` cuối) đi phà trên biển (vd ra đảo Phú Quốc) */
  ferry: z.boolean().optional(),
  /** Id vật trang trí quanh nơi này */
  decor: z.array(Id).default([])
})
export type KidsPlace = z.infer<typeof KidsPlaceSchema>

export const KidsPlaceFileSchema = z.object({
  license: z.literal('proprietary-own'),
  /** true khi người thật đã duyệt từ, câu, địa danh, văn hoá, hình công trình */
  reviewed: z.boolean(),
  place: KidsPlaceSchema,
  words: z.array(KidsWorldWordSchema).min(1)
})
export type KidsPlaceFile = z.infer<typeof KidsPlaceFileSchema>

// --- Dữ liệu cho giao diện (kênh kids:world / kids:visit / kids:visitDone) ---

const WordStageSchema = z.enum(['hidden', 'seed', 'sprout', 'flower'])
const Tries = z.union([z.literal(0), z.literal(1), z.literal(2)])

export const KidsWorldViewSchema = z.object({
  tiers: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      vi: z.string(),
      scene: z.string(),
      unlocked: z.boolean(),
      places: z.array(
        KidsPlaceSchema.omit({ tier: true }).extend({
          state: z.enum(['locked', 'open', 'done']),
          /** 0–3 sao (lượt tốt nhất khi xong nơi) */
          stars: z.number().int().min(0).max(3),
          words: z.array(
            z.object({
              pictureId: z.string(),
              word: z.string(),
              vi: z.string(),
              stage: WordStageSchema,
              thirsty: z.boolean(),
              /** Đã qua đủ 5 bước */
              done: z.boolean()
            })
          )
        })
      )
    })
  ),
  /** Nơi thú cưng đang đứng */
  currentPlaceId: z.string().nullable(),
  /** Nơi gợi ý hôm nay (lấp lánh); null khi đã xong mọi nơi đang mở */
  todayPlaceId: z.string().nullable(),
  /** Số từ mới còn được học hôm nay (chung mọi nơi) */
  newLeftToday: z.number().int().min(0),
  /** Số thẻ hình đến hạn ôn (bình tưới) */
  dueCount: z.number().int().min(0)
})
export type KidsWorldView = z.infer<typeof KidsWorldViewSchema>

export const KidsVisitInputSchema = z.object({ placeId: z.string().min(1).max(64) })

export const KidsVisitSchema = z.object({
  placeId: z.string(),
  batch: z.array(
    z.object({
      pictureId: z.string(),
      word: z.string(),
      vi: z.string(),
      /** Thẻ FSRS để chấm bước 2 qua kids:rate */
      cardId: z.string(),
      /** Thẻ chưa học lần nào (bước 1 làm quen) */
      isNew: z.boolean(),
      sentence: z.object({ en: z.string(), vi: z.string() }),
      /** Lựa chọn hình cho bước 2 và 5 (đã xáo, gồm hình đúng) */
      choices: z.array(z.string()).min(2).max(4)
    })
  ),
  /** Lượt chỉ ôn (hết từ mới trong hạn mức hoặc nơi đã xong) */
  reviewOnly: z.boolean()
})
export type KidsVisit = z.infer<typeof KidsVisitSchema>

export const KidsVisitDoneInputSchema = z.object({
  placeId: z.string().min(1).max(64),
  results: z
    .array(
      z.object({
        pictureId: z.string().min(1).max(64),
        /** Bước 2 và 5: 1 = đúng ngay, 2 = đúng lần hai, 0 = không ra */
        tapTries: Tries,
        sentenceTries: Tries,
        /** Bước 3 (chơi) và 4 (nói theo) đã làm */
        played: z.boolean(),
        spoke: z.boolean()
      })
    )
    .min(1)
    .max(8)
})
export type KidsVisitDoneInput = z.infer<typeof KidsVisitDoneInputSchema>

export const KidsVisitDoneResultSchema = z.object({
  stars: z.number().int().min(0).max(3),
  /** Nơi này vừa xong hết từ */
  placeDone: z.boolean(),
  /** Lần đầu xong nơi → mở rương thưởng */
  firstTime: z.boolean(),
  foodId: z.string().nullable(),
  /** Tầng vừa được mở nhờ lượt này (null nếu không) */
  tierUnlocked: z.string().nullable(),
  stages: z.array(z.object({ pictureId: z.string(), stage: WordStageSchema }))
})
export type KidsVisitDoneResult = z.infer<typeof KidsVisitDoneResultSchema>
