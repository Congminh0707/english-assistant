import type { TranslateDirection } from '@shared/schemas/translate'

/** Engine dịch: nhận một đoạn văn bản, trả bản dịch theo chiều chỉ định. Bản thật chạy trong utilityProcess. */
export interface TranslationEngine {
  /** Dịch văn bản (đã được kiểm tra độ dài). Model của chiều đó được nạp ở lần gọi đầu tiên. */
  translate(text: string, direction: TranslateDirection): Promise<string>
  /** Giải phóng bộ nhớ (tắt tiến trình nền) */
  dispose(): void
}
