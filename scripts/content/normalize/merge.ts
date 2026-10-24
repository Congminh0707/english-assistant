// Gộp mọi nguồn đã chuẩn hoá thành bản ghi Word + câu ví dụ (chưa gắn level):
//   normalized/words.base.jsonl, normalized/sentences.base.jsonl
// Bước content:level đọc hai file này để gắn level và sinh decks.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Example,
  Pos,
  Sense,
  SourceRef,
  ViMeaning,
  Word,
  WordForm,
  WordList
} from '../../../src/shared/schemas/content'
import { tatoebaSentenceId, wordId, wordKey } from '../../../src/shared/schemas/content'
import { log, JsonlWriter, readJson, readJsonl, requireFile } from '../lib/io'
import { CURATED_DIR, normalizedPath } from '../lib/paths'
import { tokenize, tokenVariants, type Token } from '../lib/text'
import { sourceRef } from '../sources'
import {
  isUsable,
  loadViGenerated,
  toViMeanings,
  type GeneratedViEntry
} from '../enrich/vi-generated'
import type { CmudictFile } from './cmudict'
import type { TatoebaCandidate, TatoebaFreqFile, TatoebaNamesFile } from './tatoeba'
import type { ViReverseFile, WikiEntry, WikiSense } from './wiktionary'
import type { WordfreqFile } from './wordfreq'
import type { ListEntry, WordlistsFile } from './wordlists'

/**
 * Số mục từ tối đa (danh sách từ luôn được giữ; phần còn lại: từ Tatoeba ≥ MIN_FOLDED_COUNT lần trước, rồi từ phổ biến
 * theo wordfreq mà Tatoeba ít gặp — plaintiff, felony...)
 */
const MAX_WORDS = 55_000
/** Từ ngoài danh sách phải xuất hiện ít nhất bấy nhiêu lần (đã gộp dạng chia) trong Tatoeba */
const MIN_FOLDED_COUNT = 3
const MAX_SENSES_PER_POS = 6
const MAX_SENSES = 16
const EXAMPLES_PER_WORD = 3
/** Từ có freqRank ≤ ngưỡng này (the, be, of...) không được liên kết hàng loạt trong sentence_words */
const STOPWORD_RANK = 100
const NGSL_MAX_RANK = 2809
const TATOEBA_LICENSE = sourceRef('tatoeba').license

const BAD_SENSE_TAGS = new Set([
  'obsolete',
  'archaic',
  'rare',
  'dated',
  'dialectal',
  'nonstandard',
  'historical',
  'misspelling',
  'pronunciation-spelling',
  'Early',
  'poetic'
])

/** Word chưa có level (level gắn ở bước content:level) */
export type BaseWord = Omit<Word, 'level'>

export interface BaseSentence {
  id: string
  en: string
  translations: { lang: 'vi'; text: string; source: SourceRef }[]
  wordIds: string[]
  /** Với từng token: các khoá lemma có thể ('#name' = tên riêng, [] = không có trong từ điển) */
  tokenLemmas: string[][]
  source: SourceRef
}

/** Quan hệ dạng từ mang các nhãn này không dùng để quy token về lemma (a → of, ho → whore...) */
const BAD_FORM_TAGS = new Set([
  ...BAD_SENSE_TAGS,
  'abbreviation',
  'initialism',
  'acronym',
  'eye-dialect',
  'slang',
  'vulgar',
  'derogatory',
  'offensive',
  'informal',
  'colloquial',
  'clipping',
  'ellipsis',
  'euphemistic',
  'Internet',
  'humorous',
  'uncommon'
])
const REGIONAL_TAGS = new Set([
  'US',
  'UK',
  'British',
  'Commonwealth',
  'Canada',
  'Australia',
  'Ireland'
])

/** Bảng "forms" của Wiktionary lẫn cả từ liên quan (better: good "positive", well "adverb";
 * itself: it) → chỉ nhận dạng có nhãn biến tố thật */
const INFLECTION_TAGS = new Set([
  'plural',
  'singular',
  'past',
  'present',
  'participle',
  'third-person',
  'comparative',
  'superlative',
  'gerund'
])

const isGoodSense = (s: WikiSense): boolean =>
  !s.formOf.length && !s.altOf.length && !s.tags.some((t) => BAD_SENSE_TAGS.has(t))
const isLemmaSense = (s: WikiSense): boolean => !s.formOf.length && !s.altOf.length
/** Như isGoodSense nhưng chấp nhận nhãn `historical` (wiktextract hay gắn nhầm cho nghĩa còn dùng: plaintiff) */
const isSoftSense = (s: WikiSense): boolean =>
  isLemmaSense(s) && !s.tags.some((t) => BAD_SENSE_TAGS.has(t) && t !== 'historical')

