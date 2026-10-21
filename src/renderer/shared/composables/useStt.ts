import type { Ref } from 'vue'
import { ref } from 'vue'
import type {
  PronunciationEvaluation,
  PronunciationStatus,
  SttTranscribeResult
} from '@shared/schemas/stt'
import type { TranslateStatus } from '@shared/schemas/translate'
import { invoke } from '../ipc'

// Trạng thái model nhận dạng giọng nói (Whisper) và model phát âm tuỳ chọn: dùng chung trong cả cửa sổ
const sttStatus = ref<TranslateStatus | null>(null)
const pronStatus = ref<PronunciationStatus | null>(null)
let started = false

function startStatus(): void {
  if (started) return
  started = true
  void invoke('stt:status')
    .then((s) => (sttStatus.value = s))
    .catch(() => undefined)
  void invoke('pron:status')
    .then((s) => (pronStatus.value = s))
    .catch(() => undefined)
  window.api.on('stt:status-changed', (s) => (sttStatus.value = s))
  window.api.on('pron:status-changed', (s) => (pronStatus.value = s))
}

/** Trạng thái tải model nhận dạng + hành động tải/huỷ + nhận dạng một đoạn âm thanh */
export function useStt(): {
  status: Ref<TranslateStatus | null>
  pronunciation: Ref<PronunciationStatus | null>
  install: () => Promise<void>
  cancel: () => void
  installPronunciation: () => Promise<void>
  cancelPronunciation: () => void
  transcribe: (audio: Float32Array) => Promise<SttTranscribeResult>
  /** Chấm phát âm theo âm vị: âm mong đợi của `text` và âm nghe được (cần model wav2vec2 đã tải) */
  evaluatePronunciation: (audio: Float32Array, text: string) => Promise<PronunciationEvaluation>
} {
  startStatus()
  return {
    status: sttStatus,
    pronunciation: pronStatus,
    install: async () => {
      sttStatus.value = await invoke('stt:install')
    },
    cancel: () => void invoke('stt:cancel'),
    installPronunciation: async () => {
      pronStatus.value = await invoke('pron:install')
    },
    cancelPronunciation: () => void invoke('pron:cancel'),
    transcribe: (audio) => invoke('stt:transcribe', { audio }),
    evaluatePronunciation: (audio, text) => invoke('pron:evaluate', { audio, text })
  }
}
