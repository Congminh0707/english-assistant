// Tạo gói âm thanh tạo sẵn (MP3, giọng Kokoro) để người dùng tải thêm — không nhét vào bộ cài.
// Chạy: node scripts/audio/build-listening-audio.mjs [phiên bản=1.0.0] [--base <zip cũ>] [--list]
// Cần: model Kokoro đã tải trong %APPDATA%/english-assistant/models (bật "Giọng tự nhiên" trong app một lần),
//      devDependency @breezystack/lamejs (bộ mã hoá MP3, LGPL — chỉ dùng lúc build, không đóng vào app).
// Gói gồm mọi câu tĩnh (biết trước) mà app đọc to: bài nghe, bài học/ngữ pháp/bài đọc (ví dụ, lưới âm, đoạn đọc,
// bài tập), TOEIC Part 1–4, câu nghe của bài kiểm tra trình độ, sổ tay mẫu câu, chế độ trẻ em, câu thử giọng.
// Không gồm từ điển (lemma/ví dụ — quá lớn). Mỗi nguồn là một bộ gom riêng, phải tái hiện ĐÚNG văn bản + giọng + tốc độ
// mà chỗ gọi trong renderer dùng (khoá clip = packClipKey(giọng, tốc độ, clipForTts(văn bản))); chỗ gọi để giọng mặc định
// (theo cài đặt `tts.accent`) thì tạo cả hai giọng. `--list` chỉ đếm + in bảng theo nguồn, không tạo âm thanh.
// `--base <zip>`: dùng lại clip đã có trong gói cũ (cùng khoá), chỉ tạo phần còn thiếu — nhanh hơn nhiều khi chỉ thêm nội dung.
// Đầu ra: content/.build/audio/listening-audio-<ver>.zip (+ .sha256) → đưa lên GitHub Release (docs/15 §7).
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// Dùng chung quy ước khoá/giọng và cách dựng câu với app (Node 22.18+ chạy được file .ts thuần kiểu)
import {
  LISTENING_PACK_ID,
  PACK_RATES,
  PACK_VOICES,
  packClipKey,
  normalizePackText,
  realAudioText
} from '../../src/shared/audioPack.ts'
import { clipForTts } from '../../src/shared/tts.ts'
import { splitSentences } from '../../src/shared/sentences.ts'
import { TOEIC_TTS_RATE, toeicAudioLines } from '../../src/shared/toeicAudio.ts'

const listOnly = process.argv.includes('--list')
const version = process.argv.find((a, i) => i >= 2 && /^\d+\.\d+\.\d+$/.test(a)) ?? '1.0.0'
const MODELS = join(process.env.APPDATA ?? '', 'english-assistant', 'models')
const CURATED = resolve('content/curated')
const DIR = join(CURATED, 'listening')
const OUT_DIR = resolve('content/.build/audio')
/** Ước lượng dung lượng một clip (gói 1.5.0: 6074 clip, 145 311 352 byte ≈ 24 KB/clip) */
const EST_CLIP_BYTES = 24_000

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^\p{Cf}/u, ''))
const jsonFiles = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(dir, f))
    : []
/** zod `.trim()` của schema nội dung: mô phỏng trước khi ghép chuỗi */
const trim = (s) => (typeof s === 'string' ? s.trim() : '')

/** Chỗ gọi để giọng mặc định (`accent` undefined → cài đặt `tts.accent`): tạo cả hai giọng */
const BOTH = ['us', 'uk']

// --- Gom văn bản + giọng + tốc độ cần tạo, theo từng nguồn ---
const wanted = new Map() // key → { text, accent, rate }
const sources = [] // { name, texts, clips, added }
/** Một bộ gom có tên: `fn(add)` gọi `add(text, accent, rate)` cho từng câu app có thể đọc */
function collector(name, fn) {
  const texts = new Set()
  const keys = new Set()
  let added = 0
  const add = (text, accent, rate) => {
    // Renderer gửi `clipForTts(text)` (tối đa 400 ký tự) cho audio:clip; main chuẩn hoá bằng normalizePackText
    const clean = normalizePackText(clipForTts(text ?? ''))
    if (!clean) return
    texts.add(clean)
    const key = packClipKey(accent, rate, clean)
    keys.add(key)
    if (!wanted.has(key)) {
      wanted.set(key, { text: clean, accent, rate })
      added++
    }
  }
  fn(add)
  sources.push({ name, texts: texts.size, clips: keys.size, added })
}

