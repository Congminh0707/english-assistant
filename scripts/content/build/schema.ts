// Cấu trúc content.db (schemaVersion 1) — docs/10-data-model.md §4.
// Cột hay lọc/sắp xếp tách riêng có index; bản ghi đầy đủ (đã validate zod) nằm trong `data` JSON.
export const CONTENT_DB_SCHEMA = /* sql */ `
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE sources (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  license     TEXT NOT NULL,
  attribution TEXT NOT NULL
);

CREATE TABLE words (
  id        TEXT PRIMARY KEY,           -- 'word:en:go'
  lemma     TEXT NOT NULL,
  pos       TEXT NOT NULL,              -- JSON array
  ipa_us    TEXT,
  ipa_uk    TEXT,
  level     TEXT NOT NULL,              -- 'A1_1' ... 'C2'
  freq_rank INTEGER,
  lists     TEXT NOT NULL,              -- JSON array: ngsl, tsl, cefrj...
  vi_short  TEXT,                       -- nghĩa ngắn cho popup
  sensitive INTEGER NOT NULL DEFAULT 0, -- 1 = từ nhạy cảm, ẩn ở profile trẻ em
  data      TEXT NOT NULL               -- JSON Word đầy đủ
);
CREATE INDEX words_lemma ON words (lemma COLLATE NOCASE);
CREATE INDEX words_level ON words (level, freq_rank);
CREATE INDEX words_freq ON words (freq_rank);

-- Dạng đã chia / cách viết khác → lemma: 'went' → 'word:en:go'
CREATE TABLE word_forms (
  form    TEXT NOT NULL,                -- chữ thường
  word_id TEXT NOT NULL,
  tags    TEXT NOT NULL,                -- JSON array: past, plural, alternative...
  PRIMARY KEY (form, word_id)
) WITHOUT ROWID;

-- Tìm kiếm toàn văn: tiền tố tiếng Anh + tra ngược tiếng Việt (bỏ dấu được: 'tao' khớp 'táo')
CREATE VIRTUAL TABLE words_fts USING fts5(
  word_id UNINDEXED,
  lemma,
  vi_meanings,
  tokenize = 'unicode61 remove_diacritics 2',
  prefix = '2 3'
);

CREATE TABLE sentences (
  id     TEXT PRIMARY KEY,              -- 'sentence:tatoeba:1277'
  en     TEXT NOT NULL,
  vi     TEXT,                          -- bản dịch đầu tiên (nếu có)
  level  TEXT NOT NULL,
  audio  TEXT,
  source TEXT NOT NULL,                 -- JSON SourceRef
  data   TEXT NOT NULL                  -- JSON Sentence đầy đủ
);
CREATE INDEX sentences_level ON sentences (level);

CREATE TABLE sentence_words (
  word_id     TEXT NOT NULL,
  sentence_id TEXT NOT NULL,
  PRIMARY KEY (word_id, sentence_id)
) WITHOUT ROWID;

CREATE TABLE decks (
  id       TEXT PRIMARY KEY,            -- 'deck:level:a1-1'
  kind     TEXT NOT NULL,               -- level | topic | exam | list
  level    TEXT NOT NULL,
  tracks   TEXT NOT NULL,               -- JSON array
  title    TEXT NOT NULL,               -- JSON {vi, en}
  word_ids TEXT NOT NULL,               -- JSON array
  data     TEXT NOT NULL
);
`