function stripTags(tags: string[]): string[] {
  return tags.filter((t) => t !== 'form-of' && t !== 'alt-of')
}

class FormIndex {
  /** dạng (chữ thường) → khoá lemma → tags */
  readonly map = new Map<string, Map<string, string[]>>()
  /** khoá lemma → dạng (giữ hoa/thường như nguồn) → tags */
  readonly byLemma = new Map<string, Map<string, string[]>>()

  add(form: string, lemma: string, tags: string[]): void {
    const f = form.toLowerCase()
    const key = wordKey(lemma)
    if (f === key) return
    let m = this.map.get(f)
    if (!m) this.map.set(f, (m = new Map()))
    m.set(key, [...new Set([...(m.get(key) ?? []), ...tags])])
    let r = this.byLemma.get(key)
    if (!r) this.byLemma.set(key, (r = new Map()))
    const display = [...r.keys()].find((x) => x.toLowerCase() === f) ?? form
    r.set(display, [...new Set([...(r.get(display) ?? []), ...tags])])
  }

  /** Bỏ quan hệ "cách viết khác" khi chính dạng đó là một mục từ (a.m. có dạng "a" → bỏ) */
  pruneAlternatives(selected: Set<string>): void {
    for (const [form, lemmas] of this.map) {
      if (!selected.has(form)) continue
      for (const [lemma, tags] of lemmas) {
        if (!tags.includes('alternative') && !tags.includes('variant')) continue
        lemmas.delete(lemma)
        const r = this.byLemma.get(lemma)
        for (const display of r?.keys() ?? [])
          if (display.toLowerCase() === form) r!.delete(display)
      }
    }
  }

  lemmasOf(form: string): string[] {
    return [...(this.map.get(form.toLowerCase())?.keys() ?? [])]
  }

  formsOf(lemmaKey: string): WordForm[] {
    return [...(this.byLemma.get(lemmaKey) ?? [])]
      .map(([form, tags]) => ({ form, tags: tags.sort() }))
      .sort((a, b) => (a.form < b.form ? -1 : a.form > b.form ? 1 : 0))
  }
}

