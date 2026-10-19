// content:enrich vi — sinh nghĩa tiếng Việt ngắn bằng Claude cho các từ trong normalized/missing-vi.json
// (top 10k chưa có nghĩa Việt từ Wiktionary), ghi vào content/curated/vocab/vi-generated.json.
//
// Chế độ:
//   --provider api        gọi Claude API — key CHỈ lấy từ biến môi trường ANTHROPIC_API_KEY, không bao giờ log
//   --provider claude-cli gọi qua Claude Code CLI (`claude -p`), dùng phiên đăng nhập Claude — không cần API key
//                         (mặc định: api nếu có ANTHROPIC_API_KEY, ngược lại claude-cli)
//   --dry-run         không gọi API, không cần key: in thống kê + ghi request vào content/.build/enrich-vi/
//   --import <file>   nhập kết quả đã sinh ở nơi khác (Batch API, console…) theo đúng schema đầu ra
//
// Idempotent: từ đã có mục trong file curated (kể cả rejected) không bao giờ được gửi lại.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { runClaudeCli } from './claude-cli'
import { Pos, type Word } from '../../../src/shared/schemas/content'
import { ensureDir, log, readJson, readJsonl, requireFile, writeJson } from '../lib/io'
import { BUILD_DIR, normalizedPath } from '../lib/paths'
import {
  MAX_GENERATED_MEANINGS,
  MAX_MEANING_CHARS,
  VI_GENERATED_PATH,
  loadViGenerated,
  saveViGenerated,
  type GeneratedViEntry,
  type ViGeneratedFile
} from './vi-generated'

const DEFAULT_MODEL = 'claude-opus-5-5'
const DEFAULT_EFFORT = 'medium'
const DEFAULT_BATCH = 40
const DEFAULT_CONCURRENCY = 3
/** Claude CLI dùng giới hạn của gói đăng nhập → chạy ít luồng hơn */
const DEFAULT_CLI_CONCURRENCY = 2
const CLI_TIMEOUT_MS = 10 * 60_000
const MAX_SENSES_IN_PROMPT = 5
const MAX_GLOSS_CHARS = 140
const PROMPT_PATH = join(fileURLToPath(new URL('.', import.meta.url)), '../prompts/vi-meanings.md')
const DRY_RUN_DIR = join(BUILD_DIR, 'enrich-vi')

/** Định dạng đầu ra yêu cầu model trả về (structured outputs) — cũng là định dạng file --import */
export const LlmViItem = z.object({
  id: z.string(),
  meanings: z.array(z.object({ text: z.string(), pos: Pos })),
  confidence: z.enum(['high', 'medium', 'low'])
})
export const LlmViBatch = z.object({ items: z.array(LlmViItem) })
type LlmViItem = z.infer<typeof LlmViItem>

const ImportFile = z.object({
  /** Model đã sinh nội dung, vd 'claude-opus-5-5' */
  model: z.string().regex(/^[\w.-]+$/),
  /** Ngày sinh (YYYY-MM-DD); mặc định hôm nay */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  items: z.array(LlmViItem)
})

/** normalized/missing-vi.json — sinh bởi stage level */
export interface MissingViFile {
  count: number
  words: {
    id: string
    lemma: string
    pos: string[]
    level: string
    freqRank?: number
    /** Đã có nghĩa sinh trong words.jsonl */
    generated?: boolean
  }[]
}

/** Ngữ cảnh gửi cho model cho một từ */
interface PromptWord {
  id: string
  lemma: string
  pos: string[]
  level: string
  senses: string[]
  example?: string
}

type Provider = 'api' | 'claude-cli'

interface Options {
  provider: Provider
  claudeBin: string
  dryRun: boolean
  limit?: number
  batch: number
  concurrency?: number
  model: string
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  importFile?: string
}

