import { z } from 'zod'
import { LevelCode } from './content/level'
import { UK_VOICE_IDS, US_VOICE_IDS } from '../tts'
import { AiModelSchema, AiProviderSettingSchema } from './ai'

/** Giờ trong ngày dạng 'HH:MM' */
const ClockTime = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/)

/**
 * Mọi cài đặt của app: khoá → schema (kèm giá trị mặc định).
 * Thêm cài đặt mới = thêm 1 dòng ở đây. Lưu trong bảng `settings` (docs/10-data-model.md).
 */
export const settingDefinitions = {
  'ui.language': z.enum(['vi', 'en']).default('vi'),
  /** Chủ đề màu giao diện: sáng, tối, hoặc theo hệ điều hành */
  'ui.theme': z.enum(['light', 'dark', 'system']).default('system'),
  /** Bấm phím tắt dịch thì tự lấy chữ đang bôi đen (gửi Ctrl+C giả lập, khôi phục clipboard); tắt = chỉ dùng chữ đã Ctrl+C */
  'translate.autoCopy': z.boolean().default(true),
  /** Kích thước mascot theo khung gốc 48px: 1 = 48px, 2 = 96px, 3 = 144px (sheet 96×96 được thu lại tương ứng) */
  'mascot.scale': z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  'app.launchAtLogin': z.boolean().default(false),
  /** Tự kiểm tra bản mới khi mở app và mỗi vài giờ (chỉ kiểm tra, không tự tải/cài) */
  'app.autoUpdate': z.boolean().default(true),
  /** Trình độ hiện tại (tạm chọn tay; sau này do bài kiểm tra đầu vào quyết định) — chọn "Từ của khoảnh khắc" */
  'learning.level': LevelCode.default('A2_1'),
  /** Trình độ theo kỹ năng (do bài kiểm tra đầu vào cập nhật): từ vựng, ngữ pháp, đọc hiểu */
  'learning.levelVocab': LevelCode.default('A2_1'),
  'learning.levelGrammar': LevelCode.default('A2_1'),
  'learning.levelReading': LevelCode.default('A2_1'),
  'learning.levelListening': LevelCode.default('A2_1'),
  /** Mục tiêu ôn mỗi ngày (số thẻ) — nhiệm vụ ngày "Ôn N thẻ" */
  'learning.dailyGoal': z
    .union([z.literal(5), z.literal(10), z.literal(20), z.literal(30)])
    .default(10),
  /** Mục tiêu phút học mỗi ngày — lộ trình hôm nay thêm bài cho tới khi đủ (docs/07 §13) */
  'learning.dailyMinutes': z
    .union([z.literal(10), z.literal(20), z.literal(30), z.literal(60)])
    .default(20),
  /** Mascot tự hỏi ôn/giới thiệu từ mới mỗi N phút; 0 = tắt */
  'mascot.quizMinutes': z
    .union([z.literal(0), z.literal(15), z.literal(25), z.literal(45)])
    .default(25),
  /** Giờ (cục bộ, 0–23) mascot nhắc viết nhật ký tiếng Anh, một lần mỗi ngày; null = tắt (docs/07 §14) */
  'diary.hour': z.number().int().min(0).max(23).nullable().default(21),
  /**
   * Giờ (cục bộ, 0–23) mascot nhắc lộ trình hôm nay còn dở ("Hôm nay còn N việc…"), một lần mỗi ngày; null = tắt.
   * Mặc định khác giờ nhật ký để hai bong bóng có action không chồng nhau
   */
  'plan.reminderHour': z.number().int().min(0).max(23).nullable().default(10),
  /** Ngày cục bộ 'YYYY-MM-DD' đã nhắc lộ trình (nội bộ, do PlanReminderJob quản lý; giữ qua lần mở lại app) */
  'plan.remindedDay': z.string().max(10).default(''),
  /** Dịch câu/đoạn: ưu tiên model chất lượng cao (NLLB-200) khi đã tải; tắt = luôn dùng bản nhanh opus-mt */
  'translate.highQuality': z.boolean().default(true),
  /** Dịch online bằng Claude (cần API key của người dùng; văn bản được gửi tới Anthropic). Mặc định tắt */
  'translate.online': z.boolean().default(false),
  /** Dịch online bằng Google/Azure khi người dùng đã nhập key (văn bản được gửi tới Google/Microsoft). Mặc định bật */
  'translate.cloud': z.boolean().default(true),
  /** AI (Claude, dùng chung key của Dịch online): giải thích ngữ pháp… — câu được gửi tới Anthropic. Mặc định tắt */
  'ai.enabled': z.boolean().default(false),
  /** Model Claude cho AI (docs/decisions.md #56) */
  'ai.model': AiModelSchema.default('claude-haiku-5-5'),
  /** Bộ đếm lượt gọi AI trong tháng (nội bộ, do AiService quản lý): 'YYYY-MM:n' */
  'ai.usage': z.string().max(32).default(''),
  /** Nhà cung cấp AI: auto = có key API thì dùng API, không thì Claude Code CLI nếu đã cài + đăng nhập (docs/11 §5) */
  'ai.provider': AiProviderSettingSchema.default('auto'),
  /** Hạn mức lượt gọi Claude Code CLI mỗi ngày (dùng chung hạn mức gói Claude của người dùng); 0 = tắt CLI */
  'ai.cliDailyLimit': z.number().int().min(0).max(200).default(60),
  /**
   * Bỏ hạn mức ngày của CLI (vẫn đếm lượt để hiển thị). Chỉ có hiệu lực khi `ai.cliDailyLimit` > 0: hạn mức 0 = tắt CLI
   * luôn thắng (docs/11 §5, src/shared/aiLimit.ts)
   */
  'ai.cliUnlimited': z.boolean().default(false),
  /** Bộ đếm lượt gọi CLI trong ngày cục bộ (nội bộ, do AiService quản lý): 'YYYY-MM-DD:n' */
  'ai.cliUsage': z.string().max(32).default(''),
  /** Ôn thẻ: số từ mới đưa vào ôn mỗi ngày (0 = không giới hạn) */
  'review.newPerDay': z
    .union([z.literal(0), z.literal(5), z.literal(10), z.literal(20), z.literal(50)])
    .default(0),
  /** Thứ tự thẻ trong phiên ôn: ngẫu nhiên / xen kẽ theo hạn / thẻ mới trước / thẻ cũ trước */
  'review.order': z.enum(['random', 'mixed', 'new-first', 'review-first']).default('random'),
  /** Sau khi ôn một từ (bất kể chấm gì), ẩn mọi thẻ của từ đó trong N phút để khỏi lặp lại; 0 = không ẩn */
  'review.hideMinutes': z
    .union([
      z.literal(0),
      z.literal(10),
      z.literal(30),
      z.literal(60),
      z.literal(180),
      z.literal(720)
    ])
    .default(30),
  /** Tự tạo thẻ Việt→Anh / nghe-gõ / điền từ khi một từ đã thuộc (vào ôn dài hạn) */
  'review.dirViEn': z.boolean().default(true),
  'review.dirAudio': z.boolean().default(true),
  'review.dirCloze': z.boolean().default(true),
  /** Thẻ nhận diện: hiện 4 lựa chọn nghĩa để chọn thay vì chỉ lật thẻ rồi tự chấm */
  'review.choices': z.boolean().default(true),
  /** Gõ đáp án ở các thẻ Việt→Anh, nghe-gõ, điền từ (tắt = chỉ lật thẻ rồi tự chấm) */
  'review.typing': z.boolean().default(true),
  /** Tự đọc từ khi hiện thẻ (thẻ nghe-gõ luôn tự đọc) */
  'review.autoPlay': z.boolean().default(true),
  /** Lần đầu đạt một bài đọc: tự lưu tối đa 8 từ khó của bài (kèm câu ngữ cảnh) vào sổ từ */
  'review.autoSaveReading': z.boolean().default(true),
  /** Chế độ trẻ em: giới hạn phút dùng app mỗi ngày (0 = không giới hạn) */
  'kids.dailyMinutes': z
    .union([
      z.literal(0),
      z.literal(10),
      z.literal(15),
      z.literal(20),
      z.literal(30),
      z.literal(45),
      z.literal(60)
    ])
    .default(15),
  /** Chế độ trẻ em: số từ mới tối đa học xong mỗi ngày trên bản đồ (0 = không giới hạn) */
  'kids.newPerDay': z
    .union([z.literal(0), z.literal(3), z.literal(6), z.literal(10), z.literal(20)])
    .default(0),
  /** Chế độ trẻ em: độ tuổi của bé, đổi độ khó và cách chơi của mini-game (docs/14 giai đoạn D) */
  'kids.ageBand': z.enum(['3-4', '5-6', '7-8']).default('5-6'),
  /** Chế độ trẻ em: tiếng động của màn game (chạm, đi, rương…); giọng đọc từ vẫn luôn bật */
  'kids.gameSound': z.boolean().default(true),
  /** Giọng đọc: 'system' = giọng Windows có sẵn; 'kokoro' = giọng tự nhiên offline (cần tải model) */
  'tts.engine': z.enum(['system', 'kokoro']).default('system'),
  /** Giọng mặc định khi đọc bài học, bài tập, câu hỏi (nút có ghi rõ Mỹ/Anh vẫn đọc đúng giọng đó) */
  'tts.accent': z.enum(['us', 'uk']).default('us'),
  'tts.voiceUs': z.enum(US_VOICE_IDS).default('af_bella'),
  'tts.voiceUk': z.enum(UK_VOICE_IDS).default('bf_isabella'),
  /** Chế độ yên lặng: tạm ẩn mascot khi đang họp trực tuyến (Zoom, Teams, Meet...) */
  'quiet.meetings': z.boolean().default(true),
  /** Chế độ yên lặng: khung giờ không làm phiền (có thể vắt qua nửa đêm) */
  'quiet.dnd.enabled': z.boolean().default(false),
  'quiet.dnd.from': ClockTime.default('22:00'),
  'quiet.dnd.to': ClockTime.default('07:00'),
  /** Đã qua màn hình chào lần đầu (onboarding) chưa */
  'app.onboarded': z.boolean().default(false),
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

/** Bộ đếm/trạng thái do main quản lý: renderer không được ghi qua settings:set (để hạn mức ngày của CLI không bị đặt lại) */
export const MAIN_ONLY_SETTING_KEYS: readonly SettingKey[] = [
  'ai.usage',
  'ai.cliUsage',
  'plan.remindedDay'
]

export const defaultSettings = (): Settings => SettingsSchema.parse({})
