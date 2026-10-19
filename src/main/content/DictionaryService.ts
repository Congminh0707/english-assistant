import type Database from 'better-sqlite3'
import type { Word } from '@shared/schemas/content'
import { normalizeQuery, type DictEntry, type LookupResult } from '@shared/schemas/dictionary'
import type { ContentPackService } from './ContentPackService'

export const DICTIONARY_PACK = 'core-dictionary'

const MAX_ENTRIES = 4
const MAX_VI = 6
const MAX_SENSES = 4
const MAX_EXAMPLES = 2

interface WordRow {
  id: string
  lemma: string
  lists: string
  level: string
  ipa_us: string | null
  ipa_uk: string | null
  vi_short: string | null
  freq_rank: number | null
  /** 1 = từ nhạy cảm (gói cũ chưa có cột này → undefined) */
  sensitive?: number
  data: string
}

/** Lọc theo hồ sơ: profile trẻ em không thấy từ nhạy cảm (tục, tình dục, xúc phạm...) */
export interface DictionaryOptions {
  childSafe?: boolean
}

/** Câu Tatoeba dùng cho bài tập */
export interface PracticeSentence {
  id: string
  en: string
  vi: string | null
  level: string
}

interface Hit {
  row: WordRow
  via: DictEntry['via']
  formTags: string[]
}

const BASE_COLS =
  'w.id, w.lemma, w.lists, w.level, w.ipa_us, w.ipa_uk, w.vi_short, w.freq_rank, w.data'

/** Nhãn biến tố thật (went → go, apples → apple), khác với cách viết khác (colour → color) */
const INFLECTION_TAGS = new Set([
  'past',
  'participle',
  'present',
  'plural',
  'third-person',
  'gerund',
  'comparative',
  'superlative'
])

/**
 * Tra từ điển offline trên pack core-dictionary (docs/11-ai-and-speech.md#2-dịch--tra-từ).
 * Thứ tự: 1) khớp từ gốc  2) khớp dạng đã chia (went → go)  3) FTS: tiền tố tiếng Anh / tra ngược tiếng Việt.
 * Cùng thuật toán với `pnpm content:lookup` (scripts/content/lookup.ts).
 */
export class DictionaryService {
  private statements: {
    db: Database.Database
    exact: Database.Statement
    forms: Database.Statement
    fts: Database.Statement
    sentences: Database.Statement
    /** Như `sentences` nhưng bỏ câu chứa từ nhạy cảm (profile trẻ em) */
    safeSentences: Database.Statement
    hasSensitive: boolean
    /** Danh sách cột SELECT: thêm w.sensitive nếu gói có cột này */
    cols: string
  } | null = null

  constructor(private readonly packs: ContentPackService) {}

  lookup(
    raw: string,
    isSaved: (contentIds: string[]) => Set<string> = () => new Set(),
    options: DictionaryOptions = {}
  ): LookupResult {
    const { query, kind } = normalizeQuery(raw)
    const stmts = this.prepare()
    if (!stmts) return { query, kind, entries: [], packMissing: true }
    if (kind === 'empty' || kind === 'sentence') {
      return { query, kind, entries: [], packMissing: false }
    }

    const hits = this.find(stmts, query).filter((h) => !isHidden(h.row, options))
    const saved = isSaved(hits.map((h) => h.row.id))
    const entries = hits
      .slice(0, MAX_ENTRIES)
      .map((hit) => this.toEntry(stmts, hit, saved, options))
    return { query, kind, entries, packMissing: false }
  }

  /**
   * Chọn ngẫu nhiên câu Tatoeba cho bài tập: đúng level, có bản dịch tiếng Việt (nếu cần), độ dài vừa phải.
   * Profile trẻ em: bỏ câu chứa từ nhạy cảm.
   */
  randomSentences(
    levels: string[],
    count: number,
    filter: { needVi?: boolean; minWords: number; maxWords: number },
    options: DictionaryOptions = {}
  ): PracticeSentence[] {
    const stmts = this.prepare()
    if (!stmts || !levels.length) return []
    const safe =
      options.childSafe && stmts.hasSensitive
        ? ` AND NOT EXISTS (SELECT 1 FROM sentence_words sw JOIN words w ON w.id = sw.word_id
              WHERE sw.sentence_id = s.id AND w.sensitive = 1)`
        : ''
    const rows = stmts.db
      .prepare(
        `SELECT s.id, s.en, s.vi, s.level FROM sentences s
         WHERE s.level IN (${levels.map(() => '?').join(',')})
         ${filter.needVi ? 'AND s.vi IS NOT NULL' : ''}
         AND length(s.en) BETWEEN 12 AND 90${safe}
         ORDER BY random() LIMIT ?`
      )
      .all(...levels, count * 6) as PracticeSentence[]
    const words = (text: string): number => text.split(' ').filter(Boolean).length
    return rows
      .filter((r) => {
        const n = words(r.en)
        return n >= filter.minWords && n <= filter.maxWords
      })
      .slice(0, count)
  }

