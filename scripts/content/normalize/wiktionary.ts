// kaikki.org (wiktextract) → normalized/wiktionary.jsonl + normalized/wiktionary-vi-reverse.json
// File tiếng Anh ~3 GB sau giải nén: đọc theo luồng từng dòng, chỉ giữ mục từ nằm trong
// danh sách từ (NGSL/TSL/CEFR-J/Octanove) hoặc xuất hiện trong Tatoeba.
import type { Pos } from '../../../src/shared/schemas/content'
import { log, JsonlWriter, readJson, readLines, requireFile, writeJson } from '../lib/io'
import { normalizedPath, rawPath } from '../lib/paths'
import { cleanGloss, isPlainWord } from '../lib/text'
import type { TatoebaFreqFile } from './tatoeba'
import type { WordlistsFile } from './wordlists'

/** Token Tatoeba xuất hiện ít nhất bấy nhiêu lần mới được xét làm mục từ */
const MIN_TATOEBA_COUNT = 3

const POS_MAP: Record<string, Pos> = {
  noun: 'noun',
  name: 'proper_noun',
  verb: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  pron: 'pronoun',
  det: 'determiner',
  article: 'article',
  prep: 'preposition',
  postp: 'preposition',
  conj: 'conjunction',
  intj: 'interjection',
  num: 'numeral',
  particle: 'particle',
  contraction: 'contraction',
  abbrev: 'abbreviation',
  phrase: 'phrase',
  prep_phrase: 'phrase'
}

const DROP_FORM_TAGS = new Set([
  'table-tags',
  'inflection-template',
  'class',
  'romanization',
  'obsolete',
  'archaic',
  'dialectal',
  'nonstandard',
  'misspelling',
  'rare',
  'pronunciation-spelling',
  'dated',
  'error-unrecognized-form'
])

// ---- Kiểu (một phần) của bản ghi wiktextract ----
interface KTranslation {
  lang_code?: string
  code?: string
  word?: string
  sense?: string
  _dis1?: string
}
interface KSense {
  glosses?: string[]
  tags?: string[]
  form_of?: { word: string }[]
  alt_of?: { word: string }[]
  examples?: { text?: string; type?: string; ref?: string }[]
  translations?: KTranslation[]
}
interface KEntry {
  word: string
  pos: string
  lang_code: string
  etymology_number?: number
  forms?: { form: string; tags?: string[] }[]
  sounds?: { ipa?: string; tags?: string[] }[]
  senses?: KSense[]
  translations?: KTranslation[]
}

// ---- Bản ghi đã chuẩn hoá ----
export interface WikiSense {
  gloss: string
  tags: string[]
  /** Lemma mà nghĩa này là dạng chia của (went → go) */
  formOf: string[]
  /** Lemma mà nghĩa này là cách viết khác của (colour → color) */
  altOf: string[]
  examples: string[]
  vi: string[]
}
export interface WikiEntry {
  word: string
  pos: Pos
  etym?: number
  ipa: { us?: string; uk?: string; any?: string }
  forms: { form: string; tags: string[] }[]
  senses: WikiSense[]
  /** Bản dịch tiếng Việt ở cấp mục từ chưa gán được vào nghĩa cụ thể */
  vi: { text: string; senseHint?: string }[]
}

export type ViReverseFile = Record<string, { text: string; pos?: Pos }[]>

const isVi = (t: KTranslation): boolean => (t.lang_code ?? t.code) === 'vi' && !!t.word

