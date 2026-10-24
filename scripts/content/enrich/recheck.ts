// content:enrich vi-recheck — duyệt lại NGHĨA VIỆT HIỆN HIỆN CÓ (Wiktionary, suy ngược, AI sinh) của các từ theo tần suất.
// Nhiều nghĩa tự động sai/thô (her → chỉ/bả, them → bầy quân, you → various): model mạnh đọc nghĩa hiện có cùng định nghĩa
// tiếng Anh rồi trả `keep` hoặc `replace` (danh sách mới). `replace` ghi vào vi-generated.json với `replace: true`
// (stage merge sẽ THAY hẳn nghĩa Wiktionary). Mọi từ đã xét ghi vào vi-recheck.json → chạy lại không xét lại.
// review.by ghi rõ là duyệt bằng AI (`claude-cli-review:<model>`), không phải người.
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { runClaudeCli } from './claude-cli'
import { sanitize } from './review'
import { Pos, type Word } from '../../../src/shared/schemas/content'
import { ensureDir, log, readJsonl } from '../lib/io'
import { CURATED_DIR, normalizedPath } from '../lib/paths'
import { loadViGenerated, saveViGenerated } from './vi-generated'

const LEDGER_PATH = join(CURATED_DIR, 'vocab', 'vi-recheck.json')
const PROMPT_PATH = join(fileURLToPath(new URL('.', import.meta.url)), '../prompts/vi-recheck.md')
const CLI_TIMEOUT_MS = 10 * 60_000
const MAX_SENSES = 4
const MAX_GLOSS = 120

const Item = z.object({
  id: z.string(),
  verdict: z.enum(['keep', 'replace']),
  meanings: z.array(z.object({ text: z.string(), pos: Pos })).optional(),
  note: z.string().optional()
})
const Batch = z.object({ items: z.array(Item) })

interface LedgerEntry {
  verdict: 'keep' | 'replace'
  by: string
}
type Ledger = { $comment: string; entries: Record<string, LedgerEntry> }

async function loadLedger(): Promise<Ledger> {
  const empty: Ledger = {
    $comment:
      'Từ đã được duyệt lại nghĩa Việt (pnpm content:enrich vi-recheck). keep = giữ nguyên; replace = đã ghi nghĩa mới vào vi-generated.json (replace: true).',
    entries: {}
  }
  if (!existsSync(LEDGER_PATH)) return empty
  return JSON.parse(await readFile(LEDGER_PATH, 'utf8')) as Ledger
}

async function saveLedger(l: Ledger): Promise<void> {
  const lines = Object.entries(l.entries)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([id, e]) => `    ${JSON.stringify(id)}: ${JSON.stringify(e)}`)
  await ensureDir(dirname(LEDGER_PATH))
  await writeFile(
    LEDGER_PATH,
    `{\n  "$comment": ${JSON.stringify(l.$comment)},\n  "entries": ${lines.length ? `{\n${lines.join(',\n')}\n  }` : '{}'}\n}\n`,
    'utf8'
  )
}

interface Options {
  claudeBin: string
  model: string
  effort: string
  batch: number
  concurrency: number
  fromRank: number
  toRank: number
  limit?: number
}

function parseArgs(args: string[]): Options {
  const o: Options = {
    claudeBin: 'claude',
    model: 'claude-opus-5-5',
    effort: 'medium',
    batch: 25,
    concurrency: 2,
    fromRank: 1,
    toRank: 3000
  }
  const num = (flag: string, v: string | undefined): number => {
    const n = Number(v)
    if (!Number.isInteger(n) || n <= 0) throw new Error(`${flag} needs a positive integer`)
    return n
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--model') o.model = args[++i] ?? ''
    else if (a === '--effort') o.effort = args[++i] ?? ''
    else if (a === '--batch') o.batch = num(a, args[++i])
    else if (a === '--concurrency') o.concurrency = num(a, args[++i])
    else if (a === '--from-rank') o.fromRank = num(a, args[++i])
    else if (a === '--to-rank') o.toRank = num(a, args[++i])
    else if (a === '--limit') o.limit = num(a, args[++i])
    else if (a === '--claude-bin') o.claudeBin = args[++i] ?? ''
    else throw new Error(`Unknown option "${a}"`)
  }
  if (!/^[\w.-]+$/.test(o.model)) throw new Error('--model needs a model id')
  return o
}

