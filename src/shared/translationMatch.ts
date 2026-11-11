// So khớp câu dịch Việt → Anh với các đáp án mẫu (dạng bài `translate`) — phần thuần, dùng ở main, renderer và test.
// Bỏ qua: hoa/thường, khoảng trắng thừa, dấu câu (đầu/cuối từ, kể cả dấu phẩy giữa câu), nháy cong/thẳng.
// Dạng viết tắt phổ biến được coi như dạng đầy đủ ("I'm" = "I am", "don't" = "do not", "can't" = "cannot" = "can not").
// "'s" sau đại từ / từ để hỏi là "is" hoặc "has"; "'d" là "would" hoặc "had" (thử cả hai). Sở hữu cách ("Lan's") giữ nguyên.
import { normalizeWords } from './practice'

/** Từ đứng trước "'s" thì "'s" là is/has (không phải sở hữu cách) */
const S_IS_HAS = new Set([
  'he',
  'she',
  'it',
  'that',
  'this',
  'there',
  'here',
  'what',
  'who',
  'where',
  'when',
  'how',
  'why',
  'everyone',
  'everybody',
  'someone',
  'somebody',
  'nobody',
  'nothing',
  'everything',
  'something'
])

/** Dạng phủ định viết tắt không theo quy tắc "bỏ n't" */
const IRREGULAR_NT: Record<string, string[]> = {
  "won't": ['will', 'not'],
  "can't": ['can', 'not'],
  "shan't": ['shall', 'not']
}

/** Giới hạn số dạng chuẩn hoá của một câu (câu nhiều chỗ mơ hồ không làm bùng nổ tổ hợp) */
const MAX_FORMS = 64

/** Các cách khai triển một từ (mỗi cách là một dãy từ) */
function expand(word: string): string[][] {
  if (word === 'cannot') return [['can', 'not']]
  if (IRREGULAR_NT[word]) return [IRREGULAR_NT[word]]
  const m = /^(.+?)('m|'re|'ve|'ll|'d|'s|n't)$/.exec(word)
  if (!m) return [[word]]
  const [, stem, suffix] = m
  switch (suffix) {
    case "n't":
      return [[stem, 'not']]
    case "'m":
      return [[stem, 'am']]
    case "'re":
      return [[stem, 'are']]
    case "'ve":
      return [[stem, 'have']]
    case "'ll":
      return [[stem, 'will']]
    case "'d":
      return [
        [stem, 'would'],
        [stem, 'had']
      ]
    default:
      // 's
      if (stem === 'let') return [['let', 'us']]
      return S_IS_HAS.has(stem)
        ? [
            [stem, 'is'],
            [stem, 'has']
          ]
        : [[word]]
  }
}

/** Mọi dạng chuẩn hoá (đã khai triển viết tắt) của một câu, mỗi dạng là các từ nối bằng dấu cách; câu rỗng → [] */
export function translationForms(text: string): string[] {
  const words = normalizeWords(text)
  if (words.length === 0) return []
  let forms: string[][] = [[]]
  for (const word of words) {
    const options = expand(word)
    const next: string[][] = []
    for (const f of forms) {
      for (const o of options) {
        if (next.length >= MAX_FORMS) break
        next.push([...f, ...o])
      }
    }
    forms = next
  }
  return forms.map((f) => f.join(' '))
}

/** Câu người học khớp một trong các đáp án mẫu (sau chuẩn hoá)? */
export function matchesTranslation(text: string, answers: readonly string[]): boolean {
  const mine = new Set(translationForms(text))
  if (mine.size === 0) return false
  return answers.some((a) => translationForms(a).some((f) => mine.has(f)))
}