function parseArgs(args: string[]): Options {
  const opts: Options = {
    provider: process.env.ANTHROPIC_API_KEY ? 'api' : 'claude-cli',
    claudeBin: 'claude',
    dryRun: false,
    batch: DEFAULT_BATCH,
    model: DEFAULT_MODEL,
    effort: DEFAULT_EFFORT
  }
  const num = (flag: string, v: string | undefined): number => {
    const n = Number(v)
    if (!Number.isInteger(n) || n <= 0) throw new Error(`${flag} needs a positive integer`)
    return n
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--dry-run') opts.dryRun = true
    else if (a === '--limit') opts.limit = num(a, args[++i])
    else if (a === '--batch') opts.batch = num(a, args[++i])
    else if (a === '--concurrency') opts.concurrency = num(a, args[++i])
    else if (a === '--model') opts.model = args[++i] ?? ''
    else if (a === '--effort') opts.effort = args[++i] as Options['effort']
    else if (a === '--import') opts.importFile = args[++i]
    else if (a === '--provider') opts.provider = args[++i] as Provider
    else if (a === '--claude-bin') opts.claudeBin = args[++i] ?? ''
    else throw new Error(`Unknown option "${a}"`)
  }
  if (!/^[\w.-]+$/.test(opts.model)) throw new Error('--model needs a model id')
  if (!['api', 'claude-cli'].includes(opts.provider))
    throw new Error('--provider must be api | claude-cli')
  if (!opts.claudeBin) throw new Error('--claude-bin needs a path')
  if (!['low', 'medium', 'high', 'xhigh', 'max'].includes(opts.effort))
    throw new Error('--effort must be low | medium | high | xhigh | max')
  return opts
}

const today = (): string => new Date().toISOString().slice(0, 10)

/** Chuẩn hoá + kiểm tra một kết quả của model; trả về lỗi (chuỗi) nếu không dùng được */
export function toEntry(
  item: LlmViItem,
  word: Pick<PromptWord, 'lemma' | 'pos'>,
  generatedBy: string
): GeneratedViEntry | string {
  const lemma = word.lemma.toLowerCase()
  const seen = new Set<string>()
  const meanings: GeneratedViEntry['meanings'] = []
  for (const m of item.meanings) {
    // Model đôi khi gộp nhiều nghĩa vào một chuỗi "a; b" → tách ra
    for (const part of m.text.split(/\s*;\s*/)) {
      const text = part
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .replace(/^[\s,.]+|[\s,.]+$/g, '')
      const key = text.toLowerCase()
      if (!text || seen.has(key) || key === lemma || text.length > MAX_MEANING_CHARS) continue
      seen.add(key)
      // pos ngoài danh sách của từ → bỏ pos, vẫn giữ nghĩa
      meanings.push({ text, ...(word.pos.includes(m.pos) ? { pos: m.pos } : {}) })
    }
  }
  if (!meanings.length) return 'no usable meaning'
  return {
    lemma: word.lemma,
    meanings: meanings.slice(0, MAX_GENERATED_MEANINGS),
    confidence: item.confidence,
    source: { id: 'generated', license: 'proprietary-own', generatedBy },
    // review.by để trống cho tới khi có người duyệt (model đã ghi ở source.generatedBy)
    review: { status: 'draft' }
  }
}

async function loadPromptWords(ids: Set<string>): Promise<Map<string, PromptWord>> {
  const out = new Map<string, PromptWord>()
  for await (const w of readJsonl<Word>(normalizedPath('words.jsonl'))) {
    if (!ids.has(w.id)) continue
    const example = w.senses.flatMap((s) => s.examples)[0]?.en ?? w.examples[0]?.en
    out.set(w.id, {
      id: w.id,
      lemma: w.lemma,
      pos: w.pos,
      level: w.level,
      senses: w.senses
        .slice(0, MAX_SENSES_IN_PROMPT)
        .map(
          (s) =>
            `(${s.pos}) ${s.en.length > MAX_GLOSS_CHARS ? s.en.slice(0, MAX_GLOSS_CHARS - 1) + '…' : s.en}`
        ),
      ...(example ? { example } : {})
    })
  }
  return out
}

const userMessage = (batch: PromptWord[]): string =>
  `Words (${batch.length}):\n${JSON.stringify(batch, null, 1)}`

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

interface Coverage {
  missing: number
  covered: number
  todo: number
}

function coverage(missing: MissingViFile, curated: ViGeneratedFile): Coverage {
  const covered = missing.words.filter((w) => curated.entries[w.id]).length
  return { missing: missing.words.length, covered, todo: missing.words.length - covered }
}

const fmtCoverage = (c: Coverage): string =>
  `${c.covered}/${c.missing} words without a Wiktionary meaning have a generated entry, ${c.todo} to go`

/** Ghi kết quả một lô vào file curated; trả về số mục mới */
function applyItems(
  items: LlmViItem[],
  words: Map<string, PromptWord>,
  curated: ViGeneratedFile,
  generatedBy: string,
  expected: Set<string>
): { added: number; rejected: string[] } {
  let added = 0
  const rejected: string[] = []
  for (const item of items) {
    const word = words.get(item.id)
    if (!word || !expected.has(item.id)) {
      rejected.push(`${item.id}: not requested`)
      continue
    }
    if (curated.entries[item.id]) continue // idempotent: đã có mục → giữ nguyên (có thể đã duyệt)
    const entry = toEntry(item, word, generatedBy)
    if (typeof entry === 'string') {
      rejected.push(`${item.id}: ${entry}`)
      continue
    }
    curated.entries[item.id] = entry
    added++
  }
  return { added, rejected }
}