export async function recheckVi(args: string[]): Promise<void> {
  const opts = parseArgs(args)
  const ledger = await loadLedger()
  const curated = await loadViGenerated()

  const todo: Word[] = []
  for await (const w of readJsonl<Word>(normalizedPath('words.jsonl'))) {
    const rank = w.freqRank
    if (rank === undefined || rank < opts.fromRank || rank > opts.toRank) continue
    if (ledger.entries[w.id]) continue
    todo.push(w)
  }
  todo.sort((a, b) => (a.freqRank ?? 0) - (b.freqRank ?? 0))
  const words = opts.limit ? todo.slice(0, opts.limit) : todo
  log(
    `recheck vi: rank ${opts.fromRank}–${opts.toRank}: ${todo.length} chưa xét, xét ${words.length} từ`
  )
  if (!words.length) return

  const items = words.map((w) => ({
    id: w.id,
    lemma: w.lemma,
    pos: w.pos,
    level: w.level,
    senses: w.senses
      .slice(0, MAX_SENSES)
      .map(
        (s) => `(${s.pos}) ${s.en.length > MAX_GLOSS ? s.en.slice(0, MAX_GLOSS - 1) + '…' : s.en}`
      ),
    ...(w.examples[0]?.en ? { example: w.examples[0].en } : {}),
    current: w.vi.slice(0, 8).map((v) => ({ text: v.text, pos: v.pos, origin: v.origin }))
  }))
  const batches: (typeof items)[] = []
  for (let i = 0; i < items.length; i += opts.batch) batches.push(items.slice(i, i + opts.batch))
  const system = (await readFile(PROMPT_PATH, 'utf8')).trim()
  const schema = z.toJSONSchema(Batch)
  const date = new Date().toISOString().slice(0, 10)
  const stats = { keep: 0, replace: 0, failed: 0 }
  let next = 0
  let abort: Error | undefined
  let saving = Promise.resolve()
  log(
    `recheck vi: ${items.length} từ / ${batches.length} lô → Claude CLI (${opts.model}, effort ${opts.effort}, ${opts.concurrency} luồng)`
  )

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
        log(`  ✗ ${tag}: ${res.message} — các từ chưa được xét`)
      }
      return
    }
    const parsed = Batch.safeParse(res.output)
    if (!parsed.success) {
      stats.failed += batch.length
      log(`  ✗ ${tag}: kết quả sai schema — các từ chưa được xét`)
      return
    }
    const byId = new Map(batch.map((b) => [b.id, b]))
    const by = `claude-cli-review:${res.model}@${date}`
    const counts = { keep: 0, replace: 0 }
    for (const it of parsed.data.items) {
      const src = byId.get(it.id)
      if (!src || ledger.entries[it.id]) continue
      if (it.verdict === 'replace') {
        const meanings = sanitize(it.meanings ?? [], src)
        if (!meanings.length) {
          stats.failed++
          continue
        }
        curated.entries[it.id] = {
          lemma: src.lemma,
          meanings,
          confidence: 'high',
          ...(it.note ? { note: it.note.slice(0, 200) } : {}),
          replace: true,
          source: {
            id: 'generated',
            license: 'proprietary-own',
            generatedBy: `${res.model}@${date}`
          },
          review: { status: 'approved', by }
        }
      }
      ledger.entries[it.id] = { verdict: it.verdict, by }
      counts[it.verdict]++
    }
    stats.keep += counts.keep
    stats.replace += counts.replace
    saving = saving.then(async () => {
      await saveViGenerated(curated)
      await saveLedger(ledger)
    })
    await saving
    log(`  ✔ ${tag}: giữ ${counts.keep}, sửa ${counts.replace}`)
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
  log(`recheck vi: giữ ${stats.keep}, sửa ${stats.replace}, chưa xong ${stats.failed}`)
  log('recheck vi: tiếp → pnpm content:normalize merge level && pnpm content:validate --release')
}
