// content:enrich vi-review — duyệt các nghĩa Việt `draft` (do content:enrich vi sinh) bằng Claude CLI:
// model mạnh hơn đọc từng mục (kèm định nghĩa tiếng Anh) rồi trả verdict ok | fix | reject.
//   ok     → review.status = approved
//   fix    → thay meanings bằng bản đã sửa, approved, ghi note
//   reject → review.status = rejected (từ không dùng được; không bị sinh lại)
// review.by ghi rõ là bước duyệt bằng AI (`claude-cli-review`), không phải người thật — xem docs/09 §10.5.
// Ghi file sau mỗi lô; không chạy song song với `content:enrich vi` (cùng ghi vi-generated.json).
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { runClaudeCli } from './claude-cli'
import { loadPromptWords, type MissingViFile, type PromptWord } from './vi'
import { Pos } from '../../../src/shared/schemas/content'
import { log, readJson, requireFile } from '../lib/io'
import { normalizedPath } from '../lib/paths'
import {
  MAX_GENERATED_MEANINGS,
  MAX_MEANING_CHARS,
  VI_GENERATED_PATH,
  loadViGenerated,
  saveViGenerated
} from './vi-generated'

const REVIEW_BY = 'claude-cli-review'
const PROMPT_PATH = join(fileURLToPath(new URL('.', import.meta.url)), '../prompts/vi-review.md')
const CLI_TIMEOUT_MS = 10 * 60_000

const ReviewItem = z.object({
  id: z.string(),
  verdict: z.enum(['ok', 'fix', 'reject']),
  meanings: z.array(z.object({ text: z.string(), pos: Pos })).optional(),
  note: z.string().optional()
})
const ReviewBatch = z.object({ items: z.array(ReviewItem) })

interface Options {
  claudeBin: string
  model: string
  effort: string
  batch: number
  concurrency: number
  limit?: number
  /** File curated khác (để thử trên bản sao khi `content:enrich vi` đang ghi file chính) */
  file: string
}

function parseArgs(args: string[]): Options {
  const o: Options = {
    claudeBin: 'claude',
    model: 'opus',
    effort: 'medium',
    batch: 25,
    concurrency: 2,
    file: VI_GENERATED_PATH
  }
  const num = (flag: string, v: string | undefined): number => {
    const n = Number(v)
    if (!Number.isInteger(n) || n <= 0) throw new Error(`${flag} needs a positive integer`)
    return n
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--limit') o.limit = num(a, args[++i])
    else if (a === '--batch') o.batch = num(a, args[++i])
    else if (a === '--concurrency') o.concurrency = num(a, args[++i])
    else if (a === '--model') o.model = args[++i] ?? ''
    else if (a === '--effort') o.effort = args[++i] ?? ''
    else if (a === '--file') o.file = args[++i] ?? ''
    else if (a === '--claude-bin') o.claudeBin = args[++i] ?? ''
    else if (a === '--provider') {
      if (args[++i] !== 'claude-cli')
        throw new Error('vi-review only supports --provider claude-cli')
    } else throw new Error(`Unknown option "${a}"`)
  }
  if (!/^[\w.-]+$/.test(o.model)) throw new Error('--model needs a model id')
  return o
}

