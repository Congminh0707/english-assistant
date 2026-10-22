// Gắn level cho từ & câu, sinh decks:
//   words.base.jsonl + sentences.base.jsonl → words.jsonl, sentences.jsonl, decks.jsonl
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  LEVEL_CODES,
  levelIndex,
  type Deck,
  type LevelCode,
  type Sentence,
  type Word
} from '../../../src/shared/schemas/content'
import { log, JsonlWriter, readJson, readJsonl, requireFile, writeJson } from '../lib/io'
import { CURATED_DIR, normalizedPath } from '../lib/paths'
import { tokenVariants } from '../lib/text'
import type { BaseSentence, BaseWord } from '../normalize/merge'
import type { WordlistsFile } from '../normalize/wordlists'
import { sourceRef } from '../sources'
import { SENTENCE_COVERAGE, suggestWordLevel } from './thresholds'

export const LEVEL_OVERRIDES_PATH = join(CURATED_DIR, 'vocab', 'level-overrides.json')
/** Từ có freqRank ≤ giá trị này mà thiếu nghĩa Việt thì vào missing-vi.json (từ 1.3.0: toàn bộ từ, xếp theo tần suất) */
const MISSING_VI_TOP = Number.POSITIVE_INFINITY

const LEVEL_NAMES: Record<LevelCode, { vi: string; en: string }> = {
  PA1_1: { vi: 'Hạt mầm', en: 'Seed' },
  PA1_2: { vi: 'Chồi non', en: 'Sprout' },
  A1_1: { vi: 'Gà con', en: 'Chick' },
  A1_2: { vi: 'Chim non', en: 'Fledgling' },
  A2_1: { vi: 'Cáo nhỏ', en: 'Little Fox' },
  A2_2: { vi: 'Cáo nhanh', en: 'Swift Fox' },
  B1_1: { vi: 'Cú học giả', en: 'Scholar Owl' },
  B1_2: { vi: 'Cú thông thái', en: 'Wise Owl' },
  B2_1: { vi: 'Sói bạc', en: 'Silver Wolf' },
  B2_2: { vi: 'Sói đầu đàn', en: 'Alpha Wolf' },
  C1: { vi: 'Rồng', en: 'Dragon' },
  C2: { vi: 'Rồng huyền thoại', en: 'Legendary Dragon' }
}

const levelLabel = (l: LevelCode): string => l.replace('_', '.')

export interface LevelReport {
  words: Record<LevelCode, number>
  sentences: Record<LevelCode, number>
  overrides: number
  decks: number
}

function emptyCounts(): Record<LevelCode, number> {
  return Object.fromEntries(LEVEL_CODES.map((l) => [l, 0])) as Record<LevelCode, number>
}

