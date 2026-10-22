// Danh mục nguồn của pipeline. Thêm nguồn mới: ghi vào docs/08-content-sources.md TRƯỚC,
// rồi khai báo ở đây (bảng `sources` của content.db và LICENSES.md sinh từ danh mục này).
import type { SourceInfo, SourceRef } from '../../src/shared/schemas/content'

export interface RawFile {
  url: string
  /** Tên file lưu trong content/raw/<sourceId>/ */
  file: string
  /** Giải nén .bz2 sau khi tải (Tatoeba) */
  bunzip?: boolean
}

export interface SourceDef extends SourceInfo {
  files: RawFile[]
}

const NGSL_BASE = 'https://www.newgeneralservicelist.com/s/'
const OLP_BASE = 'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/'
// Ghim theo commit để tải lại luôn ra đúng file
const WORDFREQ_BASE =
  'https://raw.githubusercontent.com/rspeer/wordfreq/912caf64b657478d1dff1138efdc078947d54bb1/'
const TATOEBA_BASE = 'https://downloads.tatoeba.org/exports/per_language/'

export const SOURCES = {
  ngsl: {
    id: 'ngsl',
    name: 'New General Service List (NGSL) 1.2',
    url: 'https://www.newgeneralservicelist.com/new-general-service-list',
    license: 'CC-BY-SA-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution:
      'Browne, C., Culligan, B., & Phillips, J. (2013). The New General Service List (version 1.2). newgeneralservicelist.com. Licensed under CC BY-SA 4.0. Used: frequency ranks and lemma word families.',
    files: [
      { url: `${NGSL_BASE}NGSL_12_stats.csv`, file: 'NGSL_12_stats.csv' },
      {
        url: `${NGSL_BASE}NGSL_12_lemmatized_for_teaching.csv`,
        file: 'NGSL_12_lemmatized_for_teaching.csv'
      },
      { url: `${NGSL_BASE}SUP_lemmatized.csv`, file: 'SUP_lemmatized.csv' }
    ]
  },
  tsl: {
    id: 'tsl',
    name: 'TOEIC Service List (TSL) 1.2',
    url: 'https://www.newgeneralservicelist.com/toeic-service-list',
    license: 'CC-BY-SA-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution:
      'Browne, C., & Culligan, B. (2016). The TOEIC Service List (version 1.2). newgeneralservicelist.com. Licensed under CC BY-SA 4.0. Used: frequency ranks and lemma word families.',
    files: [
      { url: `${NGSL_BASE}TSL_12_stats.csv`, file: 'TSL_12_stats.csv' },
      {
        url: `${NGSL_BASE}TSL_12_lemmatized_for_teaching.csv`,
        file: 'TSL_12_lemmatized_for_teaching.csv'
      }
    ]
  },
  cefrj: {
    id: 'cefrj',
    name: 'CEFR-J Wordlist Version 1.5',
    url: 'https://github.com/openlanguageprofiles/olp-en-cefrj',
    license: 'CEFR-J',
    // Trích dẫn đúng như README của openlanguageprofiles/olp-en-cefrj yêu cầu
    attribution:
      'The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies. Retrieved from http://www.cefr-j.org/download.html on 1/20/2020. Copyright Tono Laboratory, TUFS; free for research and commercial use with citation. Distributed via Open Language Profiles (github.com/openlanguageprofiles/olp-en-cefrj).',
    files: [
      {
        url: `${OLP_BASE}cefrj-vocabulary-profile-1.5.csv`,
        file: 'cefrj-vocabulary-profile-1.5.csv'
      },
      { url: `${OLP_BASE}README.md`, file: 'README.md' }
    ]
  },
  octanove: {
    id: 'octanove',
    name: 'Octanove Vocabulary Profile C1/C2 (ver 1.0)',
    url: 'https://github.com/openlanguageprofiles/olp-en-cefrj',
    license: 'CC-BY-SA-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution:
      'Octanove Vocabulary Profile C1/C2 (ver 1.0), created by Octanove Labs (octanove.com), distributed via Open Language Profiles. Licensed under CC BY-SA 4.0.',
    files: [
      {
        url: `${OLP_BASE}octanove-vocabulary-profile-c1c2-1.0.csv`,
        file: 'octanove-vocabulary-profile-c1c2-1.0.csv'
      }
    ]
  },
  cmudict: {
    id: 'cmudict',
    name: 'CMU Pronouncing Dictionary',
    url: 'https://github.com/cmusphinx/cmudict',
    license: 'BSD-2-Clause',
    attribution:
      'Copyright (C) 1993-2015 Carnegie Mellon University. All rights reserved. US pronunciations converted from ARPAbet to IPA. Full license text below.',
    files: [
      {
        url: 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict',
        file: 'cmudict.dict'
      },
      { url: 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/LICENSE', file: 'LICENSE' }
    ]
  },
  wiktionary: {
    id: 'wiktionary',
    name: 'English Wiktionary (via kaikki.org / wiktextract)',
    url: 'https://kaikki.org/dictionary/English/',
    license: 'CC-BY-SA-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution:
      'Wiktionary contributors, English Wiktionary (en.wiktionary.org), dual-licensed CC BY-SA 4.0 and GFDL. Machine-readable extraction by Tatu Ylonen, "Wiktextract: Wiktionary as Machine-Readable Structured Data", LREC 2022 (kaikki.org). Used: parts of speech, English glosses, IPA, inflected forms, usage examples and Vietnamese translations; entries were filtered and reformatted.',
    files: [
      {
        url: 'https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz',
        file: 'kaikki.org-dictionary-English.jsonl.gz'
      },
      {
        url: 'https://kaikki.org/dictionary/Vietnamese/kaikki.org-dictionary-Vietnamese.jsonl',
        file: 'kaikki.org-dictionary-Vietnamese.jsonl'
      }
    ]
  },
  'english-assistant': {
    id: 'english-assistant',
    name: 'English Assistant content pipeline',
    url: 'https://github.com/Congminh0707/english-assistant',
    license: 'CC-BY-SA-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution:
      'Level tags and level decks compiled by the English Assistant project from CEFR-J, Octanove, NGSL and TSL (see their entries). As an adaptation of CC BY-SA material it is licensed under CC BY-SA 4.0.',
    files: []
  },
  generated: {
    id: 'generated',
    name: 'English Assistant — AI-generated Vietnamese meanings',
    url: 'https://github.com/Congminh0707/english-assistant',
    license: 'proprietary-own',
    attribution:
      'Short Vietnamese meanings for words that have no Vietnamese translation in Wiktionary, generated at build time with an LLM (model and date in each record: generatedBy) and reviewed by the English Assistant project (content/curated/vocab/vi-generated.json).',
    files: []
  },
  wordfreq: {
    id: 'wordfreq',
    name: 'wordfreq (large_en word frequencies)',
    url: 'https://github.com/rspeer/wordfreq',
    license: 'CC-BY-SA-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution:
      'Robyn Speer, wordfreq (github.com/rspeer/wordfreq): English word frequency data (large_en), CC BY-SA 4.0. Aggregates Wikipedia, OpenSubtitles, SUBTLEX-US (Brysbaert et al.), Google Books Ngrams, Leeds Internet Corpus, news and web text. Used only to choose and rank which common words get a dictionary entry; no counts are redistributed.',
    files: [
      { url: `${WORDFREQ_BASE}wordfreq/data/large_en.msgpack.gz`, file: 'large_en.msgpack.gz' },
      { url: `${WORDFREQ_BASE}LICENSE.txt`, file: 'LICENSE.txt' }
    ]
  },
  tatoeba: {
    id: 'tatoeba',
    name: 'Tatoeba',
    url: 'https://tatoeba.org/en/downloads',
    license: 'CC-BY-2.0-FR',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/fr/',
    attribution:
      'Sentences and translation links from Tatoeba (tatoeba.org), licensed under CC BY 2.0 FR. Each sentence keeps its Tatoeba id and author username; see https://tatoeba.org/en/sentences/show/<id>.',
    files: [
      {
        url: `${TATOEBA_BASE}eng/eng_sentences_detailed.tsv.bz2`,
        file: 'eng_sentences_detailed.tsv.bz2',
        bunzip: true
      },
      {
        url: `${TATOEBA_BASE}vie/vie_sentences_detailed.tsv.bz2`,
        file: 'vie_sentences_detailed.tsv.bz2',
        bunzip: true
      },
      {
        url: `${TATOEBA_BASE}eng/eng-vie_links.tsv.bz2`,
        file: 'eng-vie_links.tsv.bz2',
        bunzip: true
      }
    ]
  }
} satisfies Record<string, SourceDef>

export type SourceId = keyof typeof SOURCES
export const SOURCE_IDS = Object.keys(SOURCES) as SourceId[]

export function isSourceId(id: string): id is SourceId {
  return id in SOURCES
}

/** SourceRef gắn vào từng bản ghi */
export function sourceRef(id: SourceId, extra: Partial<SourceRef> = {}): SourceRef {
  const s = SOURCES[id]
  return { id: s.id, url: s.url, license: s.license, ...extra }
}

export function sourceInfo(id: SourceId): SourceInfo {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { files, ...info } = SOURCES[id]
  return info
}
