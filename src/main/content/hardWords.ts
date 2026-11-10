// Từ khó của bài đọc (docs/07-learning-modules.md#5): dùng chung cho kênh `dictionary:levels` (gạch chân từ trong
// trình đọc) và việc tự lưu từ khó vào sổ từ khi lần đầu đạt bài đọc. Không import electron.
import { LEVEL_CODES, levelIndex, type LevelCode } from '@shared/schemas/content/level'
import { tokenizeWords } from '@shared/properNouns'
import { splitSentences } from '@shared/sentences'
import type { DictionaryService } from './DictionaryService'

/** Số từ tối đa tự lưu cho mỗi bài đọc */
export const AUTO_SAVE_MAX = 8

export interface WordLevel {
  /** contentId của mục từ điển ('word:en:go') */
  id: string
  /** Mã level của mục từ ('A1_1'…); mã lạ không bao giờ tính là từ khó */
  level: string
}

/** Mục từ điển của một từ (từ gốc hoặc dạng biến tố; bỏ kết quả tìm theo nghĩa Việt) */
export function wordLevel(
  dictionary: DictionaryService,
  word: string,
  childSafe: boolean
): WordLevel | undefined {
  const entry = dictionary.lookup(word, undefined, { childSafe }).entries[0]
  return entry && entry.via !== 'search' ? { id: entry.id, level: entry.level } : undefined
}

/** Level theo từng từ (chữ thường) — kết quả của kênh `dictionary:levels` */
export function wordLevels(
  dictionary: DictionaryService,
  words: string[],
  childSafe: boolean
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const word of new Set(words.map((w) => w.toLowerCase()))) {
    const found = wordLevel(dictionary, word, childSafe)
    if (found) out[word] = found.level
  }
  return out
}

/** Khoá so khớp giống trình đọc: chữ thường, nháy cong → nháy thẳng */
const key = (w: string): string => w.toLowerCase().replace(/’/g, "'")

/**
 * Chọn từ khó hơn level người học trong các đoạn văn: theo thứ tự xuất hiện, bỏ tên riêng, bỏ từ đã có
 * trong sổ (theo contentId), gộp các dạng của cùng một mục từ; mỗi từ kèm câu đầu tiên chứa nó làm ngữ cảnh.
 */
export function pickHardWords(
  paragraphs: string[],
  lookup: (word: string) => WordLevel | undefined,
  userLevel: LevelCode,
  alreadySaved: Set<string>,
  max = AUTO_SAVE_MAX
): Array<{ text: string; context: string }> {
  const user = levelIndex(userLevel)
  const seenWords = new Set<string>()
  const seenIds = new Set(alreadySaved)
  const out: Array<{ text: string; context: string }> = []
  for (const paragraph of paragraphs) {
    for (const sentence of splitSentences(paragraph)) {
      for (const token of tokenizeWords(sentence)) {
        if (token.proper) continue
        const text = key(token.text)
        if (seenWords.has(text)) continue
        seenWords.add(text)
        const found = lookup(text)
        if (
          !found ||
          LEVEL_CODES.indexOf(found.level as LevelCode) <= user ||
          seenIds.has(found.id)
        )
          continue
        seenIds.add(found.id)
        out.push({ text, context: sentence })
        if (out.length >= max) return out
      }
    }
  }
  return out
}