export async function enrichVi(args: string[]): Promise<void> {
  const opts = parseArgs(args)
  requireFile(normalizedPath('missing-vi.json'), 'pnpm content:normalize (stage level)')
  requireFile(normalizedPath('words.jsonl'), 'pnpm content:normalize')
  const missing = await readJson<MissingViFile>(normalizedPath('missing-vi.json'))
  const curated = await loadViGenerated()
  log(`enrich vi: ${fmtCoverage(coverage(missing, curated))}`)

  // ---- --import: kết quả sinh ở nơi khác ----
  if (opts.importFile) {
    const parsed = ImportFile.safeParse(await readJson<unknown>(opts.importFile))
    if (!parsed.success) throw new Error(`${opts.importFile}: ${parsed.error.message}`)
    const { model, date, items } = parsed.data
    const ids = new Set(missing.words.map((w) => w.id))
    const words = await loadPromptWords(ids)
    const { added, rejected } = applyItems(
      items,
      words,
      curated,
      `${model}@${date ?? today()}`,
      ids
    )
    for (const r of rejected) log(`  ✗ ${r}`)
    await saveViGenerated(curated)
    log(`enrich vi: imported ${added} entries (${rejected.length} rejected) → ${VI_GENERATED_PATH}`)
    log(`enrich vi: ${fmtCoverage(coverage(missing, curated))}`)
    return
  }

  let todo = missing.words.filter((w) => !curated.entries[w.id])
  if (opts.limit) todo = todo.slice(0, opts.limit)
  if (!todo.length) {
    log('enrich vi: nothing to do')
    return
  }
  const words = await loadPromptWords(new Set(todo.map((w) => w.id)))
  const notInWords = todo.filter((w) => !words.has(w.id))
  if (notInWords.length)
    log(`enrich vi: ${notInWords.length} ids not in words.jsonl (stale missing-vi.json?) — skipped`)
  const batches = chunk(
    todo.filter((w) => words.has(w.id)).map((w) => words.get(w.id)!),
    opts.batch
  )
  const system = (await readFile(PROMPT_PATH, 'utf8')).trim()

  // ---- --dry-run: không gọi API ----
  if (opts.dryRun) {
    await ensureDir(DRY_RUN_DIR)
    const requests = batches.map((b, i) => ({
      custom_id: `vi-${String(i + 1).padStart(3, '0')}`,
      ids: b.map((w) => w.id),
      user: userMessage(b)
    }))
    await writeJson(join(DRY_RUN_DIR, 'requests.json'), {
      model: opts.model,
      effort: opts.effort,
      system,
      outputSchema: z.toJSONSchema(LlmViBatch),
      requests
    })
    log(
      `enrich vi (dry run): ${todo.length} words in ${batches.length} batches of ≤ ${opts.batch} → ${join(DRY_RUN_DIR, 'requests.json')}`
    )
    log(`enrich vi (dry run): first request:\n${requests[0].user.slice(0, 1200)}`)
    log(
      'enrich vi (dry run): no API call made. Run without --dry-run (--provider api needs ANTHROPIC_API_KEY, --provider claude-cli needs `claude` logged in), or import results with --import <file>'
    )
    return
  }

  if (opts.provider === 'claude-cli') {
    await runWithClaudeCli(opts, system, batches, words, curated, todo.length)
    log(`enrich vi: ${fmtCoverage(coverage(missing, curated))}`)
    log('enrich vi: next → pnpm content:normalize merge level && pnpm content:validate')
    return
  }

  // ---- gọi Claude API ----
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Set it in the environment, or use --dry-run / --import <file>.'
    )
  // Chỉ dùng key từ biến môi trường (không đọc profile/token khác); SDK tự retry 429/5xx
  const client = new Anthropic({ apiKey, maxRetries: 4 })
  const date = today()
  let added = 0
  let failed = 0
  let next = 0
  let abort: Error | undefined

  const runBatch = async (batch: PromptWord[], n: number): Promise<void> => {
    const tag = `batch ${n + 1}/${batches.length}`
    try {
      const res = await client.beta.messages.parse({
        model: opts.model,
        max_tokens: 16000,
        // Model từ chối vì chính sách → server tự chạy lại trên model dự phòng; generatedBy ghi model thực chạy
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: opts.effort, format: betaZodOutputFormat(LlmViBatch) },
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage(batch) }]
      })
      if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens' || !res.parsed_output) {
        failed += batch.length
        log(
          `  ✗ ${tag}: stop_reason=${res.stop_reason}${res.stop_reason === 'max_tokens' ? ' (try a smaller --batch)' : ''} — words stay in the todo list`
        )
        return
      }
      const expected = new Set(batch.map((w) => w.id))
      const r = applyItems(
        res.parsed_output.items,
        words,
        curated,
        `${res.model}@${date}`,
        expected
      )
      const missed = batch.filter((w) => !curated.entries[w.id]).length
      added += r.added
      failed += missed
      for (const x of r.rejected) log(`  ✗ ${x}`)
      // Ghi sau mỗi lô → dừng giữa chừng không mất kết quả
      await saveViGenerated(curated)
      log(
        `  ✔ ${tag}: +${r.added}${missed ? `, ${missed} missing` : ''} (${res.model}, in ${res.usage.input_tokens} / out ${res.usage.output_tokens} tokens)`
      )
    } catch (err) {
      if (
        err instanceof Anthropic.AuthenticationError ||
        err instanceof Anthropic.PermissionDeniedError
      ) {
        abort = new Error(
          `Claude API rejected the credentials (HTTP ${err.status}) — check ANTHROPIC_API_KEY`
        )
      } else if (err instanceof Anthropic.APIError) {
        failed += batch.length
        log(`  ✗ ${tag}: API error ${err.status ?? ''} ${err.name}`)
      } else throw err
    }
  }

  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY
  log(
    `enrich vi: ${todo.length} words in ${batches.length} batches → ${opts.model} (effort ${opts.effort}, concurrency ${concurrency})`
  )
  await Promise.all(
    Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
      while (!abort && next < batches.length) {
        const n = next++
        await runBatch(batches[n], n)
      }
    })
  )
  if (abort) throw abort
  log(`enrich vi: +${added} entries, ${failed} words not done → ${VI_GENERATED_PATH}`)
  log(`enrich vi: ${fmtCoverage(coverage(missing, curated))}`)
  log('enrich vi: next → pnpm content:normalize merge level && pnpm content:validate')
}

