import { onUnmounted, ref, type Ref } from 'vue'

export type Accent = 'us' | 'uk'

/**
 * Đọc to bằng giọng có sẵn của Windows (speechSynthesis) — miễn phí, offline (docs/11-ai-and-speech.md#3).
 * Người dùng có thể cài thêm giọng tiếng Anh trong Windows Settings → Time & language → Speech.
 */
export function useTts(): {
  speak: (text: string, accent?: Accent, rate?: number) => void
  stop: () => void
  available: Ref<boolean>
} {
  const available = ref(false)
  let voices: SpeechSynthesisVoice[] = []

  const loadVoices = (): void => {
    voices =
      window.speechSynthesis?.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')) ?? []
    available.value = voices.length > 0
  }
  loadVoices()
  window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
  onUnmounted(() => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices))

  function pickVoice(accent: Accent): SpeechSynthesisVoice | undefined {
    const lang = accent === 'uk' ? 'en-gb' : 'en-us'
    const matches = voices.filter((v) => v.lang.toLowerCase() === lang)
    // Ưu tiên giọng "Natural"/"Online" (tự nhiên hơn) nếu người dùng đã cài
    return matches.find((v) => /natural|online/i.test(v.name)) ?? matches[0] ?? voices[0]
  }

  function speak(text: string, accent: Accent = 'us', rate = 0.9): void {
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

  const stop = (): void => window.speechSynthesis?.cancel()

  return { speak, stop, available }
}