// 1) Bài nghe (content/curated/listening) — giữ nguyên như các gói trước
collector('listening', (add) => {
  for (const file of jsonFiles(DIR)) {
    for (const lesson of readJson(file).lessons) {
      for (const block of lesson.blocks) {
        if (block.type !== 'audio' || block.recording) continue
        // Mọi câu đều tạo cả hai giọng bất kể người nói, để giọng mặc định nào cũng có (ListeningPlayer: 0,6 / 0,8 / 1)
        for (const line of block.lines)
          for (const accent of BOTH) for (const rate of [0.6, 0.8, 1]) add(line.en, accent, rate)
      }
      for (const ex of lesson.exercises ?? []) {
        if (ex.type === 'listen') for (const accent of BOTH) add(ex.say, accent, 0.9)
      }
    }
  }
})

// 2) Chế độ trẻ em: từ, chữ, câu bé nghe (chỉ giọng Mỹ; tốc độ theo useTts của giao diện bé: 0,7 âm / 0,8 học / 0,85 ô / 0,9 khen)
collector('kids', (add) => {
  const KIDS_RATES = [0.7, 0.8, 0.85, 0.9]
  const KIDS_PHRASES = [
    'Yes!',
    'Great!',
    'Well done!',
    'Super!',
    'Good job!',
    'Wow!',
    'Try again!',
    'Oops! Try again!',
    'Not quite!',
    'Yum!',
    'No thanks!',
    'Perfect!',
    'Great job!',
    'Good try!',
    "Let's play!",
    'ABC',
    'My stickers',
    'My pet',
    'Games',
    'Match!',
    'Pop!',
    'Feed me!',
    'Fishing!',
    'Spell it!',
    'A present!'
  ]
  const KIDS_TEXT_KEYS = new Set(['en', 'say', 'text', 'word', 'title'])
  const kidsTexts = new Set(KIDS_PHRASES)
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect)
    if (!node || typeof node !== 'object') return
    for (const [k, v] of Object.entries(node)) {
      // Chỉ lấy chuỗi tiếng Anh ngắn; bỏ chuỗi có dấu tiếng Việt
      if (KIDS_TEXT_KEYS.has(k) && typeof v === 'string') {
        // eslint-disable-next-line no-control-regex
        if (v.length <= 120 && !/[^\u0000-ɏ]|[ăâđêôơư]/i.test(v)) kidsTexts.add(v)
      } else collect(v)
    }
  }
  const KIDS_DIR = join(CURATED, 'kids')
  for (const f of jsonFiles(KIDS_DIR)) collect(readJson(f))
  for (const f of jsonFiles(join(KIDS_DIR, 'world', 'places'))) collect(readJson(f))
  // Từ của hình (PICTURE_WORDS): đọc thẳng nguồn vì pictures.ts import không đuôi file nên Node không nạp được
  for (const f of ['pictures.ts', 'picturesMore.ts', 'picturesKids2.ts', 'pictureExtras.ts']) {
    const src = readFileSync(resolve('src/shared', f), 'utf8')
    for (const m of src.matchAll(/\ben:\s*'([^']+)'/g)) kidsTexts.add(m[1])
  }
  for (const text of kidsTexts) for (const rate of KIDS_RATES) add(text, 'us', rate)
})

/**
 * Một bài theo schema bài học (shared/schemas/lesson.ts) — mọi chỗ đọc to trong LessonViewer / LessonExercises và các
 * thành phần con (ListeningPlayer, ReadingPassage, SpeakPractice, AudioPrompt). Mọi chỗ để giọng mặc định → cả hai giọng.
 */
function addLesson(add, lesson) {
  const both = (text, ...rates) => {
    for (const accent of BOTH) for (const rate of rates) add(text, accent, rate)
  }
  for (const block of lesson.blocks ?? []) {
    switch (block.type) {
      case 'examples': // LessonViewer: speak(ex.en, undefined, 0.9)
        for (const item of block.items) both(item.en, 0.9)
        break
      case 'sounds': // LessonViewer: bấm ô 0,8; SpeakPractice can-listen (luyện âm) 0,9 — cùng chuỗi `say ?? text`
        for (const item of block.items) both(item.say ?? item.text, 0.8, 0.9)
        break
      case 'audio': // ListeningPlayer: 0,6 / 0,8 / 1 (bản thu thật không dùng TTS)
        if (!block.recording) for (const line of block.lines) both(line.en, 0.6, 0.8, 1)
        break
      case 'passage': {
        // ReadingPassage: từng câu (splitSentences) 0,85 + "Nghe cả bài" (các đoạn nối bằng dấu cách) 0,85
        const paragraphs = block.paragraphs.map((p) => trim(p.en))
        for (const p of paragraphs) for (const s of splitSentences(p)) both(s, 0.85)
        both(paragraphs.join(' '), 0.85)
        break
      }
      // text / tip / table: không có nút nghe
    }
  }
  for (const ex of lesson.exercises ?? []) {
    switch (ex.type) {
      case 'listen': // tự đọc 0,9 + AudioPrompt 0,9 / 0,6
        both(ex.say, 0.9, 0.6)
        break
      case 'picture': // dạng nghe từ: tự đọc 0,9 + AudioPrompt 0,9 / 0,6
        if (ex.listen) both(ex.word, 0.9, 0.6)
        break
      case 'gap': // speaksSolution: đọc lời giải 0,9 = prompt thay "___" đầu tiên bằng đáp án đầu
        both(trim(ex.prompt).replace('___', trim(ex.answers[0])), 0.9)
        break
      case 'order': // speaksSolution: đọc câu đúng 0,9
        both(ex.answer, 0.9)
        break
      case 'speak': // SpeakPractice can-listen: "Nghe mẫu" 0,9
        both(ex.say, 0.9)
        break
      case 'respond': // AudioPrompt câu hỏi 0,9 / 0,6 + WritingFeedback nút nghe câu trả lời mẫu 0,9
        both(ex.question, 0.9, 0.6)
        if (ex.sample) both(ex.sample, 0.9)
        break
      // mcq / tf / match: không đọc to
    }
  }
}

