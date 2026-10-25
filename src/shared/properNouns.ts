// Nhận diện tên riêng trong một câu tiếng Anh để bài đọc không tra/lưu chúng như từ thường
// (Hue ≠ hue "màu sắc", Da Nang ≠ da). Thuần chuỗi, dùng được ở main lẫn renderer.

export interface WordToken {
  text: string
  index: number
  /** Tên riêng / từ viết tắt: không tra, không lưu */
  proper: boolean
}

const WORD = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g
const CAPITALIZED = /^[A-Z][a-z]/
const ACRONYM = /^[A-Z]{2,}$/
/** Ký tự mở đầu một mệnh đề mới ngay trước từ: ngoặc, nháy, sau dấu hai chấm */
const CLAUSE_OPEN = /(?:^|[("“‘[—–]|[:;]\s)\s*$/

/** Tách từ trong câu và đánh dấu tên riêng theo quy tắc chuẩn của tiếng Anh viết hoa */
export function tokenizeWords(sentence: string): WordToken[] {
  const matches = [...sentence.matchAll(WORD)]
  const isCap = (text: string): boolean => CAPITALIZED.test(text) || ACRONYM.test(text)

  // Tiêu đề viết hoa từng chữ ("Good Morning, My Friends"): viết hoa không có nghĩa là tên riêng
  const capCount = matches.filter((m) => isCap(m[0])).length
  const titleCase = matches.length >= 4 && capCount / matches.length >= 0.7

  const adjacent = (a: RegExpMatchArray, b: RegExpMatchArray | undefined): boolean =>
    !!b && b.index === a.index! + a[0].length + 1 && sentence[a.index! + a[0].length] === ' '

  return matches.map((m, n) => {
    const text = m[0]
    const index = m.index!
    let proper = false
    if (!titleCase && text !== 'I' && !/^I['’]/.test(text) && isCap(text)) {
      if (ACRONYM.test(text)) {
        proper = true
      } else {
        const before = sentence.slice(0, index)
        const startsClause = n === 0 || CLAUSE_OPEN.test(before)
        const chained =
          (adjacent(m, matches[n + 1]) && isCap(matches[n + 1][0])) ||
          (n > 0 && adjacent(matches[n - 1], m) && isCap(matches[n - 1][0]))
        // Đầu câu/mệnh đề chỉ là tên riêng khi đi liền một chữ viết hoa khác ("Da Nang is…")
        proper = startsClause ? chained : true
      }
    }
    return { text, index, proper }
  })
}
