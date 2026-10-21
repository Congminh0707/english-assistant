// Tiến trình nền (Electron utilityProcess) nhận dạng âm vị bằng wav2vec2 (ONNX int8) + onnxruntime-node, và tạo chuỗi
// âm vị mong đợi cho văn bản bằng phonemizer (espeak) — cùng bộ ký hiệu IPA của model.
// Giao thức (src/main/system/WorkerProcess.ts): main → worker {id, type:'init', payload:{modelsDir}} |
// {id, type:'evaluate', audio: Float32Array 16 kHz mono, text}; worker → main {id, ok, result:{expected, heard} | error}.
// Không bao giờ ghi âm thanh hay văn bản ra log (AGENTS.md).
import { tokenizeIpa } from '@shared/phonemes'
import vocab from './wav2vec2-vocab.json'

export {} // đánh dấu là module (tránh trùng tên `Request` toàn cục của DOM)

type Request =
  | { id: number; type: 'init'; payload: { modelsDir: string } }
  | { id: number; type: 'evaluate'; audio: Float32Array; text: string }

interface Session {
  run(
    feeds: Record<string, unknown>
  ): Promise<Record<string, { data: Float32Array; dims: number[] }>>
}

const MODEL_FILE = ['duyentq', 'sonari-wav2vec2-phoneme-int8', 'wav2vec2_int8.onnx']
const SPECIAL = new Set(['<pad>', '<s>', '</s>', '<unk>', '|'])
const ID_TO_TOKEN: Record<number, string> = {}
for (const [token, id] of Object.entries(vocab as Record<string, number>)) ID_TO_TOKEN[id] = token
const PHONEME_TOKENS = Object.keys(vocab).filter((t) => !SPECIAL.has(t))
const PAD_ID = (vocab as Record<string, number>)['<pad>']

type Ort = typeof import('onnxruntime-node')
let modelsDir = ''
let ortModule: Ort | null = null
let sessionPromise: Promise<Session> | null = null

function loadSession(): Promise<Session> {
  sessionPromise ??= (async (): Promise<Session> => {
    const { join } = await import('node:path')
    ortModule = await import('onnxruntime-node')
    const session = await ortModule.InferenceSession.create(join(modelsDir, ...MODEL_FILE), {
      executionProviders: ['cpu']
    })
    return session as unknown as Session
  })()
  sessionPromise.catch(() => {
    sessionPromise = null // cho phép thử nạp lại lần sau
  })
  return sessionPromise
}

/** Chuẩn hoá theo từng đoạn (trung bình 0, phương sai 1) như Wav2Vec2FeatureExtractor */
function normalize(audio: Float32Array): Float32Array {
  let mean = 0
  for (const v of audio) mean += v
  mean /= audio.length || 1
  let variance = 0
  for (const v of audio) variance += (v - mean) ** 2
  variance /= audio.length || 1
  const scale = 1 / Math.sqrt(variance + 1e-7)
  return Float32Array.from(audio, (v) => (v - mean) * scale)
}

async function recognise(audio: Float32Array): Promise<string[]> {
  const session = await loadSession()
  const input = normalize(audio)
  const out = await session.run({
    input_values: new ortModule!.Tensor('float32', input, [1, input.length])
  })
  const { data, dims } = out.logits
  const frames = dims[1]
  const size = dims[2]
  const tokens: string[] = []
  let previous = -1
  // Giải mã tham lam CTC: lấy âm mạnh nhất mỗi khung, gộp lặp, bỏ khoảng trống (pad)
  for (let t = 0; t < frames; t++) {
    let best = 0
    let bestValue = -Infinity
    for (let k = 0; k < size; k++) {
      const v = data[t * size + k]
      if (v > bestValue) {
        bestValue = v
        best = k
      }
    }
    if (best !== previous && best !== PAD_ID) {
      const token = ID_TO_TOKEN[best]
      if (token && !SPECIAL.has(token)) tokens.push(token)
    }
    previous = best
  }
  return tokens
}

async function evaluate(
  audio: Float32Array,
  text: string
): Promise<{ expected: string[]; heard: string[] }> {
  const { phonemize } = await import('phonemizer')
  const ipa = (await phonemize(text, 'en-us')).join(' ')
  return { expected: tokenizeIpa(ipa, PHONEME_TOKENS), heard: await recognise(audio) }
}

process.parentPort.on('message', async (event) => {
  const msg = event.data as Request
  try {
    if (msg.type === 'init') {
      modelsDir = msg.payload.modelsDir
      process.parentPort.postMessage({ id: msg.id, ok: true, result: '' })
    } else {
      const result = await evaluate(new Float32Array(msg.audio), msg.text)
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
