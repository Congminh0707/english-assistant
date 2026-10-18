// Tatoeba → normalized/tatoeba-freq.json (tần suất token, làm proxy tần suất từ)
//         + normalized/tatoeba-eng.jsonl (câu tiếng Anh ứng viên làm ví dụ, kèm bản dịch Việt nếu có)
import { log, JsonlWriter, readLines, requireFile, writeJson } from '../lib/io'
import { normalizedPath, rawPath } from '../lib/paths'
import { tokenize } from '../lib/text'

export interface TatoebaSentence {
  id: number
  text: string
  author?: string
}

export interface TatoebaCandidate extends TatoebaSentence {
  vi: TatoebaSentence[]
}

export type TatoebaFreqFile = Record<string, number>
/** Token thường viết hoa giữa câu (Tom, Boston...) → coi là tên riêng */
export type TatoebaNamesFile = string[]

const MAX_LEN = 120
const MIN_TOKENS = 3
const MAX_TOKENS = 16
const MAX_LEN_WITH_VI = 250

function parseDetailed(line: string): TatoebaSentence | null {
  // id \t lang \t text \t username \t added \t modified
  const [id, , text, user] = line.split('\t')
  if (!id || !text) return null
  return { id: Number(id), text: text.trim(), author: user && user !== '\\N' ? user : undefined }
}

/** Câu "sạch" để làm ví dụ: ngắn, chữ Latin cơ bản, có dấu kết câu */
function isGoodExample(text: string, tokenCount: number): boolean {
  return (
    text.length <= MAX_LEN &&
    tokenCount >= MIN_TOKENS &&
    tokenCount <= MAX_TOKENS &&
    /^["A-Z]/.test(text) &&
    /[.?!]["]?$/.test(text) &&
    /^[A-Za-z0-9 ,.;:?!'"’()-]+$/.test(text)
  )
}

export async function normalizeTatoeba(): Promise<void> {
  const files = {
    eng: rawPath('tatoeba', 'eng_sentences_detailed.tsv'),
    vie: rawPath('tatoeba', 'vie_sentences_detailed.tsv'),
    links: rawPath('tatoeba', 'eng-vie_links.tsv')
  }
  for (const f of Object.values(files)) requireFile(f, 'pnpm content:fetch tatoeba')

  const vie = new Map<number, TatoebaSentence>()
  for await (const line of readLines(files.vie)) {
    const s = parseDetailed(line)
    if (s) vie.set(s.id, s)
  }
  const links = new Map<number, number[]>()
  for await (const line of readLines(files.links)) {
    const [en, vi] = line.split('\t').map(Number)
    if (!vie.has(vi)) continue
    const list = links.get(en) ?? []
    list.push(vi)
    links.set(en, list)
  }

  const lower: TatoebaFreqFile = {}
  const initial: TatoebaFreqFile = {}
  const capMid: TatoebaFreqFile = {}
  const out = new JsonlWriter(normalizedPath('tatoeba-eng.jsonl'))
  let total = 0
  let withVi = 0
  for await (const line of readLines(files.eng)) {
    const s = parseDetailed(line)
    if (!s) continue
    total++
    const tokens = tokenize(s.text)
    tokens.forEach((t, i) => {
      // Đếm riêng viết thường / đầu câu / viết hoa giữa câu để "Tom" không làm phồng tần suất của "tom"
      const bucket =
        !/^[A-Z]/.test(t.raw) || t.norm === 'i' || t.norm.startsWith("i'")
          ? lower
          : i === 0
            ? initial
            : capMid
      bucket[t.norm] = (bucket[t.norm] ?? 0) + 1
    })
    const viIds = links.get(s.id)
    const vi = (viIds ?? []).map((id) => vie.get(id)!).sort((a, b) => a.id - b.id)
    if (vi.length ? s.text.length <= MAX_LEN_WITH_VI : isGoodExample(s.text, tokens.length)) {
      if (vi.length) withVi++
      await out.write({ ...s, vi } satisfies TatoebaCandidate)
    }
  }
  await out.close()

  const names: TatoebaNamesFile = Object.entries(capMid)
    .filter(([k, n]) => n >= 3 && n > 2 * (lower[k] ?? 0))
    .map(([k]) => k)
    .sort()
  const nameSet = new Set(names)
  // Tần suất = viết thường + đầu câu (trừ tên riêng: chỉ tính viết thường)
  const freq: TatoebaFreqFile = { ...lower }
  for (const [k, n] of Object.entries(initial)) if (!nameSet.has(k)) freq[k] = (freq[k] ?? 0) + n
  for (const [k, v] of Object.entries(freq)) if (v < 2) delete freq[k]
  await writeJson(normalizedPath('tatoeba-freq.json'), freq)
  await writeJson(normalizedPath('tatoeba-names.json'), names)
  log(
    `tatoeba: ${total} EN sentences, ${out.count} example candidates (${withVi} with VI), ${Object.keys(freq).length} token types (count ≥ 2), ${names.length} name-like tokens`
  )
}
