// Gói sprite độ phân giải cao (tải thêm, không nằm trong bộ cài): khung 288px thay cho khung 96px của bộ cài.
// Dùng chung giữa script đóng gói (scripts/sprites/build-hires-pack.mjs), main và renderer. Thuần: không import electron/node.

export const SPRITE_PACK_ID = 'pet-sprites-hires'
/** Khung của gói (px); bộ cài dùng 96 */
export const HIRES_FRAME = 288

export const SPRITE_STAGES = ['egg', 'baby', 'teen', 'adult', 'legend'] as const
export type SpriteStage = (typeof SPRITE_STAGES)[number]

/** Tên một file ảnh trong gói (không có đuôi): sheet chính, lớp phụ kiện trước (acc-*) và sau lưng (accb-*) */
export const SPRITE_ASSET_NAME = /^(sheet|accb?-[a-z-]+)$/

export interface SpritePackManifest {
  id: string
  version: string
  frame: number
  /** Đường dẫn tương đối trong gói, vd 'bi/adult/sheet.webp' */
  files: string[]
}