  /** Mục từ khớp chính xác một lemma (chữ thường) — để biết loại từ của từ trong câu */
  wordByLemma(
    lemma: string
  ): { id: string; pos: string[]; level: string; freqRank: number | null } | null {
    const stmts = this.prepare()
    if (!stmts) return null
    const row = stmts.exact.get(lemma) as WordRow | undefined
    if (!row) return null
    return {
      id: row.id,
      pos: parseJson<{ pos?: string[] }>(row.data, {}).pos ?? [],
      level: row.level,
      freqRank: row.freq_rank
    }
  }

  /** Từ cùng loại từ, gần level, để làm đáp án nhiễu cho bài điền từ */
  distractorLemmas(
    pos: string,
    levels: string[],
    exclude: Set<string>,
    count: number,
    options: DictionaryOptions = {}
  ): string[] {
    const stmts = this.prepare()
    if (!stmts || !levels.length) return []
    const safe = options.childSafe && stmts.hasSensitive ? ' AND sensitive = 0' : ''
    const rows = stmts.db
      .prepare(
        `SELECT lemma FROM words
         WHERE pos LIKE ? AND level IN (${levels.map(() => '?').join(',')})
         AND (lists != '[]' OR freq_rank <= 6000)
         AND lemma GLOB '[a-z]*' AND lemma NOT GLOB '*[^a-z]*' AND length(lemma) >= 3${safe}
         ORDER BY random() LIMIT ?`
      )
      .all(`%"${pos}"%`, ...levels, count * 4 + 8) as { lemma: string }[]
    const out: string[] = []
    for (const { lemma } of rows) {
      if (exclude.has(lemma.toLowerCase())) continue
      exclude.add(lemma.toLowerCase())
      out.push(lemma)
      if (out.length === count) break
    }
    return out
  }