export async function applyLevels(): Promise<LevelReport> {
  requireFile(normalizedPath('words.base.jsonl'), 'pnpm content:normalize')
  const lists = await readJson<WordlistsFile>(normalizedPath('wordlists.json'))
  const overrides: Record<string, LevelCode> = existsSync(LEVEL_OVERRIDES_PATH)
    ? ((await readJson<{ levels?: Record<string, LevelCode> }>(LEVEL_OVERRIDES_PATH)).levels ?? {})
    : {}
  const report: LevelReport = {
    words: emptyCounts(),
    sentences: emptyCounts(),
    overrides: 0,
    decks: 0
  }

  // ---- Từ ----
  const wordLevel = new Map<string, LevelCode>()
  const words: Word[] = []
  for await (const w of readJsonl<BaseWord>(normalizedPath('words.base.jsonl'))) {
    const key = w.id.slice('word:en:'.length)
    const l = lists[key]
    let level = suggestWordLevel({
      cefr: w.cefr,
      lists: w.lists,
      freqRank: w.freqRank,
      ngslRank: l?.ngslRank,
      tslRank: l?.tslRank
    })
    if (overrides[w.id]) {
      level = overrides[w.id]
      report.overrides++
    }
    wordLevel.set(key, level)
    words.push({ ...w, level })
  }
  // Dạng rút gọn ngoài danh sách (don't, it's) lấy level của từ gốc (do, it) thay vì C1/C2
  for (const w of words) {
    if (w.lists.length || overrides[w.id] || !w.lemma.includes("'")) continue
    const base = tokenVariants(w.lemma.toLowerCase())[1]
    const baseLevel = base ? wordLevel.get(base) : undefined
    if (baseLevel && levelIndex(baseLevel) < levelIndex(w.level)) {
      w.level = baseLevel
      wordLevel.set(w.id.slice('word:en:'.length), baseLevel)
    }
  }
  for (const w of words) report.words[w.level]++
  const wOut = new JsonlWriter(normalizedPath('words.jsonl'))
  for (const w of words) await wOut.write(w)
  await wOut.close()

  // ---- Câu: độ phủ từ vựng ----
  const sOut = new JsonlWriter(normalizedPath('sentences.jsonl'))
  for await (const s of readJsonl<BaseSentence>(normalizedPath('sentences.base.jsonl'))) {
    const tokenLevels: number[] = []
    for (const lemmas of s.tokenLemmas) {
      if (lemmas[0] === '#name') continue
      // Token không có trong từ điển → coi như C2
      const idx = lemmas.length
        ? Math.min(...lemmas.map((k) => levelIndex(wordLevel.get(k) ?? 'C2')))
        : levelIndex('C2')
      tokenLevels.push(idx)
    }
    tokenLevels.sort((a, b) => a - b)
    const at = Math.max(0, Math.ceil(tokenLevels.length * SENTENCE_COVERAGE) - 1)
    // Câu ví dụ không thấp hơn A1_1 (chưa có bộ từ mầm non)
    const level = LEVEL_CODES[Math.max(levelIndex('A1_1'), tokenLevels[at] ?? 0)]
    report.sentences[level]++
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tokenLemmas, ...rest } = s
    const sentence: Sentence = {
      ...rest,
      level,
      tracks: [],
      topics: [],
      review: { status: 'draft', by: 'pipeline' }
    }
    await sOut.write(sentence)
  }
  await sOut.close()

  // ---- Decks ----
  const decks: Deck[] = []
  const byRank = (a: Word, b: Word): number =>
    (a.freqRank ?? 1e9) - (b.freqRank ?? 1e9) || (a.id < b.id ? -1 : 1)
  for (const level of LEVEL_CODES) {
    const ids = words
      .filter((w) => w.level === level && w.lists.length)
      .sort(byRank)
      .map((w) => w.id)
    if (!ids.length) continue
    const name = LEVEL_NAMES[level]
    decks.push({
      id: `deck:level:${level.toLowerCase().replace('_', '-')}`,
      kind: 'level',
      level,
      tracks: [],
      topics: [],
      title: {
        vi: `Từ vựng ${levelLabel(level)} — ${name.vi}`,
        en: `${levelLabel(level)} vocabulary — ${name.en}`
      },
      wordIds: ids,
      source: sourceRef('english-assistant'),
      review: { status: 'draft', by: 'pipeline' }
    })
  }
  const maxLevel = (ws: Word[]): LevelCode =>
    LEVEL_CODES[Math.max(...ws.map((w) => levelIndex(w.level)))]
  const ngsl = words.filter((w) => w.lists.includes('ngsl')).sort(byRank)
  decks.push({
    id: 'deck:list:ngsl',
    kind: 'list',
    level: maxLevel(ngsl),
    tracks: [],
    topics: [],
    title: { vi: 'NGSL — 2.800 từ phổ biến nhất', en: 'NGSL — the 2,800 most useful words' },
    wordIds: ngsl.map((w) => w.id),
    source: sourceRef('ngsl'),
    review: { status: 'draft', by: 'pipeline' }
  })
  const tsl = words
    .filter((w) => w.lists.includes('tsl'))
    .sort((a, b) => (lists[a.id.slice(8)]?.tslRank ?? 1e9) - (lists[b.id.slice(8)]?.tslRank ?? 1e9))
  decks.push({
    id: 'deck:exam:toeic-tsl',
    kind: 'exam',
    level: maxLevel(tsl),
    tracks: ['toeic'],
    topics: ['business'],
    title: { vi: 'TOEIC — từ vựng đặc trưng (TSL)', en: 'TOEIC Service List (TSL)' },
    wordIds: tsl.map((w) => w.id),
    source: sourceRef('tsl'),
    review: { status: 'draft', by: 'pipeline' }
  })
  const dOut = new JsonlWriter(normalizedPath('decks.jsonl'))
  for (const d of decks) await dOut.write(d)
  await dOut.close()
  report.decks = decks.length

  // Danh sách việc cho bước sinh nghĩa tiếng Việt bằng LLM (docs/08 §3, content:enrich vi): từ phổ biến
  // không có nghĩa Việt từ Wiktionary. Từ đã có nghĩa sinh (origin 'generated') vẫn nằm trong danh sách
  // (generated: true) để danh sách ổn định; content:enrich bỏ qua từ đã có mục trong file curated.
  const missingVi = words
    .filter(
      (w) =>
        (w.freqRank ?? Infinity) <= MISSING_VI_TOP && w.vi.every((v) => v.origin === 'generated')
    )
    .sort(byRank)
    .map((w) => ({
      id: w.id,
      lemma: w.lemma,
      pos: w.pos,
      level: w.level,
      freqRank: w.freqRank,
      generated: w.vi.length > 0
    }))
  const generatedCount = missingVi.filter((w) => w.generated).length
  await writeJson(normalizedPath('missing-vi.json'), {
    $comment: `Words (sorted by freqRank) that have no Vietnamese meaning from Wiktionary (generated = covered by content/curated/vocab/vi-generated.json)`,
    count: missingVi.length,
    generated: generatedCount,
    remaining: missingVi.length - generatedCount,
    words: missingVi
  })

  log(`level: words ${fmt(report.words)}`)
  log(
    `level: ${missingVi.length} words have no Wiktionary Vietnamese meaning; ${generatedCount} covered by generated meanings, ${missingVi.length - generatedCount} still without any → normalized/missing-vi.json`
  )
  log(`level: sentences ${fmt(report.sentences)}`)
  log(`level: ${report.overrides} overrides applied, ${report.decks} decks`)
  return report
}

const fmt = (c: Record<string, number>): string =>
  Object.entries(c)
    .filter(([, n]) => n)
    .map(([l, n]) => `${l}=${n}`)
    .join(' ')
