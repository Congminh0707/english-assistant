// Tiến trình nền (Electron utilityProcess) chạy model dịch opus-mt bằng transformers.js + onnxruntime-node.
// Tách riêng khỏi main để suy luận (~0,3–0,5 giây/câu, ~400 MB RAM) không làm đơ mascot.
// Giao thức (src/main/system/WorkerProcess.ts): main → worker {id, type:'init', payload:{modelsDir}} | {id, type:'translate', text, direction};
// worker → main {id, ok, result | error}.
import { ensureTerminalPunctuation, groupSentences, splitSentences } from '@shared/sentences'

type Request =
  | { id: number; type: 'init'; payload: { modelsDir: string } }
  | { id: number; type: 'translate'; text: string; direction: Direction; quality: 'fast' | 'high' }

type Direction = 'en-vi' | 'vi-en'

type Translator = (
  text: string,
  options: Record<string, unknown>
) => Promise<Array<{ translation_text: string }>>

type ModelKey = Direction | 'high'
const MODEL_IDS: Record<ModelKey, string> = {
  'en-vi': 'Xenova/opus-mt-en-vi',
  'vi-en': 'Xenova/opus-mt-vi-en',
  // mBART-50 many-to-many: một model cho cả hai chiều (mã ngôn ngữ en_XX / vi_VN)
  high: 'Xenova/mbart-large-50-many-to-many-mmt'
}
/** Nhóm câu đưa vào model chất lượng cao một lần (ký tự) */
const HIGH_GROUP_CHARS = 320
let modelsDir = ''
const translators: Partial<Record<ModelKey, Promise<Translator>>> = {}

function loadTranslator(direction: ModelKey): Promise<Translator> {
  const loading = (translators[direction] ??= (async (): Promise<Translator> => {
    const { pipeline, env } = await import('@huggingface/transformers')
    // Chỉ dùng model đã tải sẵn và đã xác minh — không bao giờ tự tải từ mạng trong tiến trình này
    env.allowRemoteModels = false
    env.allowLocalModels = true
    env.localModelPath =
      modelsDir.endsWith('/') || modelsDir.endsWith('\\') ? modelsDir : `${modelsDir}/`
    const translator = await pipeline('translation', MODEL_IDS[direction], {
      dtype: 'q8',
      session_options: { intraOpNumThreads: direction === 'high' ? 4 : 2 }
    })
    return translator as unknown as Translator
  })())
  loading.catch(() => {
    delete translators[direction] // cho phép thử nạp lại lần sau
  })
  return loading
}

/** Dịch bằng mBART-50: nhóm 2–3 câu một lần để giữ ngữ cảnh */
async function translateHigh(text: string, direction: Direction): Promise<string> {
  const translator = await loadTranslator('high')
  const [src, tgt] = direction === 'en-vi' ? ['en_XX', 'vi_VN'] : ['vi_VN', 'en_XX']
  const out: string[] = []
  for (const group of groupSentences(splitSentences(text), HIGH_GROUP_CHARS)) {
    const words = group.split(' ').length
    const result = await translator(ensureTerminalPunctuation(group), {
      src_lang: src,
      tgt_lang: tgt,
      max_new_tokens: Math.min(400, Math.max(48, words * 3 + 24)),
      no_repeat_ngram_size: 3,
      num_beams: 2
    })
    out.push(result[0]?.translation_text?.trim() ?? '')
  }
  return out.filter(Boolean).join(' ')
}

async function translate(
  text: string,
  direction: Direction,
  quality: 'fast' | 'high'
): Promise<string> {
  if (quality === 'high') return translateHigh(text, direction)
  const translator = await loadTranslator(direction)
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
      const result = await translate(msg.text, msg.direction, msg.quality ?? 'fast')
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
