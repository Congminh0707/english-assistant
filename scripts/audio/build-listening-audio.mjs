// Tạo gói âm thanh bài nghe (MP3, giọng Kokoro) để người dùng tải thêm — không nhét vào bộ cài.
// Chạy: node scripts/audio/build-listening-audio.mjs [phiên bản=1.0.0]
// Cần: model Kokoro đã tải trong %APPDATA%/english-assistant/models (bật "Giọng tự nhiên" trong app một lần),
//      devDependency @breezystack/lamejs (bộ mã hoá MP3, LGPL — chỉ dùng lúc build, không đóng vào app).
// Đầu ra: content/.build/audio/listening-audio-<ver>.zip (+ .sha256) → đưa lên GitHub Release (docs/15 §7).
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { env } from '@huggingface/transformers'
import { KokoroTTS } from 'kokoro-js'
import { Mp3Encoder } from '@breezystack/lamejs'
import { zipSync } from 'fflate'

// Dùng chung quy ước khoá/giọng với app (Node 22.18+ chạy được file .ts thuần kiểu)
import {
  LISTENING_PACK_ID,
  PACK_RATES,
  PACK_VOICES,
  packClipKey,
  normalizePackText
} from '../../src/shared/audioPack.ts'

const version = process.argv[2] ?? '1.0.0'
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
      if (block.type !== 'audio') continue
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
console.log(`Cần tạo ${wanted.size} đoạn âm thanh (${[...PACK_RATES].join(', ')} tốc độ)`)

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
let n = 0
const t0 = Date.now()
// Giọng Anh (bf_emma) tạo trước: nếu build bị ngắt thì phần dở dang vẫn là giọng Mỹ, không mất giọng mặc định
const queue = [...wanted].sort(([, a], [, b]) => Number(b.accent === 'uk') - Number(a.accent === 'uk'))
for (const [key, item] of queue) {
  const out = await tts.generate(item.text, {
    voice: PACK_VOICES[item.accent],
    speed: kokoroSpeed(item.rate)
  })
  const name = `${key}.mp3`
  files[`clips/${name}`] = [new Uint8Array(toMp3(out.audio, out.sampling_rate)), { level: 0 }]
  clips[key] = name
  if (++n % 25 === 0) console.log(`${n}/${wanted.size} (${Math.round((Date.now() - t0) / 1000)}s)`)
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
