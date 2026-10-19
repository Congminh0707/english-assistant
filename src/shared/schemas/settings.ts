import { z } from 'zod'
import { LevelCode } from './content/level'

/**
 * Mọi cài đặt của app: khoá → schema (kèm giá trị mặc định).
 * Thêm cài đặt mới = thêm 1 dòng ở đây. Lưu trong bảng `settings` (docs/10-data-model.md).
 */
export const settingDefinitions = {
  'ui.language': z.enum(['vi', 'en']).default('vi'),
  /** Hệ số phóng to sprite (khung 48px): 1 = 48px, 2 = 96px, 3 = 144px */
  'mascot.scale': z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  'app.launchAtLogin': z.boolean().default(false),
  /** Trình độ hiện tại (tạm chọn tay; sau này do bài kiểm tra đầu vào quyết định) — chọn "Từ của khoảnh khắc" */
  'learning.level': LevelCode.default('A2_1'),
  /** Mascot tự hỏi ôn/giới thiệu từ mới mỗi N phút; 0 = tắt */
  'mascot.quizMinutes': z
    .union([z.literal(0), z.literal(15), z.literal(25), z.literal(45)])
    .default(25),
  /** Profile đang dùng (nội bộ, do ProfileService quản lý) */
  'app.activeProfileId': z.string().nullable().default(null)
} as const

export type SettingKey = keyof typeof settingDefinitions
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingDefinitions)[K]>
export type Settings = { [K in SettingKey]: SettingValue<K> }

export const SETTING_KEYS = Object.keys(settingDefinitions) as SettingKey[]

export const SettingsSchema = z.object(settingDefinitions)

export const SettingUpdateSchema = z.object({
  key: z.enum(SETTING_KEYS as [SettingKey, ...SettingKey[]]),
  value: z.unknown()
})
export type SettingUpdate = z.infer<typeof SettingUpdateSchema>

export const defaultSettings = (): Settings => SettingsSchema.parse({})
