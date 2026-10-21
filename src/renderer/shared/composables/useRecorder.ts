import { onUnmounted, ref, type Ref } from 'vue'
import { resampleTo16k, STT_MAX_SECONDS, STT_MAX_SAMPLES } from '@shared/speech'

export type RecorderState = 'idle' | 'recording'
export type RecorderError = 'denied' | 'no-mic' | 'failed'

/** Âm lượng (RMS) dưới mức này ở đầu/cuối được cắt bỏ */
const SILENCE_RMS = 0.01
const FRAME = 800 // 50 ms ở 16 kHz

/** Cắt khoảng lặng đầu/cuối (chừa 0,15 giây) để Whisper không "nghe" ra chữ từ tiếng ồn nền */
export function trimSilence(samples: Float32Array): Float32Array {
  const rms = (from: number): number => {
    let sum = 0
    const end = Math.min(samples.length, from + FRAME)
    for (let i = from; i < end; i++) sum += samples[i] * samples[i]
    return Math.sqrt(sum / Math.max(1, end - from))
  }
  let start = 0
  while (start < samples.length && rms(start) < SILENCE_RMS) start += FRAME
  let end = samples.length
  while (end > start && rms(Math.max(0, end - FRAME)) < SILENCE_RMS) end -= FRAME
  const pad = 2400
  return samples.slice(Math.max(0, start - pad), Math.min(samples.length, end + pad))
}

/**
 * Ghi âm từ micro: PCM float mono, hạ mẫu về 16 kHz, tự dừng sau 30 giây. Chỉ giữ trong bộ nhớ (không lưu file,
 * không log). Xin quyền micro một lần; lỗi trả về mã `RecorderError` để giao diện hiện thông báo.
 */
export function useRecorder(
  opts: {
    /** Gọi khi chạm giới hạn thời lượng: component nên gọi stop() để lấy âm thanh */
    onLimit?: () => void
  } = {}
): {
  state: Ref<RecorderState>
  /** Âm lượng hiện tại 0–1 (cho thanh mức) */
  level: Ref<number>
  seconds: Ref<number>
  error: Ref<RecorderError | null>
  start: () => Promise<boolean>
  /** Dừng và lấy âm thanh 16 kHz (đã cắt lặng); null nếu chưa ghi */
  stop: () => Promise<Float32Array | null>
  cancel: () => void
} {
  const state = ref<RecorderState>('idle')
  const level = ref(0)
  const seconds = ref(0)
  const error = ref<RecorderError | null>(null)

  let stream: MediaStream | null = null
  let ctx: AudioContext | null = null
  let node: ScriptProcessorNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let chunks: Float32Array[] = []
  let total = 0
  let limitHit = false

  function release(): void {
    node?.disconnect()
    source?.disconnect()
    stream?.getTracks().forEach((t) => t.stop())
    void ctx?.close().catch(() => undefined)
    node = source = null
    stream = null
    ctx = null
    level.value = 0
    state.value = 'idle'
  }

  async function start(): Promise<boolean> {
    if (state.value === 'recording') return true
    error.value = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
      })
    } catch (err) {
      const name = (err as DOMException).name
      error.value = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'no-mic'
      return false
    }
    try {
      ctx = new AudioContext()
      source = ctx.createMediaStreamSource(stream)
      node = ctx.createScriptProcessor(4096, 1, 1)
      chunks = []
      total = 0
      limitHit = false
      seconds.value = 0
      const rate = ctx.sampleRate
      node.onaudioprocess = (e): void => {
        const data = e.inputBuffer.getChannelData(0)
        chunks.push(new Float32Array(data))
        total += data.length
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
        level.value = Math.min(1, Math.sqrt(sum / data.length) * 6)
        seconds.value = Math.round((total / rate) * 10) / 10
        if (total / rate >= STT_MAX_SECONDS && !limitHit) {
          limitHit = true
          opts.onLimit?.()
        }
      }
      source.connect(node)
      node.connect(ctx.destination) // cần nối đích để onaudioprocess chạy (đầu ra im lặng)
      state.value = 'recording'
      return true
    } catch {
      error.value = 'failed'
      release()
      return false
    }
  }

  async function stop(): Promise<Float32Array | null> {
    if (state.value !== 'recording' || !ctx) return null
    const rate = ctx.sampleRate
    const all = new Float32Array(total)
    let offset = 0
    for (const c of chunks) {
      all.set(c, offset)
      offset += c.length
    }
    chunks = []
    release()
    const pcm = trimSilence(resampleTo16k(all, rate))
    return pcm.length > STT_MAX_SAMPLES ? pcm.slice(0, STT_MAX_SAMPLES) : pcm
  }

  function cancel(): void {
    chunks = []
    release()
  }

  onUnmounted(cancel)
  return { state, level, seconds, error, start, stop, cancel }
}
