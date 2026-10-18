import { z } from 'zod'
import { LevelCode, Track } from './level'

// Chính sách license — docs/08-content-sources.md §1.2.
// Mã cụ thể (vd 'CC-BY-SA-4.0') phải khớp một mẫu cho phép và không khớp mẫu cấm.
const ALLOWED_LICENSE_PATTERNS: readonly RegExp[] = [
  /^PD$/,
  /^CC0(-1\.0)?$/,
  /^CC-BY-\d\.\d(-[A-Z]{2})?$/,
  /^CC-BY-SA-\d\.\d(-[A-Z]{2})?$/,
  /^MIT$/,
  /^Apache-2\.0$/,
  /^BSD-[\w.-]+$/,
  /^WordNet$/,
  /^CEFR-J$/,
  /^proprietary-own$/,
  /^embed-only$/
]
const FORBIDDEN_LICENSE_PATTERNS: readonly RegExp[] = [/-NC\b/, /-ND\b/, /^GPL/, /^AGPL/]

export function isAllowedLicense(license: string): boolean {
  if (FORBIDDEN_LICENSE_PATTERNS.some((re) => re.test(license))) return false
  return ALLOWED_LICENSE_PATTERNS.some((re) => re.test(license))
}

/** License có điều khoản share-alike → pack chứa nó phải mang CC BY-SA. */
export function isShareAlike(license: string): boolean {
  return /^CC-BY-SA-/.test(license)
}

export const SourceRef = z.object({
  /** 'tatoeba' | 'ngsl' | 'wiktionary' | 'generated' | 'original' ... */
  id: z.string().min(1),
  url: z.url().optional(),
  author: z.string().optional(),
  license: z.string().refine(isAllowedLicense, { message: 'license not in allowlist' }),
  /** vd 'claude-sonnet-5-5@2026-10-18' — chỉ có khi id = 'generated' */
  generatedBy: z.string().optional()
})
export type SourceRef = z.infer<typeof SourceRef>

export const ReviewStatus = z.enum(['draft', 'ai_checked', 'approved', 'rejected'])
export type ReviewStatus = z.infer<typeof ReviewStatus>

export const Review = z.object({
  status: ReviewStatus,
  by: z.string().optional()
})

/** Trường dùng chung cho mọi bản ghi nội dung — docs/09-content-pipeline.md §3.1 */
export const Meta = z.object({
  /** Id chuỗi ổn định dạng 'kind:namespace:key', vd 'word:en:apple' */
  id: z.string().regex(/^[a-z]+:[a-z0-9-]+:.+$/),
  level: LevelCode,
  /** Rỗng = mọi track */
  tracks: z.array(Track).default([]),
  topics: z.array(z.string()).default([]),
  source: SourceRef,
  review: Review
})
export type Meta = z.infer<typeof Meta>

/** Một nguồn trong bảng `sources` của content.db → sinh LICENSES.md và màn hình ghi công. */
export const SourceInfo = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.url(),
  license: z.string().refine(isAllowedLicense, { message: 'license not in allowlist' }),
  licenseUrl: z.url().optional(),
  /** Câu ghi công / trích dẫn đúng như tác giả yêu cầu */
  attribution: z.string().min(1)
})
export type SourceInfo = z.infer<typeof SourceInfo>
