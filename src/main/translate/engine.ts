import type { TranslateDirection } from '@shared/schemas/translate'

/** Engine dịch: nhận một đoạn văn bản, trả bản dịch theo chiều chỉ định. Bản thật chạy trong utilityProcess. */
export type TranslateQuality = 'fast' | 'high'

export interface TranslationEngine {
  /**
   * Dịch văn bản (đã được kiểm tra độ dài). Model được nạp ở lần gọi đầu tiên:
   * 'fast' = opus-mt của chiều đó, 'high' = mBART-50 (một model cho cả hai chiều).
   */
  translate(text: string, direction: TranslateDirection, quality: TranslateQuality): Promise<string>
  /** Giải phóng bộ nhớ (tắt tiến trình nền) */
  dispose(): void
}