// 3) Bài học, ngữ pháp, bài đọc (cùng schema bài học). Bài nghe đi lại qua đây để thêm các dạng bài tập/tốc độ còn thiếu
//    (khoá trùng được bỏ qua). content/curated/courses chỉ tham chiếu id bài nên không có chữ để đọc.
const LESSON_DIRS = ['lessons', 'grammar', 'readings', 'listening']
for (const dir of LESSON_DIRS) {
  collector(dir === 'listening' ? 'listening (blocks+exercises)' : dir, (add) => {
    for (const file of jsonFiles(join(CURATED, dir)))
      for (const lesson of readJson(file).lessons) addLesson(add, lesson)
  })
}

// 4) TOEIC Part 1–4 (ToeicPage.play → shared/toeicAudio.ts); Part 5–7 không có phần nghe
collector('toeic', (add) => {
  for (const file of jsonFiles(join(CURATED, 'toeic'))) {
    for (const group of readJson(file).groups) {
      if (group.part > 4) continue
      for (const l of toeicAudioLines(group)) add(l.text, l.accent, TOEIC_TTS_RATE)
    }
  }
})

// 5) Bài kiểm tra trình độ: câu nghe `say` (PlacementTest: tự đọc + nút 0,9 và nút chậm 0,6, giọng Mỹ).
//    Câu từ vựng lấy lemma từ từ điển lúc chạy nên không nằm ở đây.
collector('placement', (add) => {
  for (const file of jsonFiles(join(CURATED, 'placement')))
    for (const item of readJson(file).items)
      if (item.say) for (const rate of [0.9, 0.6]) add(item.say, 'us', rate)
})

// 6) Sổ tay mẫu câu (PhrasebookPage: speak(p.en) → giọng mặc định, 0,9)
collector('phrasebook', (add) => {
  for (const file of jsonFiles(join(CURATED, 'phrasebook')))
    for (const p of readJson(file).phrases) for (const accent of BOTH) add(p.en, accent, 0.9)
})

// 7) Câu thử giọng trong Cài đặt (speak(t('tts.testText'), 'us'|'uk') → 0,9), cả hai ngôn ngữ giao diện
collector('ui (tts.testText)', (add) => {
  for (const locale of ['en', 'vi']) {
    const text = readJson(resolve(`src/shared/i18n/${locale}.json`)).tts?.testText
    for (const accent of BOTH) add(text, accent, 0.9)
  }
})

// Bản thu thật (VOA, public domain): MP3 nguyên bản trong content/curated/listening-audio, đưa vào gói y nguyên
const REAL_DIR = join(CURATED, 'listening-audio')
const realRecordings = new Map() // id → đường dẫn file
for (const dir of LESSON_DIRS) {
  for (const file of jsonFiles(join(CURATED, dir)))
    for (const lesson of readJson(file).lessons)
      for (const block of lesson.blocks ?? [])
        if (block.type === 'audio' && block.recording)
          realRecordings.set(block.recording.id, join(REAL_DIR, `${block.recording.id}.mp3`))
}
let realBytes = 0
for (const [id, path] of realRecordings) {
  if (existsSync(path)) realBytes += statSync(path).size
  else console.warn(`Thiếu bản thu thật: ${id} (${path})`)
}

// --- Bảng thống kê theo nguồn ---
const mb = (bytes) => `${(bytes / 1_000_000).toFixed(1)} MB`
const total = wanted.size + realRecordings.size
const rows = [
  ['source', 'texts', 'clips', 'new clips', 'est. size (new)'],
  ...sources.map((s) => [s.name, s.texts, s.clips, s.added, mb(s.added * EST_CLIP_BYTES)]),
  [
    'real recordings (MP3)',
    realRecordings.size,
    realRecordings.size,
    realRecordings.size,
    mb(realBytes)
  ],
  ['TOTAL (unique keys)', '', total, total, mb(wanted.size * EST_CLIP_BYTES + realBytes)]
].map((r) => r.map(String))
const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => r[c].length)))
const fmt = (r) =>
  r.map((cell, c) => (c === 0 ? cell.padEnd(widths[c]) : cell.padStart(widths[c]))).join('  ')