export async function mergeWords(): Promise<void> {
  for (const f of ['wordlists.json', 'cmudict.json', 'tatoeba-freq.json', 'wiktionary.jsonl'])
    requireFile(normalizedPath(f), `pnpm content:normalize (missing ${f})`)
  const lists = await readJson<WordlistsFile>(normalizedPath('wordlists.json'))
  const cmu = await readJson<CmudictFile>(normalizedPath('cmudict.json'))
  const freq = await readJson<TatoebaFreqFile>(normalizedPath('tatoeba-freq.json'))
  // Bảng tần suất wordfreq (tuỳ chọn: không có file → chỉ dùng Tatoeba như trước)
  const wf: WordfreqFile = existsSync(normalizedPath('wordfreq.json'))
    ? await readJson<WordfreqFile>(normalizedPath('wordfreq.json'))
    : {}
  const hasWf = Object.keys(wf).length > 0
  const viReverse = await readJson<ViReverseFile>(normalizedPath('wiktionary-vi-reverse.json'))
  const names = new Set(await readJson<TatoebaNamesFile>(normalizedPath('tatoeba-names.json')))
  // Nghĩa Việt do LLM sinh (content:enrich vi) — tuỳ chọn, chỉ dùng khi từ không có nghĩa Wiktionary
  const viGenerated = (await loadViGenerated()).entries

  // ---- 1. Nạp mục từ Wiktionary, nhóm theo khoá ----
  const byKey = new Map<string, WikiEntry[]>()
  for await (const e of readJsonl<WikiEntry>(normalizedPath('wiktionary.jsonl'))) {
    const key = wordKey(e.word)
    const list = byKey.get(key) ?? []
    list.push(e)
    byKey.set(key, list)
  }

  // ---- 2. Bảng dạng từ → lemma ----
  const forms = new FormIndex()
  for (const entries of byKey.values()) {
    for (const e of entries) {
      for (const s of e.senses) {
        if (s.tags.some((t) => BAD_FORM_TAGS.has(t))) continue
        for (const l of s.formOf) forms.add(e.word, l, stripTags(s.tags))
        for (const l of s.altOf) forms.add(e.word, l, ['alternative'])
      }
      // Chữ cái đơn ("i", "a") có dạng số nhiều "is", "as" → bỏ, tránh quy "is" về "i"
      if (!e.senses.some(isLemmaSense) || e.word.length === 1) continue
      for (const f of e.forms) {
        if (f.tags.some((t) => BAD_FORM_TAGS.has(t))) continue
        // Cách viết khác: chỉ giữ loại theo vùng (colour/color), bỏ biến thể kiểu "teh", "da"
        const regionalAlt =
          f.tags.includes('alternative') && f.tags.some((t) => REGIONAL_TAGS.has(t))
        if (!regionalAlt && !f.tags.some((t) => INFLECTION_TAGS.has(t))) continue
        forms.add(f.form, e.word, f.tags)
      }
    }
  }
  for (const l of Object.values(lists)) {
    for (const f of l.family) forms.add(f, l.lemma, [])
    // Biến thể chỉ gồm chữ cái ("am" của a.m.) dễ trùng từ khác → bỏ
    for (const v of l.variants) if (!/^[a-z]+$/i.test(v)) forms.add(v, l.lemma, ['variant'])
  }

  // ---- 3. Chọn lemma ----
  const listKeys = new Set(Object.keys(lists))
  const folded = new Map<string, number>()
  for (const [key, entries] of byKey) {
    // Từ phổ biến theo wordfreq mà nghĩa duy nhất bị gắn nhãn `historical` (plaintiff: "UK, historical") vẫn nhận;
    // nghĩa cổ/hiếm thật (archaic, obsolete, dialectal...) thì không
    const onlyTagged = key in wf && entries.some((e) => e.senses.some(isSoftSense))
    if (!onlyTagged && !entries.some((e) => e.senses.some(isGoodSense))) continue
    if (!listKeys.has(key) && entries.every((e) => e.word !== e.word.toLowerCase())) continue
    folded.set(key, freq[key] ?? 0)
  }
  for (const [form, lemmas] of forms.map) {
    const n = freq[form] ?? 0
    if (!n) continue
    for (const l of lemmas.keys()) if (folded.has(l)) folded.set(l, folded.get(l)! + n)
  }
  // Dạng biến tố có mục riêng (came, ran, apples, peed) chỉ mang nghĩa hiếm/lóng: nếu là dạng chia
  // của một lemma sẽ có trong từ điển thì không lập mục riêng — tra "came" vẫn ra "come" qua word_forms.
  // Giữ lại khi mục đó là từ thật: có tính từ/trạng từ riêng (broke, accomplished, born) hoặc nghĩa riêng
  // đã có bản dịch Việt của Wiktionary (abode, arts). Các trường hợp còn sót (looked = "có vẻ ngoài")
  // xử lý bằng danh sách loại trừ curated/vocab/excluded-words.json.
  const droppedInflected: string[] = []
  const DROP_TAGS = new Set([
    'plural',
    'past',
    'participle',
    'third-person',
    'comparative',
    'superlative'
  ])
  const STANDALONE_POS = new Set<Pos>(['adjective', 'adverb'])
  const hasOwnMeaning = (key: string): boolean =>
    (byKey.get(key) ?? []).some((e) =>
      e.senses.some((s) => isGoodSense(s) && (STANDALONE_POS.has(e.pos) || s.vi.length > 0))
    )
  const isWeakInflection = (key: string): boolean => {
    const lemmas = forms.map.get(key)
    if (!lemmas || hasOwnMeaning(key)) return false
    for (const [lemma, tags] of lemmas) {
      if (lemma === key || !tags.some((t) => DROP_TAGS.has(t))) continue
      if (listKeys.has(lemma) || (folded.get(lemma) ?? 0) >= MIN_FOLDED_COUNT || lemma in wf)
        return true
    }
    return false
  }
  const extra = [...folded.entries()]
    // Có wordfreq thì phải nằm trong bảng đó (loại tên riêng/lỗi gõ chỉ Tatoeba gặp); không có wordfreq thì như cũ
    .filter(
      ([k, n]) =>
        !listKeys.has(k) && (hasWf ? k in wf || isContraction(k, n) : n >= MIN_FOLDED_COUNT)
    )
    .filter(([k]) => {
      if (!isWeakInflection(k)) return true
      droppedInflected.push(k)
      return false
    })
    // Tatoeba nhiều → ít; cùng số lần (nhất là các từ chỉ có trong wordfreq) → phổ biến hơn trước
    .sort(
      (a, b) =>
        Math.min(b[1], MIN_FOLDED_COUNT) - Math.min(a[1], MIN_FOLDED_COUNT) ||
        b[1] - a[1] ||
        (wf[a[0]] ?? 1e9) - (wf[b[0]] ?? 1e9) ||
        (a[0] < b[0] ? -1 : 1)
    )
    .slice(0, Math.max(0, MAX_WORDS - listKeys.size))
    .map(([k]) => k)
  // Từ trong danh sách mà Wiktionary không có mục từ (check-in counter, wornout...) → chưa có nghĩa, bỏ qua
  const noEntry = [...listKeys].filter((k) => !byKey.has(k)).map((k) => lists[k].lemma)
  // Mục từ bị loại thủ công (curated/vocab/excluded-words.json)
  const excluded = await loadExcluded()
  const sensitive = await loadSensitive()
  const selected = [...[...listKeys].filter((k) => byKey.has(k)), ...extra].filter(
    (k) => !excluded.has(wordId(k))
  )

  // freqRank: NGSL trước, phần còn lại theo tần suất Tatoeba (đã gộp dạng chia)
  // Bậc: 0 = chính từ đó xuất hiện đủ nhiều trong Tatoeba, 1 = từ trong danh sách mà Tatoeba ít gặp, 2 = còn lại (chỉ có
  // trong wordfreq, hoặc chỉ nhờ dạng khác của từ khác trỏ về) → xếp cuối để không chen vào top 10k
  const tier = (k: string): number =>
    (freq[k] ?? 0) >= MIN_FOLDED_COUNT ? 0 : listKeys.has(k) ? 1 : 2
  const rest = selected
    .filter((k) => lists[k]?.ngslRank === undefined)
    .sort(
      (a, b) =>
        tier(a) - tier(b) ||
        (folded.get(b) ?? freq[b] ?? 0) - (folded.get(a) ?? freq[a] ?? 0) ||
        (wf[a] ?? 1e9) - (wf[b] ?? 1e9) ||
        (a < b ? -1 : 1)
    )
  const freqRank = new Map<string, number>()
  for (const k of selected)
    if (lists[k]?.ngslRank !== undefined) freqRank.set(k, lists[k].ngslRank!)
  rest.forEach((k, i) => freqRank.set(k, NGSL_MAX_RANK + 1 + i))
  const selectedSet = new Set(selected)
  forms.pruneAlternatives(selectedSet)
  // Lemma viết hoa (Monday, English) — token viết hoa của chúng không bị coi là tên riêng
  const capitalized = new Set(
    selected.filter((k) => /[A-Z]/.test(byKey.get(k)?.[0]?.word ?? lists[k]?.lemma ?? ''))
  )

  // ---- 4. Câu ví dụ Tatoeba ----
  const { examples, sentences, viIndex } = await pickExamples(
    selectedSet,
    freqRank,
    forms,
    names,
    capitalized
  )

  // ---- 5. Ghi Word ----
  const out = new JsonlWriter(normalizedPath('words.base.jsonl'))
  let generatedUsed = 0
  let sensitiveCount = 0
  for (const key of selected) {
    const listEntry: ListEntry | undefined = lists[key]
    const entries = byKey.get(key)!
    const word = buildWord(key, listEntry, entries, {
      cmu,
      viReverse,
      forms,
      freqRank: freqRank.get(key),
      examples: examples.get(key) ?? [],
      rankVi: (texts) =>
        viIndex.rank(key, texts, new Set((viReverse[key] ?? []).map((r) => ViIndex.norm(r.text)))),
      byKey,
      generated: viGenerated[wordId(key)]
    })
    if (word.vi[0]?.origin === 'generated') generatedUsed++
    if (
      sensitive.has(word.lemma.toLowerCase()) ||
      (!listEntry && tier(key) === 2 && looksSensitive(entries))
    ) {
      word.sensitive = true
      sensitiveCount++
    }
    await out.write(word)
  }
  await out.close()

  const sOut = new JsonlWriter(normalizedPath('sentences.base.jsonl'))
  for (const s of sentences) await sOut.write(s)
  await sOut.close()
  log(
    `merge: ${out.count} words (${listKeys.size - noEntry.length} from lists, ${extra.length} by Tatoeba frequency), ${sOut.count} sentences`
  )
  const generatedTotal = Object.keys(viGenerated).length
  if (generatedTotal)
    log(
      `merge: ${generatedUsed} words use generated Vietnamese meanings (curated/vocab/vi-generated.json: ${generatedTotal} entries; rejected ones and words that now have a Wiktionary meaning are skipped)`
    )
  const missingSensitive = [...sensitive].filter((l) => !selected.some((k) => k === wordKey(l)))
  log(
    `merge: ${sensitiveCount} words flagged sensitive (child profiles hide them)${missingSensitive.length ? `; not in the dictionary: ${missingSensitive.join(', ')}` : ''}`
  )
  if (droppedInflected.length)
    log(
      `merge: dropped ${droppedInflected.length} standalone entries of inflected forms (they resolve through word_forms): ${droppedInflected.slice(0, 40).join(', ')}...`
    )
  if (noEntry.length)
    log(
      `merge: skipped ${noEntry.length} list words without Wiktionary entry: ${noEntry.join(', ')}`
    )
}

