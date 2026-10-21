import { computed, onUnmounted, ref, type ComputedRef, type Ref } from 'vue'
import type { TranslateStatus } from '@shared/schemas/translate'
import { clipForTts, kokoroSpeed } from '@shared/tts'
import { invoke } from '../ipc'
import { useSettingsStore } from '../stores/settings'

export type Accent = 'us' | 'uk'

// Trạng thái model giọng tự nhiên: dùng chung trong cả cửa sổ (tải một lần, nghe sự kiện từ main)
const ttsStatus = ref<TranslateStatus | null>(null)
let statusStarted = false
// Gói âm thanh bài nghe tạo sẵn (tải thêm): có gói thì câu trong gói phát ngay, không cần model giọng đọc
const audioPackStatus = ref<TranslateStatus | null>(null)
/** Đang chờ main tạo âm thanh (giọng tự nhiên, lần đầu có thể mất vài giây): hiện vòng xoay cho người dùng biết */
const ttsLoading = ref(false)

/** Dùng cho chỉ báo "đang tạo giọng đọc" (xem TtsIndicator) */
export function useTtsLoading(): Ref<boolean> {
  return ttsLoading
}

function startStatus(): void {
  if (statusStarted) return
  statusStarted = true
  void invoke('tts:status')
    .then((s) => (ttsStatus.value = s))
    .catch(() => undefined)
  window.api.on('tts:status-changed', (s) => (ttsStatus.value = s))
  void invoke('audio:status')
    .then((s) => (audioPackStatus.value = s))
    .catch(() => undefined)
  window.api.on('audio:status-changed', (s) => (audioPackStatus.value = s))
}

/** Trạng thái tải gói âm thanh bài nghe + tải/huỷ/gỡ (dùng trong Cài đặt và trang Nghe) */
export function useAudioPack(): {
  status: Ref<TranslateStatus | null>
  install: () => Promise<void>
  cancel: () => void
  remove: () => Promise<void>
} {
  startStatus()
  return {
    status: audioPackStatus,
    install: async () => {
      audioPackStatus.value = await invoke('audio:install')
    },
    cancel: () => void invoke('audio:cancel'),
    remove: async () => {
      audioPackStatus.value = await invoke('audio:remove')
    }
  }
}

/** Trạng thái tải model giọng tự nhiên + hành động tải/huỷ (dùng trong Cài đặt) */
export function useTtsModel(): {
  status: Ref<TranslateStatus | null>
  install: () => Promise<void>
  cancel: () => void
} {
  startStatus()
  return {
    status: ttsStatus,
    install: async () => {
      ttsStatus.value = await invoke('tts:install')
    },
    cancel: () => void invoke('tts:cancel')
  }
}

/**
 * Đọc to. Mặc định dùng giọng Windows (speechSynthesis — miễn phí, offline). Nếu người dùng chọn "giọng tự nhiên"
 * và đã tải model Kokoro thì phát file âm thanh do main tạo (có bộ nhớ đệm); lỗi/chưa sẵn sàng thì tự rơi về giọng Windows.
 * docs/11-ai-and-speech.md#3-đọc-to-tts
 */
