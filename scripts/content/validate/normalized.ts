// QA tự động cho dữ liệu đã chuẩn hoá (docs/09-content-pipeline.md §7):
// schema zod, license trong allowlist, nguồn có trong danh mục, không trùng lặp, tham chiếu hợp lệ.
import { existsSync } from 'node:fs'
import type { z } from 'zod'
import {
  Deck,
  Sentence,
  Word,
  isAllowedLicense,
  type SourceRef
} from '../../../src/shared/schemas/content'
import { readJsonl } from '../lib/io'
import { normalizedPath } from '../lib/paths'
import { isSourceId } from '../sources'

export interface ValidationResult {
  errors: string[]
  counts: { words: number; sentences: number; decks: number }
  /** Id nguồn thực sự được dùng → bảng `sources` của pack */
  sourceIds: Set<string>
}

const MAX_ERRORS = 200

export async function validateNormalized(): Promise<ValidationResult> {
  const errors: string[] = []
  const sourceIds = new Set<string>()
  const err = (msg: string): void => {
    if (errors.length < MAX_ERRORS) errors.push(msg)
    else if (errors.length === MAX_ERRORS) errors.push('… (more errors truncated)')
  }
  const checkSource = (where: string, ref: SourceRef): void => {
    if (!isSourceId(ref.id))
      err(
        `${where}: unknown source id "${ref.id}" (declare it in scripts/content/sources.ts + docs/08)`
      )
    if (!isAllowedLicense(ref.license)) err(`${where}: license "${ref.license}" not allowed`)
    sourceIds.add(ref.id)
  }

  async function load<T extends z.ZodType>(file: string, schema: T): Promise<z.infer<T>[]> {
    const path = normalizedPath(file)
    if (!existsSync(path)) {
      err(`${file}: missing — run pnpm content:normalize`)
      return []
    }
    const out: z.infer<T>[] = []
    let line = 0
    for await (const raw of readJsonl<unknown>(path)) {
      line++
      const r = schema.safeParse(raw)
      if (!r.success) {
        const id = (raw as { id?: string }).id ?? `line ${line}`
        err(
          `${file} ${id}: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
        )
      } else out.push(r.data)
    }
    return out
  }

  const words = await load('words.jsonl', Word)
  const sentences = await load('sentences.jsonl', Sentence)
  const decks = await load('decks.jsonl', Deck)

  // Trùng lặp id (mọi loại dùng chung không gian id)
  const ids = new Set<string>()
  for (const r of [...words, ...sentences, ...decks]) {
    if (ids.has(r.id)) err(`duplicate id ${r.id}`)
    ids.add(r.id)
  }
  // Trùng lặp nội dung: lemma trùng (khác hoa/thường), câu trùng sau khi chuẩn hoá
  const lemmas = new Map<string, string>()
  for (const w of words) {
    const k = w.lemma.toLowerCase()
    if (lemmas.has(k)) err(`duplicate lemma "${w.lemma}" (${lemmas.get(k)} vs ${w.id})`)
    lemmas.set(k, w.id)
  }
  const texts = new Map<string, string>()
  for (const s of sentences) {
    const k = s.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
    if (texts.has(k)) err(`duplicate sentence text ${s.id} = ${texts.get(k)}`)
    texts.set(k, s.id)
  }

  // Nguồn & tham chiếu
  const wordIds = new Set(words.map((w) => w.id))
  const sentenceIds = new Set(sentences.map((s) => s.id))
  for (const w of words) {
    checkSource(w.id, w.source)
    for (const a of w.attributions) checkSource(`${w.id} attribution`, a)
    for (const ex of w.examples) {
      if (ex.sourceId.startsWith('tatoeba:') && !sentenceIds.has(`sentence:${ex.sourceId}`))
        err(`${w.id}: example ${ex.sourceId} not in sentences`)
    }
    if (!w.senses.length && !w.vi.length) err(`${w.id}: no meaning (no senses, no vi)`)
  }
  for (const s of sentences) {
    checkSource(s.id, s.source)
    for (const t of s.translations) checkSource(`${s.id} translation`, t.source)
    for (const id of s.wordIds) if (!wordIds.has(id)) err(`${s.id}: unknown word ${id}`)
  }
  for (const d of decks) {
    checkSource(d.id, d.source)
    for (const id of d.wordIds) if (!wordIds.has(id)) err(`${d.id}: unknown word ${id}`)
    if (new Set(d.wordIds).size !== d.wordIds.length) err(`${d.id}: duplicate word ids`)
  }

  return {
    errors,
    counts: { words: words.length, sentences: sentences.length, decks: decks.length },
    sourceIds
  }
}