const EXCLUDED_PATH = join(CURATED_DIR, 'vocab', 'excluded-words.json')
const SENSITIVE_PATH = join(CURATED_DIR, 'vocab', 'sensitive-words.json')

/** Tập lemma (chữ thường) nhạy cảm; không có file → rỗng */
const SENSITIVE_TAGS = new Set([
  'vulgar',
  'offensive',
  'derogatory',
  'slur',
  'ethnic',
  'pejorative'
])
const SENSITIVE_GLOSS =
  /\b(sex|sexual|sexually|genital|genitals|penis|vagina|vulva|testicle|rape|raped|erotic|orgasm|masturbat\w*|porn\w*|prostitut\w*|intercourse|semen|fellatio|ejaculat\w*)\b/i

/**
 * Từ chỉ thêm theo wordfreq (Tatoeba ít gặp) mà nghĩa đầu bị Wiktionary gắn nhãn thô tục/xúc phạm hoặc nói về
 * tình dục → ẩn ở profile trẻ em. Danh sách thủ công sensitive-words.json vẫn được ưu tiên bổ sung.
 */
function looksSensitive(entries: WikiEntry[]): boolean {
  for (const e of entries) {
    const first = e.senses.find(isGoodSense)
    if (first && first.tags.some((t) => SENSITIVE_TAGS.has(t))) return true
    if (first && SENSITIVE_GLOSS.test(first.gloss)) return true
  }
  return false
}

