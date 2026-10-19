import { z } from 'zod'
import { TTS_MAX_CHARS } from '../tts'

export const TtsAccentSchema = z.enum(['us', 'uk'])

export const TtsSpeakInputSchema = z.object({
  text: z.string().trim().min(1).max(TTS_MAX_CHARS),
  accent: TtsAccentSchema,
  /** Tốc độ Kokoro (1 = bình thường) */
  speed: z.number().min(0.5).max(1.3)
})

export const TtsSpeakResultSchema = z.object({
  /** File WAV 16-bit mono 24 kHz */
  audio: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  /** Lấy từ bộ nhớ đệm trên đĩa (không phải tạo mới) */
  cached: z.boolean()
})
export type TtsSpeakResult = z.infer<typeof TtsSpeakResultSchema>

export const TtsPrefetchInputSchema = z.object({
  texts: z.array(z.string().trim().min(1).max(TTS_MAX_CHARS)).max(40),
  accent: TtsAccentSchema,
  speed: z.number().min(0.5).max(1.3)
})
