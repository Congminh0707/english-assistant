import { z } from 'zod'

export const DictSenseSchema = z.object({
  pos: z.string(),
  en: z.string(),
  vi: z.array(z.string())
})

export const DictExampleSchema = z.object({
  en: z.string(),
  vi: z.string().nullable()
})

/** Một mục từ hiển thị trong popup dịch nhanh */
export const DictEntrySchema = z.object({
  id: z.string(), // 'word:en:go'
  lemma: z.string(),
  pos: z.array(z.string()),
  ipaUs: z.string().nullable(),
  ipaUk: z.string().nullable(),
  level: z.string(),
  freqRank: z.number().nullable(),
  /** Các nghĩa tiếng Việt ngắn, phổ biến trước */
  vi: z.array(z.string()),
  /** Nghĩa tiếng Việt do AI sinh, chưa được người duyệt → hiện nhãn "AI" */
  viGenerated: z.boolean(),
  senses: z.array(DictSenseSchema),
  examples: z.array(DictExampleSchema),
  /** Cách tìm thấy: khớp từ gốc, khớp dạng đã chia (went → go), hay tìm kiếm (tiền tố / nghĩa tiếng Việt) */
  via: z.enum(['lemma', 'form', 'search']),
  /** Nhãn dạng từ khi via = 'form', vd ['past'] */
  formTags: z.array(z.string()),
  /** Người dùng đã lưu từ này chưa */
  saved: z.boolean()
})
export type DictEntry = z.infer<typeof DictEntrySchema>

export const QueryKindSchema = z.enum(['empty', 'word', 'phrase', 'sentence'])
export type QueryKind = z.infer<typeof QueryKindSchema>

export const LookupResultSchema = z.object({
  /** Chuỗi đã chuẩn hoá dùng để tra */
  query: z.string(),
  kind: QueryKindSchema,
  entries: z.array(DictEntrySchema),
  /** Chưa cài gói từ điển */
  packMissing: z.boolean()
})
export type LookupResult = z.infer<typeof LookupResultSchema>

export const SaveWordInputSchema = z.object({
  contentId: z.string().nullable(),
  text: z.string().trim().min(1).max(100),
  context: z.string().max(500).nullable().optional()
})
export type SaveWordInput = z.infer<typeof SaveWordInputSchema>

export const SaveWordResultSchema = z.object({
  /** Lần đầu lưu từ này */
  isNew: z.boolean(),
  /** Đã tạo thẻ ôn tập SRS mới */
  cardCreated: z.boolean()
})
export type SaveWordResult = z.infer<typeof SaveWordResultSchema>

/** Văn bản main gửi cho popup khi mở bằng phím tắt (lấy từ clipboard) */
export const PopupQuerySchema = z.object({ text: z.string() })

const MAX_QUERY = 200
/** Ký tự bao quanh cần bỏ: dấu câu, ngoặc, nháy (giữ nháy đơn/gạch nối ở giữa từ: don't, well-known) */
const EDGE_PUNCT = /^[\s"'“”‘’«»()[\]{}<>.,;:!?…\-–—*_#]+|[\s"'“”‘’«»()[\]{}<>.,;:!?…\-–—*_#]+$/g

/** Chuẩn hoá chuỗi người dùng copy để tra từ điển */
export function normalizeQuery(raw: string): { query: string; kind: QueryKind } {
  const query = raw
    .replace(/\s+/g, ' ')
    .replace(EDGE_PUNCT, '')
    .replace(/[’‘]/g, "'")
    .slice(0, MAX_QUERY)
    .trim()
  if (!query) return { query: '', kind: 'empty' }
  const words = query.split(' ').length
  return { query, kind: words === 1 ? 'word' : words <= 4 ? 'phrase' : 'sentence' }
}