/** Dạng rút gọn (don't, we'll, let's...) không có trong wordfreq nhưng cần để tra từ trong câu */
const CONTRACTION =
  /^[a-z]+'(?:t|ll|re|ve|d|m)$|^(?:it|that|what|who|there|here|he|she|let|where|how)'s$/
const isContraction = (k: string, n: number): boolean =>
  n >= MIN_FOLDED_COUNT && CONTRACTION.test(k)

async function loadSensitive(): Promise<Set<string>> {
  if (!existsSync(SENSITIVE_PATH)) return new Set()
  const file = await readJson<{ entries: Record<string, string> }>(SENSITIVE_PATH)
  return new Set(Object.keys(file.entries))
}

/** Tập word id bị loại thủ công; không có file → rỗng */
async function loadExcluded(): Promise<Set<string>> {
  if (!existsSync(EXCLUDED_PATH)) return new Set()
  const file = await readJson<{ entries: Record<string, string> }>(EXCLUDED_PATH)
  return new Set(Object.keys(file.entries))
}

interface BuildCtx {
  cmu: CmudictFile
  viReverse: ViReverseFile
  forms: FormIndex
  freqRank?: number
  examples: Example[]
  /** Sắp xếp nghĩa tiếng Việt: hay gặp trong bản dịch Tatoeba của câu chứa từ này lên trước */
  rankVi: (texts: string[]) => string[]
  byKey: Map<string, WikiEntry[]>
  /** Mục curated do LLM sinh cho từ này (nếu có) */
  generated?: GeneratedViEntry
}

