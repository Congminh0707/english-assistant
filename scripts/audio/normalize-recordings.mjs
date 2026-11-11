// Chuẩn hoá âm lượng bản thu thật (VOA) trong content/curated/listening-audio về mức của giọng Kokoro.
// Chạy: node scripts/audio/normalize-recordings.mjs [--check]
//   (không cờ)  đo, rồi chuẩn hoá file nào lệch; ghi đè file gốc chỉ sau khi file mới đã đo lại và đạt.
//   --check     chỉ đo và in bảng; thoát mã 1 nếu có file ngoài dung sai.
// Mục tiêu: -22 LUFS tích hợp, true peak <= -1.5 dBTP (loudnorm 2 lượt, linear=true → chỉ đổi độ lợi, không nén động).
// Bỏ qua file đã trong ±0,5 LU của mục tiêu và true peak <= -1,0. Cần ffmpeg: biến FFMPEG, hoặc PATH, hoặc C:\ffmpeg\bin.
// Mono mã hoá 64k, stereo 96k (libmp3lame CBR, 44100 Hz). Sau khi chạy, dựng lại gói (docs/15 §6b).
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const TARGET_I = -22
const TARGET_TP = -1.5
const TARGET_LRA = 11
const TOL_LU = 0.5
const MAX_TP_OK = -1.0
const MAX_DRIFT_S = 0.1
const DIR = resolve('content/curated/listening-audio')
const checkOnly = process.argv.includes('--check')

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (!probe.error && probe.status === 0) return 'ffmpeg'
  const win = 'C:\\ffmpeg\\bin\\ffmpeg.exe'
  if (existsSync(win)) return win
  console.error('Không tìm thấy ffmpeg (đặt biến FFMPEG hoặc thêm vào PATH).')
  process.exit(2)
}
const FFMPEG = findFfmpeg()
const FFPROBE = FFMPEG.replace(/ffmpeg(\.exe)?$/i, (_, e) => `ffprobe${e ?? ''}`)

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.error) throw r.error
  return r
}

/** Đo loudnorm (JSON in ra stderr) — dùng cho cả lượt đo lẫn lượt kiểm */
function measure(
  file,
  filter = `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`
) {
  const r = run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', filter, '-f', 'null', '-'])
  const m = r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)
  if (!m) throw new Error(`Không đọc được kết quả loudnorm: ${file}\n${r.stderr.slice(-400)}`)
  const j = JSON.parse(m[0])
  return {
    i: Number(j.input_i),
    tp: Number(j.input_tp),
    lra: Number(j.input_lra),
    thresh: Number(j.input_thresh),
    offset: Number(j.target_offset),
    type: j.normalization_type
  }
}

function info(file) {
  const r = run(FFPROBE, [
    '-v',
    'error',
    '-select_streams',
    'a:0',
    '-show_entries',
    'stream=channels,sample_rate,bit_rate:format=duration',
    '-of',
    'json',
    file
  ])
  const j = JSON.parse(r.stdout)
  return {
    channels: j.streams[0].channels,
    rate: Number(j.streams[0].sample_rate),
    kbps: Math.round(Number(j.streams[0].bit_rate ?? 0) / 1000),
    duration: Number(j.format.duration)
  }
}

const inTolerance = (m) => Math.abs(m.i - TARGET_I) <= TOL_LU && m.tp <= MAX_TP_OK

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.mp3'))
  .sort()
const rows = []
let bad = 0
const dynamic = []

for (const f of files) {
  const path = join(DIR, f)
  const before = measure(path)
  const infoBefore = info(path)
  let after = before
  let infoAfter = infoBefore
  let status
  if (!inTolerance(before)) {
    if (checkOnly) {
      status = 'OUT'
      bad++
    } else {
      const tmp = join(DIR, `${f}.tmp.mp3`)
      const filter =
        `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}` +
        `:measured_I=${before.i}:measured_TP=${before.tp}:measured_LRA=${before.lra}` +
        `:measured_thresh=${before.thresh}:offset=${before.offset}:linear=true:print_format=json`
      const r = run(FFMPEG, [
        '-hide_banner',
        '-nostats',
        '-y',
        '-i',
        path,
        '-map_metadata',
        '0',
        '-af',
        filter,
        '-ar',
        '44100',
        '-ac',
        String(infoBefore.channels),
        '-c:a',
        'libmp3lame',
        '-b:a',
        infoBefore.channels === 1 ? '64k' : '96k',
        tmp
      ])
      const m = r.stderr.match(/\{[^{}]*"normalization_type"[^{}]*\}/)
      if (m && JSON.parse(m[0]).normalization_type === 'dynamic') dynamic.push(f)
      if (r.status !== 0 || !existsSync(tmp)) {
        console.error(`ffmpeg lỗi: ${f}\n${r.stderr.slice(-400)}`)
        rmSync(tmp, { force: true })
        process.exit(1)
      }
      after = measure(tmp)
      infoAfter = info(tmp)
      const drift = Math.abs(infoAfter.duration - infoBefore.duration)
      if (!inTolerance(after) || drift > MAX_DRIFT_S) {
        console.error(
          `Kết quả không đạt, giữ nguyên bản gốc: ${f} (I=${after.i}, TP=${after.tp}, lệch ${drift.toFixed(3)}s)`
        )
        rmSync(tmp, { force: true })
        process.exit(1)
      }
      renameSync(tmp, path)
      status = 'normalized'
    }
  } else status = 'skipped'
  rows.push([
    f,
    status,
    `${before.i.toFixed(1)}`,
    `${after.i.toFixed(1)}`,
    `${before.tp.toFixed(1)}`,
    `${after.tp.toFixed(1)}`,
    `${infoBefore.duration.toFixed(2)}`,
    `${infoAfter.duration.toFixed(2)}`,
    `${infoBefore.kbps}`,
    `${infoAfter.kbps}`,
    `${infoAfter.channels}`
  ])
}

const table = [
  ['file', 'status', 'LUFS<', 'LUFS>', 'TP<', 'TP>', 'dur<', 'dur>', 'kbps<', 'kbps>', 'ch'],
  ...rows
]
const widths = table[0].map((_, c) => Math.max(...table.map((r) => r[c].length)))
for (const r of table)
  console.log(
    r.map((cell, c) => (c < 2 ? cell.padEnd(widths[c]) : cell.padStart(widths[c]))).join('  ')
  )
console.log(
  `Mục tiêu ${TARGET_I} LUFS ±${TOL_LU}, true peak <= ${MAX_TP_OK} dBTP (đích ${TARGET_TP}).`
)
if (dynamic.length)
  console.warn(`CẢNH BÁO loudnorm chuyển sang chế độ dynamic: ${dynamic.join(', ')}`)
if (checkOnly && bad) {
  console.error(`${bad} file ngoài dung sai.`)
  process.exit(1)
}
