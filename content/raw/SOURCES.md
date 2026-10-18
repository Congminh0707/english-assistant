# content/raw — nguồn dữ liệu thô

> File này được sinh bởi `pnpm content:fetch` từ `scripts/content/sources.ts` + `content/raw/sources.lock.json`.
> Dữ liệu thô **không** commit (xem `.gitignore`); chỉ commit file này để biết chính xác đã tải gì, khi nào, checksum nào.
> Chính sách license: [docs/08-content-sources.md](../../docs/08-content-sources.md).

## `ngsl` — New General Service List (NGSL) 1.2

- Trang nguồn: https://www.newgeneralservicelist.com/new-general-service-list
- License: `CC-BY-SA-4.0` (https://creativecommons.org/licenses/by-sa/4.0/)
- Ghi công: Browne, C., Culligan, B., & Phillips, J. (2013). The New General Service List (version 1.2). newgeneralservicelist.com. Licensed under CC BY-SA 4.0. Used: frequency ranks and lemma word families.

| File | URL | Ngày tải (UTC) | Kích thước | sha256 |
|---|---|---|---|---|
| `NGSL_12_stats.csv` | https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv | 2026-10-18 07:31 | 62,566 B | `2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44` |
| `NGSL_12_lemmatized_for_teaching.csv` | https://www.newgeneralservicelist.com/s/NGSL_12_lemmatized_for_teaching.csv | 2026-10-18 07:31 | 73,146 B | `b54e297244988237457e04f823aa8dca68e3d646938dc76d383e099f04cb7666` |
| `SUP_lemmatized.csv` | https://www.newgeneralservicelist.com/s/SUP_lemmatized.csv | 2026-10-18 07:31 | 1,631 B | `7bb4c76cbe43ae87240be4ac7ada370b9e1a0d9d631d8c4430138646965d03f6` |

## `tsl` — TOEIC Service List (TSL) 1.2

- Trang nguồn: https://www.newgeneralservicelist.com/toeic-service-list
- License: `CC-BY-SA-4.0` (https://creativecommons.org/licenses/by-sa/4.0/)
- Ghi công: Browne, C., & Culligan, B. (2016). The TOEIC Service List (version 1.2). newgeneralservicelist.com. Licensed under CC BY-SA 4.0. Used: frequency ranks and lemma word families.

| File | URL | Ngày tải (UTC) | Kích thước | sha256 |
|---|---|---|---|---|
| `TSL_12_stats.csv` | https://www.newgeneralservicelist.com/s/TSL_12_stats.csv | 2026-10-18 07:31 | 32,010 B | `2259df25a1077b04067ef0c0e9e4c98b46c91e4d539741dfaceba88651ff486d` |
| `TSL_12_lemmatized_for_teaching.csv` | https://www.newgeneralservicelist.com/s/TSL_12_lemmatized_for_teaching.csv | 2026-10-18 07:31 | 31,067 B | `aca322f1e8b55c9c85e8b9f04ea384a2fcb069019e6e77fff3eb141ee2b67929` |

## `cefrj` — CEFR-J Wordlist Version 1.5

- Trang nguồn: https://github.com/openlanguageprofiles/olp-en-cefrj
- License: `CEFR-J`
- Ghi công: The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies. Retrieved from http://www.cefr-j.org/download.html on 1/20/2020. Copyright Tono Laboratory, TUFS; free for research and commercial use with citation. Distributed via Open Language Profiles (github.com/openlanguageprofiles/olp-en-cefrj).

| File | URL | Ngày tải (UTC) | Kích thước | sha256 |
|---|---|---|---|---|
| `cefrj-vocabulary-profile-1.5.csv` | https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv | 2026-10-18 07:31 | 233,214 B | `b0dd3c635f1c9a4fdf1490c7e5b7c48e8bbe55b652ad0c9860a95f98e10ae498` |
| `README.md` | https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/README.md | 2026-10-18 07:31 | 1,956 B | `8b69f7366fa3c7be328cb9ba02ceb7b3725697f36125bb75b85131d664b5e359` |

## `octanove` — Octanove Vocabulary Profile C1/C2 (ver 1.0)

- Trang nguồn: https://github.com/openlanguageprofiles/olp-en-cefrj
- License: `CC-BY-SA-4.0` (https://creativecommons.org/licenses/by-sa/4.0/)
- Ghi công: Octanove Vocabulary Profile C1/C2 (ver 1.0), created by Octanove Labs (octanove.com), distributed via Open Language Profiles. Licensed under CC BY-SA 4.0.

| File | URL | Ngày tải (UTC) | Kích thước | sha256 |
|---|---|---|---|---|
| `octanove-vocabulary-profile-c1c2-1.0.csv` | https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv | 2026-10-18 07:31 | 46,462 B | `18c33a407f2f89f7b8de9671c6d45fe3ea0bce45e7d2d7dcaab48d73e0f7b380` |

## `cmudict` — CMU Pronouncing Dictionary

- Trang nguồn: https://github.com/cmusphinx/cmudict
- License: `BSD-2-Clause`
- Ghi công: Copyright (C) 1993-2015 Carnegie Mellon University. All rights reserved. US pronunciations converted from ARPAbet to IPA. Full license text below.

| File | URL | Ngày tải (UTC) | Kích thước | sha256 |
|---|---|---|---|---|
| `cmudict.dict` | https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict | 2026-10-18 07:31 | 3,618,488 B | `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22` |
| `LICENSE` | https://raw.githubusercontent.com/cmusphinx/cmudict/master/LICENSE | 2026-10-18 07:31 | 1,754 B | `bd4ce8e44170a5f9f481310ca85c51de3c4f851a65e679b40e603b143bd3542a` |

## `wiktionary` — English Wiktionary (via kaikki.org / wiktextract)

- Trang nguồn: https://kaikki.org/dictionary/English/
- License: `CC-BY-SA-4.0` (https://creativecommons.org/licenses/by-sa/4.0/)
- Ghi công: Wiktionary contributors, English Wiktionary (en.wiktionary.org), dual-licensed CC BY-SA 4.0 and GFDL. Machine-readable extraction by Tatu Ylonen, "Wiktextract: Wiktionary as Machine-Readable Structured Data", LREC 2022 (kaikki.org). Used: parts of speech, English glosses, IPA, inflected forms, usage examples and Vietnamese translations; entries were filtered and reformatted.

| File | URL | Ngày tải (UTC) | Kích thước | sha256 |
|---|---|---|---|---|
| `kaikki.org-dictionary-English.jsonl.gz` | https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz | 2026-10-18 07:33 | 523,331,798 B | `6d40e0067718aeb3321db30297761ca803838390627111a29a5426fee4557faf` |
| `kaikki.org-dictionary-Vietnamese.jsonl` | https://kaikki.org/dictionary/Vietnamese/kaikki.org-dictionary-Vietnamese.jsonl | 2026-10-18 07:33 | 82,772,100 B | `ba64fae8301bf3f383a82bb178f2370309d31b3bcb3a92e9b0c9e04aeb6ecc16` |

## `english-assistant` — English Assistant content pipeline

- Trang nguồn: https://github.com/Congminh0707/english-assistant
- License: `CC-BY-SA-4.0` (https://creativecommons.org/licenses/by-sa/4.0/)
- Ghi công: Level tags and level decks compiled by the English Assistant project from CEFR-J, Octanove, NGSL and TSL (see their entries). As an adaptation of CC BY-SA material it is licensed under CC BY-SA 4.0.

_Nguồn nội bộ — không có dữ liệu tải về._

## `tatoeba` — Tatoeba

- Trang nguồn: https://tatoeba.org/en/downloads
- License: `CC-BY-2.0-FR` (https://creativecommons.org/licenses/by/2.0/fr/)
- Ghi công: Sentences and translation links from Tatoeba (tatoeba.org), licensed under CC BY 2.0 FR. Each sentence keeps its Tatoeba id and author username; see https://tatoeba.org/en/sentences/show/<id>.

| File | URL | Ngày tải (UTC) | Kích thước | sha256 |
|---|---|---|---|---|
| `eng_sentences_detailed.tsv.bz2` | https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_detailed.tsv.bz2 | 2026-10-18 07:33 | 34,943,159 B | `24f742143d9079308d8c6b9c8cb4f6efb54e908a37d27fd5e40f22ab841b3d0d` |
| `vie_sentences_detailed.tsv.bz2` | https://downloads.tatoeba.org/exports/per_language/vie/vie_sentences_detailed.tsv.bz2 | 2026-10-18 07:33 | 639,675 B | `08fd0e4ac153d97c01603c44175df41e4d3a431bf640ab02cf6dba284cea4183` |
| `eng-vie_links.tsv.bz2` | https://downloads.tatoeba.org/exports/per_language/eng/eng-vie_links.tsv.bz2 | 2026-10-18 07:33 | 140,807 B | `b9a6b2b33f8cca9048ddbda54a2f16cc283073346a8f3a27717902816df6cfe8` |
