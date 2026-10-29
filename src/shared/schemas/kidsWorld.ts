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