export async function reviewVi(args: string[]): Promise<void> {
  const opts = parseArgs(args)
  const curated = await loadViGenerated(opts.file)
  // Duyệt theo tần suất: từ phổ biến (freqRank thấp) trước, để hạn mức có hạn dùng cho từ hay gặp nhất
  requireFile(normalizedPath('missing-vi.json'), 'pnpm content:normalize (stage level)')
  const rank = new Map<string, number>(
    (await readJson<MissingViFile>(normalizedPath('missing-vi.json'))).words.map((w) => [
      w.id,
      w.freqRank ?? Number.POSITIVE_INFINITY
    ])
  )
  const rankOf = (id: string): number => rank.get(id) ?? Number.POSITIVE_INFINITY
  const draftIds = Object.entries(curated.entries)
    .filter(([, e]) => e.review.status === 'draft')
    .map(([id]) => id)
    .sort((a, b) => rankOf(a) - rankOf(b) || (a < b ? -1 : 1))
  const todoIds = opts.limit ? draftIds.slice(0, opts.limit) : draftIds
  log(`review vi: ${draftIds.length} draft entries, reviewing ${todoIds.length}`)
  if (!todoIds.length) return

  // Ngữ cảnh (định nghĩa tiếng Anh) lấy từ words.jsonl; mục không còn trong từ điển giữ nguyên draft
  const words = await loadPromptWords(new Set(todoIds))
  const system = (await readFile(PROMPT_PATH, 'utf8')).trim()
  const schema = z.toJSONSchema(ReviewBatch)

  const items = todoIds
    .filter((id) => words.has(id))
    .map((id) => ({
      ...(words.get(id) as PromptWord),
      draft: curated.entries[id].meanings,
      confidence: curated.entries[id].confidence
    }))
  const batches: (typeof items)[] = []
  for (let i = 0; i < items.length; i += opts.batch) batches.push(items.slice(i, i + opts.batch))
  log(
    `review vi: ${items.length} words in ${batches.length} batches → Claude CLI (${opts.model}, effort ${opts.effort}, concurrency ${opts.concurrency})`
  )

  const date = new Date().toISOString().slice(0, 10)
  const stats = { ok: 0, fix: 0, reject: 0, failed: 0 }
  let next = 0
  let abort: Error | undefined
  let saving = Promise.resolve()

  const run = async (batch: (typeof items)[number][], n: number): Promise<void> => {
    const tag = `batch ${n + 1}/${batches.length}`
    const res = await runClaudeCli(
      { bin: opts.claudeBin, model: opts.model, effort: opts.effort, timeoutMs: CLI_TIMEOUT_MS },
      system,
      schema,
      `Words (${batch.length}):\n${JSON.stringify(batch, null, 1)}`
    )
    if (!res.ok) {
      if (res.fatal) abort = new Error(res.message)
      else {
        stats.failed += batch.length
        log(`  ✗ ${tag}: ${res.message} — entries stay draft`)
      }
      return
    }
    const parsed = ReviewBatch.safeParse(res.output)
    if (!parsed.success) {
      stats.failed += batch.length
      log(`  ✗ ${tag}: output does not match the schema — entries stay draft`)
      return
    }
    const asked = new Set(batch.map((w) => w.id))
    const counts = { ok: 0, fix: 0, reject: 0 }
    for (const it of parsed.data.items) {
      const entry = curated.entries[it.id]
      if (!asked.has(it.id) || !entry || entry.review.status !== 'draft') continue
      const by = `${REVIEW_BY}:${res.model}@${date}`
      if (it.verdict === 'reject') {
        entry.review = { status: 'rejected', by }
        if (it.note) entry.note = it.note.slice(0, 200)
      } else {
        if (it.verdict === 'fix') {
          const fixed = sanitize(it.meanings ?? [], batch.find((w) => w.id === it.id) as PromptWord)
          if (!fixed.length) {
            stats.failed++
            continue
          }
          entry.meanings = fixed
          if (it.note) entry.note = it.note.slice(0, 200)
        }
        entry.review = { status: 'approved', by }
      }
      counts[it.verdict]++
    }
    const left = batch.filter((w) => curated.entries[w.id].review.status === 'draft').length
    stats.ok += counts.ok
    stats.fix += counts.fix
    stats.reject += counts.reject
    stats.failed += left
    saving = saving.then(() => saveViGenerated(curated, opts.file))
    await saving
    log(
      `  ✔ ${tag}: ok ${counts.ok}, fix ${counts.fix}, reject ${counts.reject}${left ? `, ${left} still draft` : ''}`
    )
  }

  await Promise.all(
    Array.from({ length: Math.min(opts.concurrency, batches.length) }, async () => {
      while (!abort && next < batches.length) {
        const n = next++
        await run(batches[n], n)
      }
    })
  )
  if (abort) throw abort
  log(
    `review vi: ok ${stats.ok}, fixed ${stats.fix}, rejected ${stats.reject}, not done ${stats.failed}`
  )
  log('review vi: next → pnpm content:normalize merge level && pnpm content:validate --release')
}

/** Chuẩn hoá nghĩa đã sửa: tách ";" , bỏ trùng/trống/quá dài/lặp lại lemma, pos ngoài danh sách thì bỏ pos */
export function sanitize(
  meanings: { text: string; pos: z.infer<typeof Pos> }[],
  word: Pick<PromptWord, 'lemma' | 'pos'>
): { text: string; pos?: z.infer<typeof Pos> }[] {
  const seen = new Set<string>()
  const out: { text: string; pos?: z.infer<typeof Pos> }[] = []
  for (const m of meanings) {
    for (const part of m.text.split(/\s*;\s*/)) {
      const text = part
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .replace(/^[\s,.]+|[\s,.]+$/g, '')
      const key = text.toLowerCase()
      if (
        !text ||
        seen.has(key) ||
        key === word.lemma.toLowerCase() ||
        text.length > MAX_MEANING_CHARS
      )
        continue
      seen.add(key)
      out.push({ text, ...(word.pos.includes(m.pos) ? { pos: m.pos } : {}) })
    }
  }
  return out.slice(0, MAX_GENERATED_MEANINGS)
}
