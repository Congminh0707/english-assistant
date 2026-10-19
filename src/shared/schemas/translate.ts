import { z } from 'zod'

/** Số ký tự tối đa một lần dịch (phím tắt dịch cả đoạn dài vẫn được cắt cho an toàn) */
export const TRANSLATE_MAX_CHARS = 600

/** Chiều dịch: Anh→Việt hoặc Việt→Anh (mỗi chiều một model riêng) */
export const TranslateDirectionSchema = z.enum(['en-vi', 'vi-en'])
export type TranslateDirection = z.infer<typeof TranslateDirectionSchema>

export const TranslateDirectionInputSchema = z.object({ direction: TranslateDirectionSchema })

export const TranslateStateSchema = z.enum(['not-installed', 'downloading', 'ready', 'error'])

/** Trạng thái một model offline (dịch opus-mt, giọng đọc Kokoro) */
export const TranslateStatusSchema = z.object({
  state: TranslateStateSchema,
  /** Dung lượng cần tải (byte) */
  sizeBytes: z.number().int(),
  /** Đang tải: số byte đã nhận */
  receivedBytes: z.number().int(),
  /** Mã lỗi khi state = 'error' (khoá i18n) */
  errorKey: z.string().nullable()
})
export type TranslateStatus = z.infer<typeof TranslateStatusSchema>

/** Sự kiện đổi trạng thái model dịch: kèm chiều dịch */
export const TranslateStatusEventSchema = z.object({
  direction: TranslateDirectionSchema,
  status: TranslateStatusSchema
})
export type TranslateStatusEvent = z.infer<typeof TranslateStatusEventSchema>

export const TranslateInputSchema = z.object({ text: z.string().min(1).max(TRANSLATE_MAX_CHARS) })

export const TranslateResultSchema = z.object({
  text: z.string(),
  /** Engine đã dịch: 'opus-mt' (máy dịch offline, chất lượng trung bình) */
  engine: z.literal('opus-mt'),
  cached: z.boolean(),
  /** Chiều đã dịch (tự nhận từ văn bản) */
  direction: TranslateDirectionSchema
})
export type TranslateResult = z.infer<typeof TranslateResultSchema>
