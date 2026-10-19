import { TTS_MAX_CHARS, type TtsAccent } from '@shared/tts'
import type { TranslateStatus } from '@shared/schemas/translate'
import type { TtsSpeakResult } from '@shared/schemas/tts'
import { AppError } from '../core/AppError'
import type { ModelManager } from '../translate/ModelManager'
import type { SpeechEngine } from '../tts/engine'
import { TtsCache } from '../tts/TtsCache'
import { ModelInstaller } from './ModelInstaller'

/**
 * Giọng đọc tự nhiên offline (Kokoro-82M): trạng thái/tải model (qua ModelInstaller), tạo file WAV theo giọng +
 * tốc độ, nhớ kết quả trên đĩa (nghe lại tức thì), tạo trước (prefetch) nền cho nội dung sắp dùng.
 * Không bao giờ ghi nội dung đọc ra log. docs/11-ai-and-speech.md#3-đọc-to-tts
 */
export class TtsService {
  private readonly installer: ModelInstaller
  private readonly inFlight = new Map<string, Promise<TtsSpeakResult>>()
  private prefetchQueue: Array<{ text: string; accent: TtsAccent; speed: number }> = []
  private prefetching = false
  /** Số yêu cầu nghe của người dùng đang chạy: prefetch nhường chỗ cho các yêu cầu này */
  private active = 0

  constructor(
    private readonly deps: {
      models: ModelManager
      engine: SpeechEngine
      cache: TtsCache
      /** Giọng người dùng đã chọn cho từng giọng Mỹ/Anh */
      voices: () => { us: string; uk: string }
      onStatus?: (status: TranslateStatus) => void
      now?: () => number
    }
  ) {
    this.installer = new ModelInstaller({
      models: deps.models,
      onStatus: deps.onStatus,
      now: deps.now
    })
  }

  status(): TranslateStatus {
    return this.installer.status()
  }

  install(): Promise<TranslateStatus> {
    return this.installer.install()
  }

  cancelInstall(): void {
    this.installer.cancel()
  }

  async speak(input: { text: string; accent: TtsAccent; speed: number }): Promise<TtsSpeakResult> {
    this.active++
    try {
      return await this.synthesize(input)
    } finally {
      this.active--
    }
  }

  /** Tạo trước âm thanh ở nền (thay thế danh sách chờ cũ); nhường chỗ khi người dùng bấm nghe */
  prefetch(texts: string[], accent: TtsAccent, speed: number): void {
    if (!this.installer.installed) return
    this.prefetchQueue = [...new Set(texts)].map((text) => ({ text, accent, speed }))
    if (!this.prefetching) void this.runPrefetch()
  }

  /** Số file đã lưu trong bộ nhớ đệm */
  get cachedCount(): number {
    return this.deps.cache.size
  }

  clearCache(): void {
    this.deps.cache.clear()
  }

  dispose(): void {
    this.prefetchQueue = []
    this.cancelInstall()
    this.deps.engine.dispose()
  }

  private synthesize(input: {
    text: string
    accent: TtsAccent
    speed: number
  }): Promise<TtsSpeakResult> {
    const text = input.text.replace(/\s+/g, ' ').trim().slice(0, TTS_MAX_CHARS)
    if (!text) throw new AppError('VALIDATION', 'errors.validation')
    if (!this.installer.installed) throw new AppError('TTS_NOT_READY', 'errors.ttsNotReady')

    const voice = input.accent === 'uk' ? this.deps.voices().uk : this.deps.voices().us
    const cacheKey = TtsCache.key(voice, input.speed, text)

    const cached = this.deps.cache.get(cacheKey)
    if (cached) return Promise.resolve({ audio: cached, cached: true })

    // Cùng một yêu cầu đang chạy (bấm nghe liên tục) → dùng chung kết quả
    const running = this.inFlight.get(cacheKey)
    if (running) return running
    const promise = (async (): Promise<TtsSpeakResult> => {
      const audio = await this.deps.engine.synthesize(text, voice, input.speed)
      if (!audio.length) throw new AppError('TTS_FAILED', 'errors.ttsFailed')
      this.deps.cache.set(cacheKey, audio)
      return { audio, cached: false }
    })().finally(() => this.inFlight.delete(cacheKey))
    this.inFlight.set(cacheKey, promise)
    return promise
  }

  private async runPrefetch(): Promise<void> {
    this.prefetching = true
    try {
      for (let item = this.prefetchQueue.shift(); item; item = this.prefetchQueue.shift()) {
        // Người dùng đang bấm nghe → đợi xong rồi mới làm tiếp
        while (this.active > 0) await new Promise((r) => setTimeout(r, 300))
        try {
          await this.synthesize(item)
        } catch (err) {
          if (err instanceof AppError && err.code === 'TTS_NOT_READY') break
          // Lỗi từng câu: bỏ qua, làm câu kế tiếp
        }
      }
    } finally {
      this.prefetching = false
    }
  }
}