const rule = widths.map((w) => '-'.repeat(w)).join('  ')
console.log(
  [fmt(rows[0]), rule, ...rows.slice(1, -1).map(fmt), rule, fmt(rows[rows.length - 1])].join('\n')
)
console.log(
  `clips = khoá riêng của nguồn; new clips = khoá chưa có ở nguồn đứng trước (cộng lại = tổng). ` +
    `Ước lượng ${EST_CLIP_BYTES / 1000} KB/clip TTS; bản thu thật tính dung lượng thật. Tốc độ quen dùng: ${PACK_RATES.join(', ')}`
)

if (listOnly) process.exit(0)

// Thư viện nặng chỉ nạp khi thật sự tạo âm thanh (`--list` không cần model)
const { env } = await import('@huggingface/transformers')
const { KokoroTTS } = await import('kokoro-js')
const { Mp3Encoder } = await import('@breezystack/lamejs')
const { unzipSync, zipSync } = await import('fflate')

env.allowRemoteModels = false
env.allowLocalModels = true
env.localModelPath = MODELS.replace(/\\/g, '/') + '/'
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
  dtype: 'q8',
  device: 'cpu'
})

/** Float32 24 kHz → MP3 mono 40 kbps */
function toMp3(samples, rate) {
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const enc = new Mp3Encoder(1, rate, 40)
  const parts = []
  for (let i = 0; i < pcm.length; i += 1152) {
    const buf = enc.encodeBuffer(pcm.subarray(i, i + 1152))
    if (buf.length) parts.push(Buffer.from(buf))
  }
  const tail = enc.flush()
  if (tail.length) parts.push(Buffer.from(tail))
  return Buffer.concat(parts)
}

const kokoroSpeed = (rate) => Math.round(Math.min(1.3, Math.max(0.5, rate / 0.9)) * 100) / 100
const files = {}
const clips = {}
// Dùng lại clip của gói cũ (`--base <zip>`): khoá = giọng + tốc độ + văn bản nên clip trùng khoá là cùng âm thanh
const baseArg = process.argv.indexOf('--base')
let reused = 0
if (baseArg > 0) {
  const base = unzipSync(new Uint8Array(readFileSync(resolve(process.argv[baseArg + 1]))))
  const baseManifest = JSON.parse(new TextDecoder().decode(base['manifest.json']))
  for (const key of wanted.keys()) {
    const name = baseManifest.clips[key]
    if (name && base[`clips/${name}`]) {
      files[`clips/${name}`] = [base[`clips/${name}`], { level: 0 }]
      clips[key] = name
      reused++
    }
  }
  console.log(`Dùng lại ${reused}/${wanted.size} clip từ gói cũ`)
}
let n = 0
const t0 = Date.now()
// Giọng Anh (bf_emma) tạo trước: nếu build bị ngắt thì phần dở dang vẫn là giọng Mỹ, không mất giọng mặc định
const queue = [...wanted]
  .filter(([key]) => !clips[key])
  .sort(([, a], [, b]) => Number(b.accent === 'uk') - Number(a.accent === 'uk'))
for (const [key, item] of queue) {
  const out = await tts.generate(item.text, {
    voice: PACK_VOICES[item.accent],
    speed: kokoroSpeed(item.rate)
  })
  const name = `${key}.mp3`
  files[`clips/${name}`] = [new Uint8Array(toMp3(out.audio, out.sampling_rate)), { level: 0 }]
  clips[key] = name
  if (++n % 25 === 0) console.log(`${n}/${queue.length} (${Math.round((Date.now() - t0) / 1000)}s)`)
}
for (const [id, path] of realRecordings) {
  const key = packClipKey('us', 1, realAudioText(id))
  const name = `${key}.mp3`
  files[`clips/${name}`] = [new Uint8Array(readFileSync(path)), { level: 0 }]
  clips[key] = name
}
files['manifest.json'] = [
  new TextEncoder().encode(JSON.stringify({ id: LISTENING_PACK_ID, version, clips })),
  { level: 6 }
]

mkdirSync(OUT_DIR, { recursive: true })
const zip = Buffer.from(zipSync(files))
const name = `${LISTENING_PACK_ID}-${version}.zip`
writeFileSync(join(OUT_DIR, name), zip)
const sha256 = createHash('sha256').update(zip).digest('hex')
writeFileSync(join(OUT_DIR, `${name}.sha256`), `${sha256}  ${name}\n`)
console.log(`Xong: ${name} — ${zip.length} byte, sha256 ${sha256}`)
