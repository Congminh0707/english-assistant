// Tiến trình nền (Electron utilityProcess) chạy Whisper base.en bằng transformers.js (onnxruntime-node).
// Giao thức (src/main/system/WorkerProcess.ts): main → worker {id, type:'init', payload:{modelsDir}} |
// {id, type:'transcribe', audio: Float32Array 16 kHz mono}; worker → main {id, ok, result:{text, words} | error}.
// Không bao giờ ghi âm thanh hay lời nhận dạng ra log (AGENTS.md).

export {} // đánh dấu là module (tránh trùng tên `Request` toàn cục của DOM)

type Request =
  | { id: number; type: 'init'; payload: { modelsDir: string } }
  | { id: number; type: 'transcribe'; audio: Float32Array }

interface Chunk {
  text: string
  timestamp: [number, number | null]
}
type Recognizer = (
  audio: Float32Array,
  options: { return_timestamps: 'word'; chunk_length_s: number }
) => Promise<{ text: string; chunks?: Chunk[] }>

const MODEL_ID = 'Xenova/whisper-base.en'
let modelsDir = ''
let recognizerPromise: Promise<Recognizer> | null = null

function loadRecognizer(): Promise<Recognizer> {
  recognizerPromise ??= (async (): Promise<Recognizer> => {
    const { env, pipeline } = await import('@huggingface/transformers')
    // Chỉ dùng model đã tải sẵn và đã xác minh — không bao giờ tự tải từ mạng trong tiến trình này
    env.allowRemoteModels = false
    env.allowLocalModels = true
    env.localModelPath =
      modelsDir.endsWith('/') || modelsDir.endsWith('\\') ? modelsDir : `${modelsDir}/`
    const asr = await pipeline('automatic-speech-recognition', MODEL_ID, {
      dtype: 'q8',
      device: 'cpu'
    })
    return asr as unknown as Recognizer
  })()
  recognizerPromise.catch(() => {
    recognizerPromise = null // cho phép thử nạp lại lần sau
  })
  return recognizerPromise
}

async function transcribe(
  audio: Float32Array
): Promise<{ text: string; words: Array<{ word: string; start: number; end: number }> }> {
  const asr = await loadRecognizer()
  const out = await asr(audio, { return_timestamps: 'word', chunk_length_s: 30 })
  const words = (out.chunks ?? []).map((c) => ({
    word: c.text.trim(),
    start: c.timestamp[0],
    end: c.timestamp[1] ?? c.timestamp[0]
  }))
  return { text: out.text.trim(), words: words.filter((w) => w.word) }
}

process.parentPort.on('message', async (event) => {
  const msg = event.data as Request
  try {
    if (msg.type === 'init') {
      modelsDir = msg.payload.modelsDir
      process.parentPort.postMessage({ id: msg.id, ok: true, result: '' })
    } else {
      const result = await transcribe(new Float32Array(msg.audio))
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
