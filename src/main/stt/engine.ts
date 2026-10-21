import type { PronunciationEvaluation, SttTranscribeResult } from '@shared/schemas/stt'

/** Engine nhận dạng âm vị: âm thanh + văn bản cần nói → âm vị mong đợi và âm vị nghe được (cùng bộ IPA espeak). */
export interface PhonemeEngine {
  evaluate(audio: Float32Array, text: string): Promise<PronunciationEvaluation>
  dispose(): void
}

/** Engine nhận dạng giọng nói: PCM float 16 kHz mono → chữ + mốc thời gian từng từ. Bản thật chạy trong utilityProcess. */
export interface SttEngine {
  transcribe(audio: Float32Array): Promise<SttTranscribeResult>
  /** Giải phóng bộ nhớ (tắt tiến trình nền) */
  dispose(): void
}