/** Chạy các lô qua Claude Code CLI (phiên đăng nhập Claude, không cần API key) */
async function runWithClaudeCli(
  opts: Options,
  system: string,
  batches: PromptWord[][],
  words: Map<string, PromptWord>,
  curated: ViGeneratedFile,
  total: number
): Promise<void> {
  const schema = z.toJSONSchema(LlmViBatch)
  const concurrency = opts.concurrency ?? DEFAULT_CLI_CONCURRENCY
  const date = today()
  let added = 0
  let failed = 0
  let next = 0
  let abort: Error | undefined
  let saving = Promise.resolve()

  log(
    `enrich vi: ${total} words in ${batches.length} batches → Claude CLI (${opts.model}, effort ${opts.effort}, concurrency ${concurrency})`
  )
  const runBatch = async (batch: PromptWord[], n: number): Promise<void> => {
    const tag = `batch ${n + 1}/${batches.length}`
    const res = await runClaudeCli(
      { bin: opts.claudeBin, model: opts.model, effort: opts.effort, timeoutMs: CLI_TIMEOUT_MS },
      system,
      schema,
      userMessage(batch)
    )
    if (!res.ok) {
      if (res.fatal) abort = new Error(res.message)
      else {
        failed += batch.length
        log(`  ✗ ${tag}: ${res.message} — words stay in the todo list`)
      }
      return
    }
    const parsed = LlmViBatch.safeParse(res.output)
    if (!parsed.success) {
      failed += batch.length
      log(`  ✗ ${tag}: output does not match the schema — words stay in the todo list`)
      return
    }
    const expected = new Set(batch.map((w) => w.id))
    const r = applyItems(parsed.data.items, words, curated, `${res.model}@${date}`, expected)
    const missed = batch.filter((w) => !curated.entries[w.id]).length
    added += r.added
    failed += missed
    for (const x of r.rejected) log(`  ✗ ${x}`)
    // Ghi sau mỗi lô (tuần tự) → dừng giữa chừng không mất kết quả
    saving = saving.then(() => saveViGenerated(curated))
    await saving
    log(
      `  ✔ ${tag}: +${r.added}${missed ? `, ${missed} missing` : ''} (${res.model}, in ${res.inputTokens} / out ${res.outputTokens} tokens)`
    )
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
      while (!abort && next < batches.length) {
        const n = next++
        await runBatch(batches[n], n)
      }
    })
  )
  if (abort) throw abort
  log(`enrich vi: +${added} entries, ${failed} words not done → ${VI_GENERATED_PATH}`)
}
