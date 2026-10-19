/** Engine dịch: nhận một đoạn tiếng Anh, trả bản dịch tiếng Việt. Bản thật chạy trong utilityProcess. */
export interface TranslationEngine {
  /** Dịch văn bản (đã được kiểm tra độ dài). Model được nạp ở lần gọi đầu tiên. */
  translate(text: string): Promise<string>
  /** Giải phóng bộ nhớ (tắt tiến trình nền) */
  dispose(): void
}
