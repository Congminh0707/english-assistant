// Nghĩa tiếng Việt ngắn do LLM sinh cho từ chưa có nghĩa Việt từ Wiktionary (docs/08 §3, docs/09 §10.5).
// File curated: content/curated/vocab/vi-generated.json — khoá = word id, CÓ commit, duyệt qua PR.
// content:enrich vi ghi file này; stage merge đọc nó (chỉ dùng khi từ không có nghĩa Wiktionary).
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { Pos, Review, SourceRef, type ViMeaning } from '../../../src/shared/schemas/content'
import { ensureDir, readJson } from '../lib/io'
import { CURATED_DIR } from '../lib/paths'

export const VI_GENERATED_PATH = join(CURATED_DIR, 'vocab', 'vi-generated.json')

/** Số nghĩa tối đa / độ dài tối đa một nghĩa — "nghĩa ngắn" cho popup dịch và flashcard */
export const MAX_GENERATED_MEANINGS = 4
export const MAX_MEANING_CHARS = 60

export const GeneratedSourceRef = SourceRef.extend({
  id: z.literal('generated'),
  license: z.literal('proprietary-own'),
  /** '<model>@<YYYY-MM-DD>', vd 'claude-opus-5-5@2026-10-18' */
  generatedBy: z.string().regex(/^[\w.-]+@\d{4}-\d{2}-\d{2}$/)
})

export const GeneratedViEntry = z.object({
  /** Để người duyệt đọc file dễ + phát hiện id lệch lemma */
  lemma: z.string().min(1),
  meanings: z
    .array(
      z.object({
        text: z.string().min(1).max(MAX_MEANING_CHARS),
        pos: Pos.optional()
      })
    )
    .min(1)
    .max(MAX_GENERATED_MEANINGS),
  /** Độ tự tin model tự đánh giá — người duyệt ưu tiên xem 'low' trước */
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  /** Ghi chú của người duyệt (lý do sửa / từ chối) */
  note: z.string().optional(),
  /** true = THAY HẲN nghĩa Việt từ Wiktionary (đã duyệt lại vì nghĩa gốc sai/thiếu lịch sự, vd her → chỉ/bả); false/thiếu = chỉ bù khi từ không có nghĩa Wiktionary */
  replace: z.boolean().optional(),
  source: GeneratedSourceRef,
  /** draft = vừa sinh; ai_checked = đã qua bước kiểm tra tự động bằng AI; approved = người duyệt OK;
   * rejected = không dùng (và không sinh lại — xoá mục để sinh lại) */
  review: Review
})
export type GeneratedViEntry = z.infer<typeof GeneratedViEntry>

export const ViGeneratedFile = z.object({
  $comment: z.string().optional(),
  entries: z.record(z.string().regex(/^word:en:.+$/), GeneratedViEntry)
})
export type ViGeneratedFile = z.infer<typeof ViGeneratedFile>

const COMMENT =
  'Nghĩa tiếng Việt ngắn do LLM sinh (pnpm content:enrich vi) cho từ chưa có nghĩa Việt từ Wiktionary. ' +
  'Khoá = word id. Duyệt theo checklist ở docs/09-content-pipeline.md §10.5: sửa meanings nếu cần, ' +
  'đặt review.status = "approved" (hoặc "rejected"), review.by = tên người duyệt. ' +
  'Sửa xong: pnpm content:normalize merge level && pnpm content:build'

/** Đọc file curated (không có file → rỗng). Sai schema → lỗi, không âm thầm bỏ qua. */
export async function loadViGenerated(path = VI_GENERATED_PATH): Promise<ViGeneratedFile> {
  if (!existsSync(path)) return { $comment: COMMENT, entries: {} }
  const parsed = ViGeneratedFile.safeParse(await readJson<unknown>(path))
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`${path} does not match the schema:\n${issues}`)
  }
  return parsed.data
}

/** Ghi file: khoá sắp xếp theo id, mỗi mục một dòng → diff khi duyệt qua PR = một dòng / từ */
export async function saveViGenerated(
  file: ViGeneratedFile,
  path = VI_GENERATED_PATH
): Promise<void> {
  const lines = Object.entries(file.entries)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, entry]) => `    ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
  const body = lines.length ? `{\n${lines.join(',\n')}\n  }` : '{}'
  await ensureDir(dirname(path))
  await writeFile(
    path,
    `{\n  "$comment": ${JSON.stringify(COMMENT)},\n  "entries": ${body}\n}\n`,
    'utf8'
  )
}

/** Mục được đưa vào pack: chỉ nghĩa đã `approved` (draft/ai_checked chưa duyệt và rejected không bao giờ vào pack) */
export function isUsable(entry: GeneratedViEntry): boolean {
  return entry.review.status === 'approved'
}

export function toViMeanings(entry: GeneratedViEntry): ViMeaning[] {
  return entry.meanings.map((m) => ({
    text: m.text,
    ...(m.pos ? { pos: m.pos } : {}),
    origin: 'generated' as const
  }))
}