export function useTts(): {
  speak: (text: string, accent?: Accent, rate?: number) => void
  /** Đọc và đợi đọc xong: true = đọc hết, false = bị ngắt (đọc câu khác / stop) — dùng cho trình nghe phát liên tục */
  speakAsync: (text: string, accent?: Accent, rate?: number) => Promise<boolean>
  /** Tạo trước âm thanh ở nền cho nội dung sắp nghe (chỉ có tác dụng với giọng tự nhiên) */
  prefetch: (texts: string[], accent?: Accent, rate?: number) => void
  stop: () => void
  available: Ref<boolean>
  naturalVoice: ComputedRef<boolean>
} {
  startStatus()
  const settings = useSettingsStore()
  const defaultAccent = (): Accent => settings.settings['tts.accent']
  const available = ref(false)
  const naturalVoice = computed(
    () => settings.settings['tts.engine'] === 'kokoro' && ttsStatus.value?.state === 'ready'
  )

  let voices: SpeechSynthesisVoice[] = []
  let audio: HTMLAudioElement | null = null
  let audioUrl: string | null = null
  let requestSeq = 0
  /** Kết thúc lần đọc đang chờ (speakAsync): gọi khi đọc xong hoặc bị ngắt */
  let settle: ((finished: boolean) => void) | null = null

  const loadVoices = (): void => {
    voices =
      window.speechSynthesis?.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')) ?? []
    available.value = voices.length > 0
  }
  loadVoices()
  window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
  onUnmounted(() => {
    window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
    stop()
  })

  function pickVoice(accent: Accent): SpeechSynthesisVoice | undefined {
    const lang = accent === 'uk' ? 'en-gb' : 'en-us'
    const matches = voices.filter((v) => v.lang.toLowerCase() === lang)
    // Ưu tiên giọng "Natural"/"Online" (tự nhiên hơn) nếu người dùng đã cài
    return matches.find((v) => /natural|online/i.test(v.name)) ?? matches[0] ?? voices[0]
  }

  function speakSystem(text: string, accent: Accent, rate: number): void {
    const synth = window.speechSynthesis
    if (!synth || !text.trim()) {
      settle?.(false)
      return
    }
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(accent)
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? (accent === 'uk' ? 'en-GB' : 'en-US')
    utterance.rate = rate
    const done = settle
    utterance.addEventListener('end', () => done?.(true))
    utterance.addEventListener('error', () => done?.(false))
    synth.speak(utterance)
  }

  function releaseAudio(): void {
    if (audio) {
      audio.pause()
      audio = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      audioUrl = null
    }
  }

  /** Phát một file âm thanh (WAV/MP3) từ main; kết thúc/lỗi báo cho `settle` */
  async function playBytes(bytes: Uint8Array, mime: string): Promise<void> {
    releaseAudio()
    audioUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }))
    audio = new Audio(audioUrl)
    const done = settle
    audio.addEventListener(
      'ended',
      () => {
        releaseAudio()
        done?.(true)
      },
      { once: true }
    )
    audio.addEventListener('error', () => done?.(false), { once: true })
    await audio.play()
  }

  /**
   * Thử phát câu có sẵn trong gói âm thanh: 'hit' đã phát, 'miss' gói không có câu này (cần dùng giọng thường),
   * 'stale' có yêu cầu nghe mới hơn nên bỏ qua.
   */
  async function tryPack(
    text: string,
    accent: Accent,
    rate: number
  ): Promise<'hit' | 'miss' | 'stale'> {
    const seq = ++requestSeq
    try {
      const clip = await invoke('audio:clip', { text: clipForTts(text), accent, rate })
      if (seq !== requestSeq) return 'stale'
      if (!clip) return 'miss'
      await playBytes(clip.audio, clip.mime)
      return 'hit'
    } catch {
      return seq === requestSeq ? 'miss' : 'stale'
    }
  }

  /** Nghe một câu: gói âm thanh (nếu đã tải và có câu này) → giọng tự nhiên → giọng Windows */
  function dispatch(text: string, accent: Accent, rate: number): void {
    const normal = (): void => {
      if (naturalVoice.value) void speakNatural(text, accent, rate)
      else speakSystem(text, accent, rate)
    }
    if (audioPackStatus.value?.state !== 'ready') return normal()
    void tryPack(text, accent, rate).then((result) => {
      if (result === 'miss') normal()
    })
  }

  async function speakNatural(text: string, accent: Accent, rate: number): Promise<void> {
    const seq = ++requestSeq
    ttsLoading.value = true
    try {
      const clipped = clipForTts(text)
      if (!clipped) throw new Error('empty text')
      const { audio: bytes } = await invoke('tts:speak', {
        text: clipped,
        accent,
        speed: kokoroSpeed(rate)
      })
      if (seq !== requestSeq) return // đã có yêu cầu nghe mới hơn
      ttsLoading.value = false
      await playBytes(bytes, 'audio/wav')
    } catch (err) {
      console.warn('[tts] giọng tự nhiên lỗi, dùng giọng Windows', err)
      if (seq === requestSeq) {
        ttsLoading.value = false
        speakSystem(text, accent, rate)
      }
    }
  }

  function speak(text: string, accent: Accent = defaultAccent(), rate = 0.9): void {
    if (!text.trim()) return
    stop()
    dispatch(text, accent, rate)
  }

  function speakAsync(
    text: string,
    accent: Accent = defaultAccent(),
    rate = 0.9
  ): Promise<boolean> {
    if (!text.trim()) return Promise.resolve(false)
    stop()
    return new Promise<boolean>((resolve) => {
      let called = false
      settle = (finished) => {
        if (called) return
        called = true
        if (settle === own) settle = null
        resolve(finished)
      }
      const own = settle
      dispatch(text, accent, rate)
    })
  }

  function prefetch(texts: string[], accent: Accent = defaultAccent(), rate = 0.9): void {
    if (!naturalVoice.value) return
    // Cắt cho vừa giới hạn, bỏ câu rỗng/trùng, tối đa 40 câu mỗi lần
    const list = [...new Set(texts.map(clipForTts).filter(Boolean))].slice(0, 40)
    if (!list.length) return
    void invoke('tts:prefetch', { texts: list, accent, speed: kokoroSpeed(rate) }).catch(
      () => undefined
    )
  }

  function stop(): void {
    requestSeq++
    ttsLoading.value = false
    const pending = settle
    settle = null
    window.speechSynthesis?.cancel()
    releaseAudio()
    pending?.(false)
  }

  return { speak, speakAsync, prefetch, stop, available, naturalVoice }
}
