import { computed, onUnmounted, ref, type ComputedRef, type Ref } from 'vue'
import type { TranslateStatus } from '@shared/schemas/translate'
import { kokoroSpeed } from '@shared/tts'
import { invoke } from '../ipc'
import { useSettingsStore } from '../stores/settings'

export type Accent = 'us' | 'uk'

// Trạng thái model giọng tự nhiên: dùng chung trong cả cửa sổ (tải một lần, nghe sự kiện từ main)
const ttsStatus = ref<TranslateStatus | null>(null)
let statusStarted = false

function startStatus(): void {
  if (statusStarted) return
  statusStarted = true
  void invoke('tts:status')
    .then((s) => (ttsStatus.value = s))
    .catch(() => undefined)
  window.api.on('tts:status-changed', (s) => (ttsStatus.value = s))
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
  /** Tạo trước âm thanh ở nền cho nội dung sắp nghe (chỉ có tác dụng với giọng tự nhiên) */
  prefetch: (texts: string[], accent?: Accent, rate?: number) => void
  stop: () => void
  available: Ref<boolean>
  naturalVoice: ComputedRef<boolean>
} {
  startStatus()
  const settings = useSettingsStore()
  const available = ref(false)
  const naturalVoice = computed(
    () => settings.settings['tts.engine'] === 'kokoro' && ttsStatus.value?.state === 'ready'
  )

  let voices: SpeechSynthesisVoice[] = []
  let audio: HTMLAudioElement | null = null
  let audioUrl: string | null = null
  let requestSeq = 0

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
    if (!synth || !text.trim()) return
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(accent)
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? (accent === 'uk' ? 'en-GB' : 'en-US')
    utterance.rate = rate
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

  async function speakNatural(text: string, accent: Accent, rate: number): Promise<void> {
    const seq = ++requestSeq
    try {
      const { audio: bytes } = await invoke('tts:speak', {
        text,
        accent,
        speed: kokoroSpeed(rate)
      })
      if (seq !== requestSeq) return // đã có yêu cầu nghe mới hơn
      releaseAudio()
      audioUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'audio/wav' }))
      audio = new Audio(audioUrl)
      audio.addEventListener('ended', releaseAudio, { once: true })
      await audio.play()
    } catch (err) {
      console.warn('[tts] giọng tự nhiên lỗi, dùng giọng Windows', err)
      if (seq === requestSeq) speakSystem(text, accent, rate)
    }
  }

  function speak(text: string, accent: Accent = 'us', rate = 0.9): void {
    if (!text.trim()) return
    stop()
    if (naturalVoice.value) void speakNatural(text, accent, rate)
    else speakSystem(text, accent, rate)
  }

  function prefetch(texts: string[], accent: Accent = 'us', rate = 0.9): void {
    if (!naturalVoice.value || !texts.length) return
    void invoke('tts:prefetch', { texts, accent, speed: kokoroSpeed(rate) }).catch(() => undefined)
  }

  function stop(): void {
    requestSeq++
    window.speechSynthesis?.cancel()
    releaseAudio()
  }

  return { speak, prefetch, stop, available, naturalVoice }
}