function buildWord(
  key: string,
  listEntry: ListEntry | undefined,
  entries: WikiEntry[],
  ctx: BuildCtx
): BaseWord {
  const lemma = entries[0].word
  const attributions: SourceRef[] = []
  // Chỉ id + license; url/ghi công đầy đủ nằm ở bảng sources (đỡ lặp ~26k lần)
  const attribute = (ref: SourceRef): void => {
    if (!attributions.some((a) => a.id === ref.id))
      attributions.push({ id: ref.id, license: ref.license })
  }
  const wikiRef = sourceRef('wiktionary', {
    url: `https://en.wiktionary.org/wiki/${encodeURIComponent(lemma.replace(/ /g, '_'))}`
  })

  // Nghĩa: ưu tiên nghĩa "tốt"; nếu từ chỉ có nghĩa cổ/hiếm thì vẫn giữ vài nghĩa
  let lemmaEntries = entries.filter((e) => e.senses.some(isLemmaSense))
  if (!lemmaEntries.length) {
    // "favorite" = "American spelling of favourite": mượn nghĩa của mục từ đích
    const targets = new Set(entries.flatMap((e) => e.senses.flatMap((s) => s.altOf)))
    lemmaEntries = [...targets].flatMap((t) =>
      (ctx.byKey.get(wordKey(t)) ?? []).filter((e) => e.senses.some(isLemmaSense))
    )
  }
  if (!lemmaEntries.length) {
    // Không có mục đích → giữ chính định nghĩa "spelling of …" làm nghĩa
    lemmaEntries = entries.map((e) => ({
      ...e,
      senses: e.senses.map((s) => ({ ...s, formOf: [], altOf: [] }))
    }))
  }
  const anyGood = lemmaEntries.some((e) => e.senses.some(isGoodSense))
  const senses: Sense[] = []
  const perPos = new Map<Pos, number>()
  for (const e of lemmaEntries) {
    for (const s of e.senses) {
      if (!(anyGood ? isGoodSense(s) : isLemmaSense(s))) continue
      const n = perPos.get(e.pos) ?? 0
      const hasVi = s.vi.length > 0
      if (!hasVi && (n >= MAX_SENSES_PER_POS || senses.length >= MAX_SENSES)) continue
      perPos.set(e.pos, n + 1)
      senses.push({
        id: `s${senses.length + 1}`,
        pos: e.pos,
        en: s.gloss,
        vi: ctx.rankVi(s.vi),
        tags: s.tags,
        examples: s.examples.slice(0, 2).map((en) => ({ en, sourceId: 'wiktionary' }))
      })
    }
  }

  // Loại từ chỉ có dạng "cách viết khác của X" (jewelry n. = American spelling of jewellery) trong khi từ
  // còn có nghĩa riêng ở loại từ khác (jewelry v.) → mượn nghĩa cùng loại từ của X để không mất nghĩa chính
  if (senses.length) {
    for (const e of entries) {
      if (e.senses.some(isLemmaSense) || senses.some((s) => s.pos === e.pos)) continue
      const targets = new Set(e.senses.flatMap((s) => s.altOf))
      for (const t of targets)
        for (const te of ctx.byKey.get(wordKey(t)) ?? []) {
          if (te.pos !== e.pos) continue
          for (const s of te.senses) {
            if (
              !isGoodSense(s) ||
              senses.filter((x) => x.pos === e.pos).length >= MAX_SENSES_PER_POS
            )
              continue
            senses.push({
              id: `s${senses.length + 1}`,
              pos: e.pos,
              en: s.gloss,
              vi: ctx.rankVi(s.vi),
              tags: s.tags,
              examples: s.examples.slice(0, 2).map((en) => ({ en, sourceId: 'wiktionary' }))
            })
          }
        }
    }
  }

  const pos: Pos[] = [...new Set(senses.map((s) => s.pos))]
  if (!pos.length) pos.push(...new Set(entries.map((e) => e.pos)))

  // Nghĩa tiếng Việt
  const vi: ViMeaning[] = []
  // Nghĩa đã duyệt lại để THAY nghĩa Wiktionary (docs/09 §10.6): bỏ hẳn nghĩa Wiktionary, kể cả theo từng sense
  const replaceVi = ctx.generated?.replace === true && isUsable(ctx.generated)
  if (replaceVi) for (const s of senses) s.vi = []
  const pushVi = (m: ViMeaning): void => {
    if (!vi.some((x) => x.text === m.text)) vi.push(m)
  }
  // Nghĩa đã gán vào sense thì không cần senseHint (tra được qua senses[].vi)
  for (const s of senses)
    for (const text of s.vi) pushVi({ text, pos: s.pos, origin: 'wiktionary' })
  for (const e of lemmaEntries)
    for (const v of replaceVi ? [] : e.vi)
      pushVi({ text: v.text, pos: e.pos, senseHint: v.senseHint, origin: 'wiktionary' })
  if (!vi.length && !replaceVi) {
    for (const r of ctx.viReverse[key] ?? [])
      pushVi({ text: r.text, pos: r.pos, origin: 'wiktionary-vi' })
  }
  const order = ctx.rankVi(vi.map((v) => v.text))
  vi.sort((a, b) => order.indexOf(a.text) - order.indexOf(b.text))
  if (vi.length && !replaceVi) attribute(wikiRef)
  // Không có nghĩa Wiktionary nào → nghĩa LLM sinh (giữ đúng thứ tự đã duyệt, không xếp lại)
  else if (ctx.generated && isUsable(ctx.generated)) {
    for (const m of toViMeanings(ctx.generated)) pushVi(m)
    const { id, license, generatedBy } = ctx.generated.source
    attributions.push({ id, license, generatedBy })
  }

  // IPA: Wiktionary trước, CMUdict làm dự phòng cho giọng Mỹ
  const ipaEntry = entries.find((e) => e.ipa.us || e.ipa.uk || e.ipa.any)
  let us = ipaEntry?.ipa.us ?? ipaEntry?.ipa.any
  const uk = ipaEntry?.ipa.uk ?? ipaEntry?.ipa.any
  if (!us && ctx.cmu[key]) {
    us = ctx.cmu[key][0]
    attribute(sourceRef('cmudict'))
  }

  const wordForms = ctx.forms.formsOf(key)

  attribute(wikiRef)
  const lists: WordList[] = listEntry?.lists ?? []
  for (const l of lists) attribute(sourceRef(l === 'ngsl-sup' ? 'ngsl' : l))
  if (ctx.examples.some((x) => x.sourceId.startsWith('tatoeba:'))) attribute(sourceRef('tatoeba'))

  return {
    id: wordId(key),
    lemma,
    pos,
    ipa: { ...(us ? { us } : {}), ...(uk ? { uk } : {}) },
    senses,
    vi,
    viShort: vi.length
      ? vi
          .slice(0, 3)
          .map((v) => v.text)
          .join('; ')
      : undefined,
    forms: wordForms,
    examples: ctx.examples,
    lists,
    freqRank: ctx.freqRank,
    cefr: listEntry?.cefr,
    tracks: [],
    topics: [],
    source: wikiRef,
    attributions,
    review: { status: 'draft', by: 'pipeline' }
  }
}