  /** Level của các mục từ (id → level); id không có trong gói bị bỏ qua */
  levelsOf(ids: string[]): Map<string, string> {
    const stmts = this.prepare()
    const out = new Map<string, string>()
    if (!stmts) return out
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400)
      const rows = stmts.db
        .prepare(`SELECT id, level FROM words WHERE id IN (${chunk.map(() => '?').join(',')})`)
        .all(...chunk) as { id: string; level: string }[]
      for (const r of rows) out.set(r.id, r.level)
    }
    return out
  }

  /** Đã cài gói từ điển chưa */
  available(): boolean {
    return this.prepare() !== null
  }

  /** Một mục từ theo id (dùng cho thẻ ôn tập / từ của khoảnh khắc) */
  entryById(id: string): DictEntry | null {
    const stmts = this.prepare()
    if (!stmts) return null
    const row = stmts.db.prepare(`SELECT ${stmts.cols} FROM words w WHERE w.id = ?`).get(id) as
      WordRow | undefined
    return row ? this.toEntry(stmts, { row, via: 'lemma', formTags: [] }, new Set()) : null
  }

  /**
   * Dữ liệu câu hỏi trắc nghiệm cho một từ: nghĩa đúng + tối đa 3 nghĩa nhiễu của từ khác cùng level
   * (khác nghĩa đúng, không trùng nhau). null nếu từ không có nghĩa tiếng Việt.
   */
  quizData(
    id: string,
    options: DictionaryOptions = {}
  ): { entry: DictEntry; correct: string; distractors: string[] } | null {
    const entry = this.entryById(id)
    const correct = entry?.vi[0]
    if (!entry || !correct) return null
    const stmts = this.prepare()!
    const safe = options.childSafe && stmts.hasSensitive ? ' AND sensitive = 0' : ''
    const pick = (sql: string, ...params: unknown[]): string[] =>
      (stmts.db.prepare(sql).all(...params) as { vi_short: string }[]).map(
        (r) => r.vi_short.split(/\s*;\s*/)[0]
      )
    const pool = [
      ...pick(
        `SELECT vi_short FROM words WHERE level = ? AND vi_short IS NOT NULL AND id != ?${safe}
         ORDER BY random() LIMIT 30`,
        entry.level,
        id
      ),
      ...pick(
        `SELECT vi_short FROM words WHERE vi_short IS NOT NULL AND id != ? AND freq_rank <= 5000${safe}
         ORDER BY random() LIMIT 30`,
        id
      )
    ]
    const taken = new Set([correct.toLowerCase(), ...entry.vi.map((v) => v.toLowerCase())])
    const distractors: string[] = []
    for (const text of pool) {
      const key = text.toLowerCase()
      if (!text || taken.has(key)) continue
      taken.add(key)
      distractors.push(text)
      if (distractors.length === 3) break
    }
    return { entry, correct, distractors }
  }

  /** Chọn ngẫu nhiên một từ có nghĩa tiếng Việt, thuộc danh sách từ chuẩn, ở các level cho trước */
  randomWord(
    levels: string[],
    exclude: Set<string>,
    options: DictionaryOptions = {}
  ): DictEntry | null {
    const stmts = this.prepare()
    if (!stmts || !levels.length) return null
    const safe = options.childSafe && stmts.hasSensitive ? ' AND sensitive = 0' : ''
    const rows = stmts.db
      .prepare(
        `SELECT id FROM words WHERE level IN (${levels.map(() => '?').join(',')})
         AND vi_short IS NOT NULL AND lists != '[]'${safe} ORDER BY random() LIMIT 40`
      )
      .all(...levels) as { id: string }[]
    const id = rows.find((r) => !exclude.has(r.id))?.id
    return id ? this.entryById(id) : null
  }

  private prepare(): NonNullable<DictionaryService['statements']> | null {
    const db = this.packs.db(DICTIONARY_PACK)
    if (!db) return null
    if (this.statements?.db === db) return this.statements
    const hasSensitive = (db.pragma('table_info(words)') as { name: string }[]).some(
      (c) => c.name === 'sensitive'
    )
    const COLS = hasSensitive ? `${BASE_COLS}, w.sensitive` : BASE_COLS
    this.statements = {
      db,
      cols: COLS,
      hasSensitive,
      exact: db.prepare(
        `SELECT ${COLS} FROM words w WHERE w.lemma = ? COLLATE NOCASE ORDER BY w.freq_rank`
      ),
      forms: db.prepare(
        `SELECT ${COLS}, f.tags FROM word_forms f JOIN words w ON w.id = f.word_id
         WHERE f.form = ? ORDER BY w.freq_rank`
      ),
      fts: db.prepare(
        `SELECT ${COLS}, words_fts.vi_meanings AS vi_all FROM words_fts
         JOIN words w ON w.id = words_fts.word_id
         WHERE words_fts MATCH ? ORDER BY bm25(words_fts) LIMIT 50`
      ),
      sentences: db.prepare(
        `SELECT s.en, s.vi FROM sentence_words sw JOIN sentences s ON s.id = sw.sentence_id
         WHERE sw.word_id = ? ORDER BY s.vi IS NULL, length(s.en) LIMIT 3`
      ),
      safeSentences: db.prepare(
        hasSensitive
          ? `SELECT s.en, s.vi FROM sentence_words sw JOIN sentences s ON s.id = sw.sentence_id
             WHERE sw.word_id = ? AND NOT EXISTS (
               SELECT 1 FROM sentence_words x JOIN words w ON w.id = x.word_id
               WHERE x.sentence_id = s.id AND w.sensitive = 1)
             ORDER BY s.vi IS NULL, length(s.en) LIMIT 3`
          : 'SELECT 1 WHERE 0'
      )
    }
    return this.statements
  }

  private find(stmts: NonNullable<DictionaryService['statements']>, query: string): Hit[] {
    const exact = (stmts.exact.all(query) as WordRow[]).map((row) => ({
      row,
      via: 'lemma' as const,
      formTags: [] as string[]
    }))
    const forms = (stmts.forms.all(query.toLowerCase()) as (WordRow & { tags: string })[])
      .filter((f) => !exact.some((e) => e.row.id === f.id))
      .map((row) => ({ row, via: 'form' as const, formTags: parseJson<string[]>(row.tags, []) }))
    if (exact.length || forms.length) {
      // Từ tra vừa có mục riêng vừa là dạng biến tố của từ gốc khác (came → come, apples → apple):
      // mục riêng không thuộc danh sách từ chuẩn nào thường chỉ mang nghĩa hiếm (came = thanh chì ghép kính)
      // → hiện từ gốc trước. Mục riêng có trong NGSL/CEFR-J... (left, used) vẫn đứng đầu.
      const inflected = forms.filter((h) => h.formTags.some((t) => INFLECTION_TAGS.has(t)))
      const otherForms = forms.filter((h) => !inflected.includes(h))
      const strong = exact.filter((h) => parseJson<string[]>(h.row.lists, []).length > 0)
      const weak = exact.filter((h) => !strong.includes(h))
      return inflected.length
        ? [...strong, ...inflected, ...weak, ...otherForms]
        : [...exact, ...forms]
    }

    // Không khớp tiếng Anh → tìm theo nghĩa tiếng Việt (bỏ dấu được: 'tao' khớp 'táo')
    // hoặc tiền tố tiếng Anh. Xếp hạng: nghĩa trùng nguyên văn > chứa đúng cụm > còn lại; rồi theo tần suất.
    const phrase = `"${query.replace(/"/g, '')}"`
    let rows: (WordRow & { vi_all: string })[]
    try {
      rows = stmts.fts.all(`vi_meanings : ${phrase} OR lemma : ${phrase}*`) as typeof rows
    } catch {
      return [] // cú pháp FTS không hợp lệ với một số ký tự đặc biệt
    }
    const needle = query.toLowerCase()
    const score = (r: WordRow & { vi_all: string }): number => {
      const meanings = r.vi_all.toLowerCase().split(' ; ')
      if (meanings.includes(needle)) return 2
      return meanings.some((m) => ` ${m} `.includes(` ${needle} `)) ? 1 : 0
    }
    return rows
      .map((row) => ({ row, s: score(row) }))
      .sort((a, b) => b.s - a.s || (a.row.freq_rank ?? 1e9) - (b.row.freq_rank ?? 1e9))
      .slice(0, MAX_ENTRIES)
      .map(({ row }) => ({ row, via: 'search' as const, formTags: [] }))
  }

  private toEntry(
    stmts: NonNullable<DictionaryService['statements']>,
    { row, via, formTags }: Hit,
    saved: Set<string>,
    options: DictionaryOptions = {}
  ): DictEntry {
    const word = parseJson<Partial<Word>>(row.data, {})
    const viMeanings = word.vi ?? []
    const vi = unique([
      ...viMeanings.map((m) => m.text),
      ...(row.vi_short ? row.vi_short.split(/\s*;\s*/) : [])
    ]).slice(0, MAX_VI)

    // Ưu tiên nghĩa có bản dịch tiếng Việt, giữ thứ tự gốc
    const senses = [...(word.senses ?? [])]
      .sort((a, b) => Number(b.vi.length > 0) - Number(a.vi.length > 0))
      .slice(0, MAX_SENSES)
      .map((s) => ({ pos: s.pos, en: s.en, vi: s.vi }))

    return {
      id: row.id,
      lemma: row.lemma,
      pos: word.pos ?? [],
      ipaUs: row.ipa_us,
      ipaUk: row.ipa_uk,
      level: row.level,
      freqRank: row.freq_rank,
      vi,
      viGenerated: viMeanings.length > 0 && viMeanings.every((m) => m.origin === 'generated'),
      senses,
      examples: this.examples(stmts, row.id, word, options),
      via,
      formTags,
      saved: saved.has(row.id)
    }
  }

  private examples(
    stmts: NonNullable<DictionaryService['statements']>,
    id: string,
    word: Partial<Word>,
    options: DictionaryOptions = {}
  ): DictEntry['examples'] {
    const out = (word.examples ?? []).map((e) => ({ en: e.en, vi: e.vi ?? null }))
    if (out.length < MAX_EXAMPLES) {
      const rows = (
        options.childSafe && stmts.hasSensitive ? stmts.safeSentences : stmts.sentences
      ).all(id) as { en: string; vi: string | null }[]
      for (const s of rows) {
        if (!out.some((o) => o.en === s.en)) out.push({ en: s.en, vi: s.vi })
      }
    }
    // Ưu tiên câu có bản dịch tiếng Việt
    return out.sort((a, b) => Number(!!b.vi) - Number(!!a.vi)).slice(0, MAX_EXAMPLES)
  }
}

function isHidden(row: WordRow, options: DictionaryOptions): boolean {
  return !!options.childSafe && row.sensitive === 1
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

const unique = (items: string[]): string[] => [
  ...new Set(items.map((s) => s.trim()).filter(Boolean))
]
