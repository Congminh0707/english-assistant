import { z } from 'zod'

/** Trạng thái cập nhật tự động (electron-updater) */
export const UpdateStateSchema = z.enum([
  /** Bản dev/chưa đóng gói: không có cập nhật */
  'disabled',
  'idle',
  'checking',
  /** Đã kiểm tra, đang là bản mới nhất */
  'none',
  /** Có bản mới, chờ người dùng đồng ý tải */
  'available',
  'downloading',
  /** Đã tải xong, chờ khởi động lại để cài */
  'ready',
  'error'
])
export type UpdateState = z.infer<typeof UpdateStateSchema>

export const UpdateStatusSchema = z.object({
  state: UpdateStateSchema,
  currentVersion: z.string(),
  /** Phiên bản mới (khi available/downloading/ready) */
  version: z.string().nullable(),
  /** Tiến độ tải 0–100 */
  percent: z.number(),
  /** Dung lượng bản mới (byte) nếu biết */
  sizeBytes: z.number().nullable(),
  /** Khoá i18n của lỗi khi state = 'error' */
  errorKey: z.string().nullable(),
  /** Lần kiểm tra gần nhất (Unix ms) */
  checkedAt: z.number().nullable()
})
export type UpdateStatus = z.infer<typeof UpdateStatusSchema>
