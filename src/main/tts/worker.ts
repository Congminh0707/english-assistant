// Tiến trình nền (Electron utilityProcess) chạy giọng đọc Kokoro-82M bằng kokoro-js + transformers.js (onnxruntime-node).
// Giao thức (src/main/system/WorkerProcess.ts): main → worker {id, type:'init', payload:{modelsDir}} |
// {id, type:'speak', text, voice, speed}; worker → main {id, ok, result: WAV bytes | error}.
import { splitSentences } from '@shared/sentences'

type Request =
  | { id: number; type: 'init'; payload: { modelsDir: string } }
  | { id: number; type: 'speak'; text: string; voice: string; speed: number }

interface Tts {
  generate(
    text: string,
    options: { voice: string; speed: number }
  ): Promise<{ audio: Float32Array; sampling_rate: number }>
}

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
/** Khoảng lặng giữa các câu ghép lại (giây) */
const GAP_SECONDS = 0.18
let modelsDir = ''
let ttsPromise: Promise<Tts> | null = null

function loadTts(): Promise<Tts> {
  ttsPromise ??= (async (): Promise<Tts> => {
    const { env } = await import('@huggingface/transformers')
    // Chỉ dùng model đã tải sẵn và đã xác minh — không bao giờ tự tải từ mạng trong tiến trình này
    env.allowRemoteModels = false
    env.allowLocalModels = true
    env.localModelPath =
      modelsDir.endsWith('/') || modelsDir.endsWith('\\') ? modelsDir : `${modelsDir}/`
    const { KokoroTTS } = await import('kokoro-js')
    const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'cpu' })
    return tts as unknown as Tts
  })()
  ttsPromise.catch(() => {
    ttsPromise = null // cho phép thử nạp lại lần sau
  })
  return ttsPromise
}

/** Float32 mono → WAV 16-bit PCM */
function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const write = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Uint8Array(buffer)
}

async function speak(text: string, voice: string, speed: number): Promise<Uint8Array> {
  const tts = await loadTts()
  const parts: Float32Array[] = []
  let rate = 24000
  // Từng câu một (model có giới hạn độ dài; câu ngắn cũng tự nhiên hơn), nối bằng khoảng lặng ngắn
  for (const sentence of splitSentences(text)) {
    const out = await tts.generate(sentence, { voice, speed })
    rate = out.sampling_rate
    if (parts.length) parts.push(new Float32Array(Math.round(GAP_SECONDS * rate)))
    parts.push(out.audio)
  }
  const total = parts.reduce((n, p) => n + p.length, 0)
  const samples = new Float32Array(total)
  let offset = 0
  for (const p of parts) {
    samples.set(p, offset)
    offset += p.length
  }
  return encodeWav(samples, rate)
}

process.parentPort.on('message', async (event) => {
  const msg = event.data as Request
  try {
    if (msg.type === 'init') {
      modelsDir = msg.payload.modelsDir
      process.parentPort.postMessage({ id: msg.id, ok: true, result: '' })
    } else {
      const result = await speak(msg.text, msg.voice, msg.speed)
      process.parentPort.postMessage({ id: msg.id, ok: true, result })
    }
  } catch (err) {
    process.parentPort.postMessage({
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    })
  }
})
