import { z } from 'zod'
import { Meta, SourceRef } from './source'

export const POS_VALUES = [
  'noun',
  'proper_noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'determiner',
  'article',
  'preposition',
  'conjunction',
  'interjection',
  'numeral',
  'particle',
  'contraction',
  'abbreviation',
  'phrase'
] as const
export const Pos = z.enum(POS_VALUES)
export type Pos = z.infer<typeof Pos>

/** Danh sách từ mà từ này thuộc về (dùng để lọc theo kỳ thi / bộ từ) */
export const WORD_LISTS = ['ngsl', 'ngsl-sup', 'tsl', 'cefrj', 'octanove'] as const
export const WordList = z.enum(WORD_LISTS)
export type WordList = z.infer<typeof WordList>

export const Ipa = z.object({
  us: z.string().optional(),
  uk: z.string().optional()
})

export const Example = z.object({
  en: z.string().min(1),
  vi: z.string().optional(),
  /** 'tatoeba:12345' (→ sentences.id = 'sentence:tatoeba:12345') hoặc 'wiktionary' */
  sourceId: z.string()
})
export type Example = z.infer<typeof Example>

export const Sense = z.object({
  /** Ổn định trong một từ: 's1', 's2'... theo thứ tự nguồn */
  id: z.string(),
  pos: Pos,
  /** Định nghĩa tiếng Anh */
  en: z.string().min(1),
  /** Nghĩa tiếng Việt gán được cho đúng nghĩa này (nếu có) */
  vi: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  examples: z.array(Example).default([])
})
export type Sense = z.infer<typeof Sense>

/** Một nghĩa tiếng Việt ở cấp từ (chưa gán chắc chắn vào sense nào) */
export const ViMeaning = z.object({
  text: z.string().min(1),
  pos: Pos.optional(),
  /** Nhãn nghĩa tiếng Anh của bảng dịch trên Wiktionary, vd 'fruit' */
  senseHint: z.string().optional(),
  /**
   * 'wiktionary' = bảng dịch của mục từ tiếng Anh;
   * 'wiktionary-vi' = suy ngược từ mục từ tiếng Việt có định nghĩa đúng bằng từ này;
   * 'generated' = LLM sinh (cần duyệt)
   */
  origin: z.enum(['wiktionary', 'wiktionary-vi', 'generated'])
})
export type ViMeaning = z.infer<typeof ViMeaning>

export const WordForm = z.object({
  form: z.string().min(1),
  /** Nhãn kiểu Wiktionary: 'plural', 'past', 'participle', 'third-person', 'comparative'... */
  tags: z.array(z.string()).default([])
})
export type WordForm = z.infer<typeof WordForm>

/** Mục từ — docs/09-content-pipeline.md §3.2 */
export const Word = Meta.extend({
  lemma: z.string().min(1),
  pos: z.array(Pos).min(1),
  ipa: Ipa,
  senses: z.array(Sense),
  vi: z.array(ViMeaning).default([]),
  /** Nghĩa tiếng Việt ngắn gọn để hiển thị nhanh (popup dịch), vd 'đi; ra đi' */
  viShort: z.string().optional(),
  forms: z.array(WordForm).default([]),
  /** Câu ví dụ chứa từ (không gắn với nghĩa cụ thể) — chủ yếu từ Tatoeba; xem thêm bảng sentence_words */
  examples: z.array(Example).default([]),
  lists: z.array(WordList).default([]),
  /** Thứ hạng tần suất gộp: NGSL rank (1–2809) rồi tới tần suất trong Tatoeba */
  freqRank: z.number().int().positive().optional(),
  /** Level CEFR gốc từ CEFR-J/Octanove (nếu có), vd 'A2' */
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  /** Mọi nguồn đóng góp vào bản ghi (source chính nằm ở `source`) */
  attributions: z.array(SourceRef).default([])
})
export type Word = z.infer<typeof Word>
