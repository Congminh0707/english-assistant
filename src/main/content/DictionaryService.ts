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
  data: string
}

interface Hit {
  row: WordRow
  via: DictEntry['via']
  formTags: string[]
}

const COLS = 'w.id, w.lemma, w.lists, w.level, w.ipa_us, w.ipa_uk, w.vi_short, w.freq_rank, w.data'

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
  } | null = null

  constructor(private readonly packs: ContentPackService) {}

  lookup(
    raw: string,
    isSaved: (contentIds: string[]) => Set<string> = () => new Set()
  ): LookupResult {
    const { query, kind } = normalizeQuery(raw)
    const stmts = this.prepare()
    if (!stmts) return { query, kind, entries: [], packMissing: true }
    if (kind === 'empty' || kind === 'sentence') {
      return { query, kind, entries: [], packMissing: false }
    }

    const hits = this.find(stmts, query)
    const saved = isSaved(hits.map((h) => h.row.id))
    const entries = hits.slice(0, MAX_ENTRIES).map((hit) => this.toEntry(stmts, hit, saved))
    return { query, kind, entries, packMissing: false }
  }

  /** Một mục từ theo id (dùng cho thẻ ôn tập / từ của khoảnh khắc) */
  entryById(id: string): DictEntry | null {
    const stmts = this.prepare()
    if (!stmts) return null
    const row = stmts.db.prepare(`SELECT ${COLS} FROM words w WHERE w.id = ?`).get(id) as
      WordRow | undefined
    return row ? this.toEntry(stmts, { row, via: 'lemma', formTags: [] }, new Set()) : null
  }

  /**
   * Dữ liệu câu hỏi trắc nghiệm cho một từ: nghĩa đúng + tối đa 3 nghĩa nhiễu của từ khác cùng level
   * (khác nghĩa đúng, không trùng nhau). null nếu từ không có nghĩa tiếng Việt.
   */
  quizData(id: string): { entry: DictEntry; correct: string; distractors: string[] } | null {
    const entry = this.entryById(id)
    const correct = entry?.vi[0]
    if (!entry || !correct) return null
    const stmts = this.prepare()!
    const pick = (sql: string, ...params: unknown[]): string[] =>
      (stmts.db.prepare(sql).all(...params) as { vi_short: string }[]).map(
        (r) => r.vi_short.split(/\s*;\s*/)[0]
      )
    const pool = [
      ...pick(
        `SELECT vi_short FROM words WHERE level = ? AND vi_short IS NOT NULL AND id != ?
         ORDER BY random() LIMIT 30`,
        entry.level,
        id
      ),
      ...pick(
        `SELECT vi_short FROM words WHERE vi_short IS NOT NULL AND id != ? AND freq_rank <= 5000
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
  randomWord(levels: string[], exclude: Set<string>): DictEntry | null {
    const stmts = this.prepare()
    if (!stmts || !levels.length) return null
    const rows = stmts.db
      .prepare(
        `SELECT id FROM words WHERE level IN (${levels.map(() => '?').join(',')})
         AND vi_short IS NOT NULL AND lists != '[]' ORDER BY random() LIMIT 40`
      )
      .all(...levels) as { id: string }[]
    const id = rows.find((r) => !exclude.has(r.id))?.id
    return id ? this.entryById(id) : null
  }

  private prepare(): NonNullable<DictionaryService['statements']> | null {
    const db = this.packs.db(DICTIONARY_PACK)
    if (!db) return null
    if (this.statements?.db === db) return this.statements
    this.statements = {
      db,
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
    saved: Set<string>
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
      examples: this.examples(stmts, row.id, word),
      via,
      formTags,
      saved: saved.has(row.id)
    }
  }

  private examples(
    stmts: NonNullable<DictionaryService['statements']>,
    id: string,
    word: Partial<Word>
  ): DictEntry['examples'] {
    const out = (word.examples ?? []).map((e) => ({ en: e.en, vi: e.vi ?? null }))
    if (out.length < MAX_EXAMPLES) {
      for (const s of stmts.sentences.all(id) as { en: string; vi: string | null }[]) {
        if (!out.some((o) => o.en === s.en)) out.push({ en: s.en, vi: s.vi })
      }
    }
    // Ưu tiên câu có bản dịch tiếng Việt
    return out.sort((a, b) => Number(!!b.vi) - Number(!!a.vi)).slice(0, MAX_EXAMPLES)
  }
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