interface Scored {
  score: number
  s: TatoebaCandidate
}

/** Chỉ mục bản dịch tiếng Việt của Tatoeba để xếp hạng nghĩa tiếng Việt */
class ViIndex {
  /** lemma → bản dịch Việt (đã chuẩn hoá) của các câu Anh chứa lemma đó */
  private pairs = new Map<string, string[]>()

  static norm(s: string): string {
    return ` ${s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()} `
  }

  add(lemmas: Iterable<string>, vi: { text: string }[]): void {
    const texts = vi.map((v) => ViIndex.norm(v.text))
    for (const l of lemmas) {
      const list = this.pairs.get(l) ?? []
      list.push(...texts)
      this.pairs.set(l, list)
    }
  }

  /**
   * Thứ tự: (1) số câu Tatoeba chứa lemma mà bản dịch Việt có từ này, (2) Wiktionary tiếng Việt
   * định nghĩa ngược từ này bằng chính lemma, (3) thứ tự gốc. (Không dùng độ phổ biến chung:
   * từ đồng âm như "bom" = quả bom làm sai thứ tự nghĩa của "apple".)
   */
  rank(lemma: string, texts: string[], reverse: Set<string>): string[] {
    const pairs = this.pairs.get(lemma) ?? []
    const scored = texts.map((t, i) => {
      const n = ViIndex.norm(t)
      return { t, i, cooc: pairs.filter((p) => p.includes(n)).length, rev: reverse.has(n) ? 1 : 0 }
    })
    scored.sort((a, b) => b.cooc - a.cooc || b.rev - a.rev || a.i - b.i)
    return scored.map((x) => x.t)
  }
}

