import type { TranslateDirection } from '@shared/schemas/translate'

/** Engine dịch offline (opus-mt): nhận một đoạn văn bản, trả bản dịch theo chiều chỉ định. Bản thật chạy trong utilityProcess. */
export interface TranslationEngine {
  /** Dịch văn bản (đã được kiểm tra độ dài). Model opus-mt của chiều đó được nạp ở lần gọi đầu tiên. */
  translate(text: string, direction: TranslateDirection): Promise<string>
  /** Nạp sẵn model + chạy thử một câu ngắn để lần dịch thật không phải chờ nạp (không bắt buộc) */
  warmup?(direction: TranslateDirection): Promise<void>
  /** Giải phóng bộ nhớ (tắt tiến trình nền) */
  dispose(): void
}
