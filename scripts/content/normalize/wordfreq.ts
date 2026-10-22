// wordfreq large_en (msgpack.gz) → normalized/wordfreq.json: { từ: bậc tần suất }
// Bậc = chỉ số bucket centibel của wordfreq (nhỏ = phổ biến; 500 ≈ 1 lần/300.000 từ). Chỉ giữ từ chữ cái viết thường
// đủ phổ biến — dùng để chọn từ ngoài Tatoeba đưa vào từ điển (xem merge.ts), không phân phối lại số đếm.
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { log, writeJson } from '../lib/io'
import { decodeMsgpack } from '../lib/msgpack'
import { normalizedPath, rawPath } from '../lib/paths'

/** Bậc tối đa được xét (720 ≈ 130.000 token đầu; sau khi lọc bằng Wiktionary còn vài chục nghìn từ thật) */
export const WORDFREQ_MAX_BUCKET = 720

export type WordfreqFile = Record<string, number>

export async function normalizeWordfreq(): Promise<void> {
  const data = decodeMsgpack(
    gunzipSync(readFileSync(rawPath('wordfreq', 'large_en.msgpack.gz')))
  ) as unknown[]
  const out: WordfreqFile = {}
  for (let bucket = 1; bucket <= Math.min(WORDFREQ_MAX_BUCKET, data.length - 1); bucket++) {
    for (const w of data[bucket] as string[]) {
      if (/^[a-z]+(?:-[a-z]+)*$/.test(w) && w.length > 1 && !(w in out)) out[w] = bucket
    }
  }
  await writeJson(normalizedPath('wordfreq.json'), out)
  log(`wordfreq: ${Object.keys(out).length} từ (bậc ≤ ${WORDFREQ_MAX_BUCKET})`)
}