async function pickExamples(
  selected: Set<string>,
  freqRank: Map<string, number>,
  forms: FormIndex,
  names: Set<string>,
  capitalized: Set<string>
): Promise<{ examples: Map<string, Example[]>; sentences: BaseSentence[]; viIndex: ViIndex }> {
  const path = normalizedPath('tatoeba-eng.jsonl')
  requireFile(path, 'pnpm content:normalize tatoeba')
  const best = new Map<string, Scored[]>()
  const keep = new Map<number, { s: TatoebaCandidate; tokenLemmas: string[][] }>()

  const lemmaCache = new Map<string, string[]>()
  const lemmasOfToken = (norm: string): string[] => {
    let hit = lemmaCache.get(norm)
    if (!hit) {
      const out = new Set<string>()
      for (const v of tokenVariants(norm)) {
        if (selected.has(v)) out.add(v)
        for (const l of forms.lemmasOf(v)) if (selected.has(l)) out.add(l)
      }
      hit = [...out]
      lemmaCache.set(norm, hit)
    }
    return hit
  }

  // Token viết hoa là tên riêng ('#name') nếu: không phải lemma viết hoa (Monday) và
  // (thường xuất hiện viết hoa giữa câu như "Tom", hoặc không có trong từ điển và không đứng đầu câu)
  const resolve = (t: Token): string[] => {
    const l = lemmasOfToken(t.norm)
    const isCap = /^[A-Z]/.test(t.raw) && t.norm !== 'i' && !t.norm.startsWith("i'")
    // Không có trong từ điển mà viết hoa (kể cả đầu câu: "Muiriel is 20 now.") → tên riêng
    if (isCap && !l.some((k) => capitalized.has(k))) {
      if (names.has(t.norm) || !l.length) return ['#name']
    }
    return l
  }
  const viIndex = new ViIndex()

  // Tatoeba có câu gần trùng (khác hoa/thường, dấu câu) → giữ một câu; ưu tiên câu có bản dịch Việt
  const textKey = (t: string): string =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  const viKeys = new Set<string>()
  for await (const s of readJsonl<TatoebaCandidate>(path))
    if (s.vi.length) viKeys.add(textKey(s.text))
  const seenKeys = new Set<string>()

  for await (const s of readJsonl<TatoebaCandidate>(path)) {
    const key = textKey(s.text)
    if (seenKeys.has(key) || (!s.vi.length && viKeys.has(key))) continue
    seenKeys.add(key)
    const tokens = tokenize(s.text)
    const tokenLemmas = tokens.map(resolve)
    const hasVi = s.vi.length > 0
    if (hasVi) {
      keep.set(s.id, { s, tokenLemmas })
      viIndex.add(new Set(tokenLemmas.flat()), s.vi)
    }

    const unknown = tokenLemmas.filter((l) => !l.length).length
    const ranks = tokenLemmas
      .filter((l) => l.length && l[0] !== '#name')
      .map((l) => Math.min(...l.map((k) => freqRank.get(k) ?? 99_999)))
    const hardest = ranks.length ? Math.max(...ranks) : 0
    const lemmas = new Set(tokenLemmas.flat().filter((l) => l !== '#name'))
    for (const l of lemmas) {
      const target = freqRank.get(l) ?? 99_999
      const excess = Math.max(0, hardest - Math.max(target * 1.5, 2000))
      const score =
        (hasVi ? 1000 : 0) -
        Math.abs(tokens.length - 8) * 10 -
        Math.min(200, excess / 100) -
        unknown * 100
      const list = best.get(l) ?? []
      if (list.length < EXAMPLES_PER_WORD || score > list[list.length - 1].score) {
        list.push({ score, s })
        list.sort((a, b) => b.score - a.score || a.s.id - b.s.id)
        if (list.length > EXAMPLES_PER_WORD) list.pop()
        best.set(l, list)
      }
    }
  }

  const examples = new Map<string, Example[]>()
  const chosenFor = new Map<number, Set<string>>()
  for (const [l, list] of best) {
    examples.set(
      l,
      list.map(({ s }) => ({ en: s.text, vi: s.vi[0]?.text, sourceId: `tatoeba:${s.id}` }))
    )
    for (const { s } of list) {
      const set = chosenFor.get(s.id) ?? new Set()
      set.add(l)
      chosenFor.set(s.id, set)
      if (!keep.has(s.id)) {
        keep.set(s.id, { s, tokenLemmas: tokenize(s.text).map(resolve) })
      }
    }
  }

  const sentences: BaseSentence[] = [...keep.values()]
    .sort((a, b) => a.s.id - b.s.id)
    .map(({ s, tokenLemmas }) => {
      const ids = new Set<string>()
      for (const l of tokenLemmas.flat()) {
        if (l === '#name') continue
        if ((freqRank.get(l) ?? 99_999) > STOPWORD_RANK || chosenFor.get(s.id)?.has(l))
          ids.add(wordId(l))
      }
      return {
        id: tatoebaSentenceId(s.id),
        en: s.text,
        translations: s.vi.slice(0, 2).map((v) => ({
          lang: 'vi' as const,
          text: v.text,
          // url suy ra được từ id: https://tatoeba.org/en/sentences/show/<id> — không lưu để giảm dung lượng
          source: {
            id: 'tatoeba',
            license: TATOEBA_LICENSE,
            ...(v.author ? { author: v.author } : {})
          }
        })),
        wordIds: [...ids].sort(),
        tokenLemmas,
        source: {
          id: 'tatoeba',
          license: TATOEBA_LICENSE,
          ...(s.author ? { author: s.author } : {})
        }
      }
    })
  return { examples, sentences, viIndex }
}
