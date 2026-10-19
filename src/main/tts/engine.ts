/** Engine giọng đọc: nhận văn bản + giọng + tốc độ, trả file WAV. Bản thật chạy trong utilityProcess. */
export interface SpeechEngine {
  synthesize(text: string, voice: string, speed: number): Promise<Uint8Array>
  /** Giải phóng bộ nhớ (tắt tiến trình nền) */
  dispose(): void
}
