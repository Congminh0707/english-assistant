// Tiến trình nền (Electron utilityProcess) chạy model dịch opus-mt bằng transformers.js + onnxruntime-node.
// Tách riêng khỏi main để suy luận (~0,3–0,5 giây/câu, ~400 MB RAM) không làm đơ mascot.
// Giao thức (src/main/system/WorkerProcess.ts): main → worker {id, type:'init', payload:{modelsDir}} | {id, type:'translate', text};
// worker → main {id, ok, result | error}.
import { ensureTerminalPunctuation, splitSentences } from '@shared/sentences'

type Request =
  | { id: number; type: 'init'; payload: { modelsDir: string } }
  | { id: number; type: 'translate'; text: string }

type Translator = (
  text: string,
  options: Record<string, unknown>
) => Promise<Array<{ translation_text: string }>>

const MODEL_ID = 'Xenova/opus-mt-en-vi'
let modelsDir = ''
let translatorPromise: Promise<Translator> | null = null

function loadTranslator(): Promise<Translator> {
  translatorPromise ??= (async (): Promise<Translator> => {
    const { pipeline, env } = await import('@huggingface/transformers')
    // Chỉ dùng model đã tải sẵn và đã xác minh — không bao giờ tự tải từ mạng trong tiến trình này
    env.allowRemoteModels = false
    env.allowLocalModels = true
    env.localModelPath =
      modelsDir.endsWith('/') || modelsDir.endsWith('\\') ? modelsDir : `${modelsDir}/`
    const translator = await pipeline('translation', MODEL_ID, {
      dtype: 'q8',
      session_options: { intraOpNumThreads: 2 }
    })
    return translator as unknown as Translator
  })()
  translatorPromise.catch(() => {
    translatorPromise = null // cho phép thử nạp lại lần sau
  })
  return translatorPromise
}

async function translate(text: string): Promise<string> {
  const translator = await loadTranslator()
  const out: string[] = []
  // Dịch từng câu: đưa cả đoạn vào thì model thường chỉ dịch câu đầu
  for (const sentence of splitSentences(text)) {
    const input = ensureTerminalPunctuation(sentence)
    // Đầu ra tối đa ~3 token/từ + 16: chặn model lặp vô hạn nếu vẫn lỡ không dừng được
    const words = input.split(' ').length
    const result = await translator(input, {
      max_new_tokens: Math.min(200, Math.max(24, words * 3 + 16)),
      no_repeat_ngram_size: 3
    })
    out.push(result[0]?.translation_text?.trim() ?? '')
  }
  return out.filter(Boolean).join(' ')
}

process.parentPort.on('message', async (event) => {
  const msg = event.data as Request
  try {
    if (msg.type === 'init') {
      modelsDir = msg.payload.modelsDir
      process.parentPort.postMessage({ id: msg.id, ok: true, result: '' })
    } else {
      const result = await translate(msg.text)
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
