import { z } from 'zod'
import { LevelCode, Track } from './level'
import { LocalizedText } from './deck'

/** Phiên bản cấu trúc content.db — app từ chối pack có schemaVersion lớn hơn mức nó hiểu. */
export const CONTENT_SCHEMA_VERSION = 1

/** manifest.json trong file .eapack — docs/09-content-pipeline.md §8 */
export const PackManifest = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  schemaVersion: z.number().int().positive(),
  title: LocalizedText,
  levels: z.array(LevelCode),
  tracks: z.array(Track),
  /** License của cả pack, vd 'CC-BY-SA-4.0' — chi tiết từng nguồn ở LICENSES.md */
  license: z.string(),
  requires: z.array(z.string()).default([]),
  builtAt: z.string(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
  /** Kích thước & sha256 của content.db (zip chứa manifest nên không tự băm chính nó được) */
  files: z.array(
    z.object({ path: z.string(), sizeBytes: z.number().int(), sha256: z.string().length(64) })
  )
})
export type PackManifest = z.infer<typeof PackManifest>
