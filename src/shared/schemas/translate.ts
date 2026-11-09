import { z } from 'zod'

/** Số ký tự tối đa một lần dịch (phím tắt dịch cả đoạn dài vẫn được cắt cho an toàn) */
export const TRANSLATE_MAX_CHARS = 1200

/** Chiều dịch: Anh→Việt hoặc Việt→Anh (mỗi chiều một model riêng) */
export const TranslateDirectionSchema = z.enum(['en-vi', 'vi-en'])
export type TranslateDirection = z.infer<typeof TranslateDirectionSchema>

/**
 * Model dịch có thể tải: opus-mt từng chiều (nhanh, nhỏ) hoặc 'high' = NLLB-200 một model cho cả hai chiều
 * (chậm hơn, ~890 MB (848 MiB), chuẩn hơn rõ rệt)
 */
export const TranslateModelKeySchema = z.enum(['en-vi', 'vi-en', 'high'])
export type TranslateModelKey = z.infer<typeof TranslateModelKeySchema>

/** Đầu vào các kênh quản lý model (trường `direction` nay nhận cả 'high') */
export const TranslateDirectionInputSchema = z.object({ direction: TranslateModelKeySchema })

export const TranslateStateSchema = z.enum(['not-installed', 'downloading', 'ready', 'error'])

/** Trạng thái một model offline (dịch opus-mt, giọng đọc Kokoro) */
export const TranslateStatusSchema = z.object({
  state: TranslateStateSchema,
  /** Dung lượng cần tải (byte) */
  sizeBytes: z.number().int(),
  /** Đang tải: số byte đã nhận */
  receivedBytes: z.number().int(),
  /** Mã lỗi khi state = 'error' hoặc khi cập nhật gói thất bại (khoá i18n) */
  errorKey: z.string().nullable(),
  /** Gói tải thêm đã cài nhưng có bản mới hơn (bản cũ vẫn dùng được) */
  updateAvailable: z.boolean().optional()
})
export type TranslateStatus = z.infer<typeof TranslateStatusSchema>

/** Sự kiện đổi trạng thái model dịch: kèm chiều dịch */
export const TranslateStatusEventSchema = z.object({
  /** Model nào đổi trạng thái ('en-vi' | 'vi-en' | 'high') */
  direction: TranslateModelKeySchema,
  status: TranslateStatusSchema
})
export type TranslateStatusEvent = z.infer<typeof TranslateStatusEventSchema>

export const TranslateInputSchema = z.object({ text: z.string().min(1).max(TRANSLATE_MAX_CHARS) })

export const TranslateResultSchema = z.object({
  text: z.string(),
  /**
   * Engine đã dịch: 'opus-mt' (nhanh, chất lượng trung bình), 'nllb-200' (chất lượng cao, offline) hoặc 'claude' /
   * 'google' / 'azure' (online, key người dùng nhập)
   */
  engine: z.enum(['opus-mt', 'nllb-200', 'claude', 'google', 'azure']),
  cached: z.boolean(),
  /** Chiều đã dịch (tự nhận từ văn bản) */
  direction: TranslateDirectionSchema
})
export type TranslateResult = z.infer<typeof TranslateResultSchema>

/** Dịch online Google Cloud Translation / Azure Translator (key người dùng nhập) */
export const TranslateCloudProviderSchema = z.enum(['google', 'azure'])
export type TranslateCloudProvider = z.infer<typeof TranslateCloudProviderSchema>

/** Dịch online: Claude đã có key hay chưa, Google/Azure có dùng được không — renderer không bao giờ nhận lại key */
export const TranslateOnlineStatusSchema = z.object({
  hasKey: z.boolean(),
  /** Máy có mã hoá được key (Electron safeStorage) không; false → không lưu key */
  canStore: z.boolean(),
  /** Có key Google/Azure dùng được ngay (chưa bị từ chối/đang nghỉ); còn phụ thuộc cài đặt translate.cloud */
  cloud: z.boolean(),
  /** Đã lưu key của từng nhà cung cấp chưa */
  cloudKeys: z.object({ google: z.boolean(), azure: z.boolean() })
})
export type TranslateOnlineStatus = z.infer<typeof TranslateOnlineStatusSchema>

/** API key Anthropic do người dùng nhập (sk-ant-…) */
export const TranslateSetKeyInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(20)
    .max(300)
    .regex(/^sk-ant-[A-Za-z0-9_-]+$/)
})

/** Key Google (AIza…) hoặc Azure (32/84 ký tự) do người dùng nhập; Azure kèm vùng của resource (bỏ trống nếu global) */
export const TranslateSetCloudKeyInputSchema = z.object({
  provider: TranslateCloudProviderSchema,
  key: z
    .string()
    .trim()
    .min(20)
    .max(300)
    .regex(/^[A-Za-z0-9_-]+$/),
  region: z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-z0-9-]*$/)
    .optional()
})

export const TranslateClearCloudKeyInputSchema = z.object({
  provider: TranslateCloudProviderSchema
})
