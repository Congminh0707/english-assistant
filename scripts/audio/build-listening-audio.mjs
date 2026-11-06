// Tạo gói âm thanh bài nghe (MP3, giọng Kokoro) để người dùng tải thêm — không nhét vào bộ cài.
// Chạy: node scripts/audio/build-listening-audio.mjs [phiên bản=1.0.0]
// Cần: model Kokoro đã tải trong %APPDATA%/english-assistant/models (bật "Giọng tự nhiên" trong app một lần),
//      devDependency @breezystack/lamejs (bộ mã hoá MP3, LGPL — chỉ dùng lúc build, không đóng vào app).
// Gói gồm cả bài nghe lẫn từ/câu của chế độ trẻ em (giọng Mỹ, các tốc độ bé nghe). `--list` chỉ đếm, không tạo âm thanh.
// `--base <zip>`: dùng lại clip đã có trong gói cũ (cùng khoá), chỉ tạo phần còn thiếu — nhanh hơn nhiều khi chỉ thêm nội dung.
// Đầu ra: content/.build/audio/listening-audio-<ver>.zip (+ .sha256) → đưa lên GitHub Release (docs/15 §7).
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { env } from '@huggingface/transformers'
import { KokoroTTS } from 'kokoro-js'
import { Mp3Encoder } from '@breezystack/lamejs'
import { unzipSync, zipSync } from 'fflate'

// Dùng chung quy ước khoá/giọng với app (Node 22.18+ chạy được file .ts thuần kiểu)
import {
  LISTENING_PACK_ID,
  PACK_RATES,
  PACK_VOICES,
  packClipKey,
  normalizePackText,
  realAudioText
} from '../../src/shared/audioPack.ts'

const listOnly = process.argv.includes('--list')
const version = process.argv.find((a, i) => i >= 2 && /^\d+\.\d+\.\d+$/.test(a)) ?? '1.0.0'
const MODELS = join(process.env.APPDATA ?? '', 'english-assistant', 'models')
const DIR = resolve('content/curated/listening')
const OUT_DIR = resolve('content/.build/audio')

// Gom văn bản + giọng + tốc độ cần tạo
const wanted = new Map() // key → { text, accent, rate }
const add = (text, accent, rate) => {
  const clean = normalizePackText(text)
  if (!clean) return
  const key = packClipKey(accent, rate, clean)
  if (!wanted.has(key)) wanted.set(key, { text: clean, accent, rate })
}
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(join(DIR, file), 'utf8').replace(/^\p{Cf}/u, ''))
  for (const lesson of data.lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== 'audio' || block.recording) continue
      for (const line of block.lines) {
        // Mọi câu đều tạo cả hai giọng (bf_emma Anh + af_heart Mỹ) bất kể người nói, để giọng Anh mặc định luôn có
        for (const accent of ['uk', 'us']) for (const rate of [0.6, 0.8, 1]) add(line.en, accent, rate)
      }
    }
    for (const ex of lesson.exercises) {
      if (ex.type === 'listen') for (const accent of ['uk', 'us']) add(ex.say, accent, 0.9)
    }
  }
}
// --- Chế độ trẻ em: từ, chữ, câu bé nghe (chỉ giọng Mỹ; tốc độ theo useTts của giao diện bé: 0,7 âm / 0,8 học / 0,85 ô / 0,9 khen) ---
const KIDS_RATES = [0.7, 0.8, 0.85, 0.9]
const KIDS_PHRASES = [
  'Yes!', 'Great!', 'Well done!', 'Super!', 'Good job!', 'Wow!', 'Try again!', 'Oops! Try again!',
  'Not quite!', 'Yum!', 'No thanks!', 'Perfect!', 'Great job!', 'Good try!', "Let's play!", 'ABC',
  'My stickers', 'My pet', 'Games', 'Match!', 'Pop!', 'Feed me!', 'Fishing!', 'Spell it!', 'A present!'
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
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^\p{Cf}/u, ''))
const KIDS_DIR = resolve('content/curated/kids')
for (const f of readdirSync(KIDS_DIR).filter((f) => f.endsWith('.json'))) collect(readJson(join(KIDS_DIR, f)))
const PLACES = join(KIDS_DIR, 'world', 'places')
for (const f of readdirSync(PLACES).filter((f) => f.endsWith('.json'))) collect(readJson(join(PLACES, f)))
// Từ của hình (PICTURE_WORDS): đọc thẳng nguồn vì pictures.ts import không đuôi file nên Node không nạp được
for (const f of ['pictures.ts', 'picturesMore.ts', 'picturesKids2.ts', 'pictureExtras.ts']) {
  const src = readFileSync(resolve('src/shared', f), 'utf8')
  for (const m of src.matchAll(/\ben:\s*'([^']+)'/g)) kidsTexts.add(m[1])
}
for (const text of kidsTexts) for (const rate of KIDS_RATES) add(text, 'us', rate)
console.log(`Chế độ trẻ em: ${kidsTexts.size} từ/câu × ${KIDS_RATES.length} tốc độ`)
// Bản thu thật (VOA, public domain): MP3 nguyên bản trong content/curated/listening-audio, đưa vào gói y nguyên
const REAL_DIR = resolve('content/curated/listening-audio')
const realRecordings = new Map() // id → đường dẫn file
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(join(DIR, file), 'utf8').replace(/^\p{Cf}/u, ''))
  for (const lesson of data.lessons)
    for (const block of lesson.blocks)
      if (block.type === 'audio' && block.recording) realRecordings.set(block.recording.id, join(REAL_DIR, `${block.recording.id}.mp3`))
}
console.log(`Bản thu thật: ${realRecordings.size} file`)
console.log(`Cần tạo ${wanted.size} đoạn âm thanh (${[...PACK_RATES].join(', ')} tốc độ)`)

if (listOnly) process.exit(0)

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
const queue = [...wanted].filter(([key]) => !clips[key]).sort(([, a], [, b]) => Number(b.accent === 'uk') - Number(a.accent === 'uk'))
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