function cleanVi(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function pickIpa(sounds: KEntry['sounds']): WikiEntry['ipa'] {
  const out: WikiEntry['ipa'] = {}
  for (const s of sounds ?? []) {
    const m = s.ipa && /\/[^/]+\//.exec(s.ipa)
    if (!m) continue
    const ipa = m[0]
    const tags = s.tags ?? []
    if (!tags.length) out.any ??= ipa
    // Một cách đọc có thể gắn cả GA lẫn RP → không dùng else-if
    if (!out.us && (tags.includes('General-American') || tags.includes('US'))) out.us = ipa
    if (
      !out.uk &&
      (tags.includes('Received-Pronunciation') ||
        tags.includes('UK') ||
        tags.includes('Standard-Southern-British'))
    )
      out.uk = ipa
  }
  return out
}

// "Meronyms: processor, CPU", "custard apple   rose apple" không phải câu ví dụ
const NYM_RE =
  /^(Synonyms?|Antonyms?|Meronyms?|Holonyms?|Hypernyms?|Hyponyms?|Coordinate terms?|See also)\b/i
function isUsableExample(text: string): boolean {
  return (
    text.length <= 160 &&
    !NYM_RE.test(text) &&
    !/\u2003|\s{3,}/.test(text) &&
    text.split(' ').length >= 3
  )
}

const SPELLING_OF_RE = /\b(?:spelling|form) of ([A-Za-z][A-Za-z' -]*?)\.?$/

function normalizeEntry(e: KEntry, pos: Pos): WikiEntry {
  const senses: WikiSense[] = (e.senses ?? []).map((s) => {
    const gloss = cleanGloss(s.glosses?.[s.glosses.length - 1] ?? '')
    const altOf = (s.alt_of ?? []).map((x) => x.word)
    const tags = s.tags ?? []
    if (!altOf.length && !s.form_of?.length) {
      const m = SPELLING_OF_RE.exec(gloss)
      if (m && /standard spelling|alternative (?:spelling|form)/i.test(gloss)) altOf.push(m[1])
    }
    return {
      gloss,
      tags,
      formOf: (s.form_of ?? []).map((x) => x.word),
      altOf,
      examples: (s.examples ?? [])
        .filter((x) => x.type !== 'quotation' && !x.ref && x.text && isUsableExample(x.text))
        .map((x) => x.text!.replace(/\s+/g, ' ').trim())
        .slice(0, 3),
      vi: [...new Set((s.translations ?? []).filter(isVi).map((t) => cleanVi(t.word!)))]
    }
  })

  // Bản dịch cấp mục từ: wiktextract có điểm _dis1 cho từng nghĩa → gán nếu đủ chắc chắn
  const vi: WikiEntry['vi'] = []
  for (const t of (e.translations ?? []).filter(isVi)) {
    const text = cleanVi(t.word!)
    const scores = (t._dis1 ?? '').split(' ').map(Number)
    let best = -1
    scores.forEach((sc, i) => {
      if (sc >= 40 && (best < 0 || sc > scores[best])) best = i
    })
    if (best >= 0 && senses[best] && !senses[best].vi.includes(text)) senses[best].vi.push(text)
    else if (!vi.some((v) => v.text === text)) vi.push({ text, senseHint: t.sense })
  }

  const forms: WikiEntry['forms'] = []
  for (const f of e.forms ?? []) {
    const tags = f.tags ?? []
    if (!f.form || f.form === e.word || !isPlainWord(f.form.replace(/ /g, '-'))) continue
    if (tags.some((t) => DROP_FORM_TAGS.has(t))) continue
    if (!forms.some((x) => x.form === f.form)) forms.push({ form: f.form, tags })
  }

  return {
    word: e.word,
    pos,
    etym: e.etymology_number,
    ipa: pickIpa(e.sounds),
    forms,
    senses: senses.filter((s) => s.gloss),
    vi
  }
}

const HEAD_RE = /"word": "((?:[^"\\]|\\.)*)", "lang": "English", "lang_code": "en"/

