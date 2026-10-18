// NGSL 1.2 (+ supplementary), TSL 1.2, CEFR-J 1.5, Octanove C1/C2 → normalized/wordlists.json
import { readFile } from 'node:fs/promises'
import type { WordList } from '../../../src/shared/schemas/content'
import { wordKey } from '../../../src/shared/schemas/content'
import { log, parseCsvLine, requireFile, writeJson } from '../lib/io'
import { normalizedPath, rawPath } from '../lib/paths'

export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface ListEntry {
  /** Cách viết hiển thị (giữ hoa: 'Monday') */
  lemma: string
  lists: WordList[]
  ngslRank?: number
  tslRank?: number
  /** Level CEFR thấp nhất trong mọi dòng POS của CEFR-J / Octanove */
  cefr?: Cefr
  cefrByPos: { pos: string; cefr: Cefr; list: 'cefrj' | 'octanove' }[]
  /** Dạng từ trong word family của NGSL/TSL ("lemmatized for teaching") */
  family: string[]
  /** Cách viết khác (CEFR-J 'a.m./A.M./am/AM') */
  variants: string[]
}

export type WordlistsFile = Record<string, ListEntry>

const CEFR_ORDER: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

async function readCsv(path: string): Promise<string[][]> {
  const bytes = await readFile(path)
  // TSL phát hành ở ISO-8859-1 (résumé, café), các file khác UTF-8
  let text = bytes.toString('utf8')
  if (text.includes('\uFFFD')) text = bytes.toString('latin1')
  text = text.replace(/^\uFEFF/, '')
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map(parseCsvLine)
}

function entry(map: WordlistsFile, lemma: string): ListEntry {
  const key = wordKey(lemma)
  let e = map[key]
  if (!e) {
    e = { lemma, lists: [], cefrByPos: [], family: [], variants: [] }
    map[key] = e
  }
  return e
}

function addList(e: ListEntry, list: WordList): void {
  if (!e.lists.includes(list)) e.lists.push(list)
}

function addFamily(e: ListEntry, forms: string[]): void {
  for (const f of forms) {
    const form = f.trim()
    if (form && wordKey(form) !== wordKey(e.lemma) && !e.family.includes(form)) e.family.push(form)
  }
}

export async function normalizeWordlists(): Promise<void> {
  const files = {
    ngslStats: rawPath('ngsl', 'NGSL_12_stats.csv'),
    ngslFamily: rawPath('ngsl', 'NGSL_12_lemmatized_for_teaching.csv'),
    ngslSup: rawPath('ngsl', 'SUP_lemmatized.csv'),
    tslStats: rawPath('tsl', 'TSL_12_stats.csv'),
    tslFamily: rawPath('tsl', 'TSL_12_lemmatized_for_teaching.csv'),
    cefrj: rawPath('cefrj', 'cefrj-vocabulary-profile-1.5.csv'),
    octanove: rawPath('octanove', 'octanove-vocabulary-profile-c1c2-1.0.csv')
  }
  for (const f of Object.values(files)) requireFile(f, 'pnpm content:fetch')

  const map: WordlistsFile = {}

  // NGSL: Lemma,SFI Rank,SFI,Adjusted Frequency per Million (U)
  for (const [lemma, rank] of (await readCsv(files.ngslStats)).slice(1)) {
    const e = entry(map, lemma)
    addList(e, 'ngsl')
    e.ngslRank = Math.min(e.ngslRank ?? Infinity, Number(rank))
  }
  for (const [head, ...forms] of await readCsv(files.ngslFamily)) addFamily(entry(map, head), forms)
  for (const [head, ...forms] of await readCsv(files.ngslSup)) {
    const e = entry(map, head)
    addList(e, 'ngsl-sup')
    addFamily(e, forms)
  }

  // TSL: Word,TSL Rank,SFI,U
  for (const [lemma, rank] of (await readCsv(files.tslStats)).slice(1)) {
    const e = entry(map, lemma)
    addList(e, 'tsl')
    e.tslRank = Math.min(e.tslRank ?? Infinity, Number(rank))
  }
  for (const [head, ...forms] of await readCsv(files.tslFamily)) {
    const e = map[wordKey(head)]
    if (e) addFamily(e, forms)
  }

  // CEFR-J: headword,pos,CEFR,... ; Octanove: headword,pos,CEFR,notes
  const addCefr = (rows: string[][], list: 'cefrj' | 'octanove'): void => {
    for (const [head, pos, cefr] of rows.slice(1)) {
      if (!CEFR_ORDER.includes(cefr as Cefr)) continue
      const variants = head
        .split('/')
        .map((v) => v.trim())
        .filter(Boolean)
      const e = entry(map, variants[0])
      addList(e, list)
      for (const v of variants.slice(1)) {
        if (v.toLowerCase() !== variants[0].toLowerCase() && !e.variants.includes(v))
          e.variants.push(v)
      }
      e.cefrByPos.push({ pos, cefr: cefr as Cefr, list })
      if (!e.cefr || CEFR_ORDER.indexOf(cefr as Cefr) < CEFR_ORDER.indexOf(e.cefr))
        e.cefr = cefr as Cefr
    }
  }
  addCefr(await readCsv(files.cefrj), 'cefrj')
  addCefr(await readCsv(files.octanove), 'octanove')

  await writeJson(normalizedPath('wordlists.json'), map)
  const count = (l: WordList): number =>
    Object.values(map).filter((e) => e.lists.includes(l)).length
  log(
    `wordlists: ${Object.keys(map).length} lemmas (ngsl ${count('ngsl')}, ngsl-sup ${count('ngsl-sup')}, tsl ${count('tsl')}, cefrj ${count('cefrj')}, octanove ${count('octanove')})`
  )
}