async function normalizeEnglish(
  candidates: Set<string>,
  listExact: Set<string>
): Promise<{ kept: number; scanned: number }> {
  const path = rawPath('wiktionary', 'kaikki.org-dictionary-English.jsonl.gz')
  requireFile(path, 'pnpm content:fetch wiktionary')
  const out = new JsonlWriter(normalizedPath('wiktionary.jsonl'))
  let scanned = 0
  for await (const line of readLines(path)) {
    scanned++
    if (scanned % 250_000 === 0) log(`  wiktionary: ${scanned} lines scanned, ${out.count} kept`)
    // Lọc nhanh trước khi JSON.parse (~95% số dòng bị loại): wiktextract ghi các khoá cấp
    // mục từ liền nhau theo thứ tự "word", "lang", "lang_code".
    const head = HEAD_RE.exec(line)
    if (head) {
      const word = JSON.parse(`"${head[1]}"`) as string
      if (!listExact.has(word) && !candidates.has(word)) continue
    }
    const e = JSON.parse(line) as KEntry
    if (e.lang_code !== 'en') continue
    const inList = listExact.has(e.word)
    if (!inList && !(e.word === e.word.toLowerCase() && candidates.has(e.word))) continue
    const pos = POS_MAP[e.pos]
    if (!pos || (pos === 'proper_noun' && !inList)) continue
    await out.write(normalizeEntry(e, pos))
  }
  await out.close()
  return { kept: out.count, scanned }
}

const VI_SKIP_TAGS = new Set([
  'obsolete',
  'archaic',
  'rare',
  'dated',
  'form-of',
  'alt-of',
  'Hán-Nôm'
])
const VI_WORD_RE = /^[\p{Script=Latin}\s-]+$/u

async function normalizeVietnameseReverse(candidates: Set<string>): Promise<number> {
  const path = rawPath('wiktionary', 'kaikki.org-dictionary-Vietnamese.jsonl')
  requireFile(path, 'pnpm content:fetch wiktionary')
  const map: ViReverseFile = {}
  for await (const line of readLines(path)) {
    const e = JSON.parse(line) as KEntry
    if (e.lang_code !== 'vi' || !VI_WORD_RE.test(e.word)) continue
    const pos = POS_MAP[e.pos]
    for (const s of e.senses ?? []) {
      if (s.form_of?.length || s.alt_of?.length || (s.tags ?? []).some((t) => VI_SKIP_TAGS.has(t)))
        continue
      const gloss = s.glosses?.[s.glosses.length - 1]
      if (!gloss || /form of|Nôm|Hán/.test(gloss)) continue
      // "(colloquial) to eat; to consume" → ['eat', 'consume']
      for (const part of gloss.split(/[;,]/).slice(0, 3)) {
        const en = part
          .replace(/\([^)]*\)/g, ' ')
          .replace(/^\s*(to|a|an|the)\s+/i, '')
          .replace(/[.!?]+$/, '')
          .trim()
        if (!en || !candidates.has(en)) continue
        const list = (map[en] ??= [])
        if (!list.some((x) => x.text === e.word)) list.push({ text: e.word, pos })
      }
    }
  }
  await writeJson(normalizedPath('wiktionary-vi-reverse.json'), map)
  return Object.keys(map).length
}

export async function normalizeWiktionary(): Promise<void> {
  const lists = await readJson<WordlistsFile>(normalizedPath('wordlists.json'))
  const freq = await readJson<TatoebaFreqFile>(normalizedPath('tatoeba-freq.json'))

  const candidates = new Set<string>()
  const listExact = new Set<string>()
  for (const e of Object.values(lists)) {
    for (const w of [e.lemma, ...e.variants, ...e.family]) {
      listExact.add(w)
      candidates.add(w.toLowerCase())
    }
  }
  for (const [tok, n] of Object.entries(freq)) if (n >= MIN_TATOEBA_COUNT) candidates.add(tok)
  log(`wiktionary: ${candidates.size} candidate headwords`)

  const { kept, scanned } = await normalizeEnglish(candidates, listExact)
  const reverse = await normalizeVietnameseReverse(candidates)
  log(
    `wiktionary: kept ${kept}/${scanned} English entries; VI reverse glosses for ${reverse} English words`
  )
}
