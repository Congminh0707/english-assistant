// Tách đoạn văn thành từng câu để dịch từng câu một (model dịch máy hay bỏ sót câu sau nếu đưa cả đoạn).

/** Viết tắt phổ biến có dấu chấm — không coi là hết câu */
const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'vs',
  'etc',
  'e.g',
  'i.e',
  'a.m',
  'p.m',
  'no'
])

/** Số ký tự tối đa mỗi câu đưa vào model; câu dài hơn bị cắt ở dấu phẩy/chấm phẩy gần nhất */
const MAX_SENTENCE_CHARS = 260

export function splitSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []

  const sentences: string[] = []
  let start = 0
  const re = /[.!?…]+["')\]”’]*\s+/g
  for (let m = re.exec(clean); m; m = re.exec(clean)) {
    const end = m.index + m[0].length
    const before = clean.slice(start, m.index).split(' ').pop() ?? ''
    // "Mr. Smith", "e.g. this": dấu chấm sau từ viết tắt hoặc chữ cái đơn → chưa hết câu
    if (
      /^\.$/.test(m[0].trim()) &&
      (ABBREVIATIONS.has(before.toLowerCase()) || /^[A-Za-z]$/.test(before) || before.includes('.'))
    )
      continue
    sentences.push(clean.slice(start, end).trim())
    start = end
  }
  if (start < clean.length) sentences.push(clean.slice(start).trim())

  return sentences.flatMap(chunkLong).filter(Boolean)
}

function chunkLong(sentence: string): string[] {
  if (sentence.length <= MAX_SENTENCE_CHARS) return [sentence]
  const parts: string[] = []
  let rest = sentence
  while (rest.length > MAX_SENTENCE_CHARS) {
    const window = rest.slice(0, MAX_SENTENCE_CHARS)
    let cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(': '))
    if (cut < MAX_SENTENCE_CHARS / 2) cut = window.lastIndexOf(' ')
    if (cut <= 0) cut = MAX_SENTENCE_CHARS
    parts.push(rest.slice(0, cut + 1).trim())
    rest = rest.slice(cut + 1).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

/** Câu không có dấu kết thúc làm model dịch không biết dừng (lặp vô hạn) → thêm dấu chấm */
export function ensureTerminalPunctuation(sentence: string): string {
  const s = sentence.trim()
  return /[.!?…]["')\]”’]*$/.test(s) ? s : `${s}.`
}

/** Chuỗi có chữ cái tiếng Việt có dấu → nhiều khả năng là tiếng Việt (chưa hỗ trợ dịch Việt → Anh) */
export function looksVietnamese(text: string): boolean {
  return /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(text)
}

/**
 * Gom các câu liên tiếp thành nhóm ≤ `maxChars` ký tự (một câu dài hơn vẫn đứng riêng một nhóm). Model dịch chất lượng
 * cao dịch cả nhóm 2–3 câu một lần nên đoạn văn mạch lạc hơn (đại từ, từ nhiều nghĩa theo ngữ cảnh) và ít lần gọi hơn.
 */
export function groupSentences(sentences: string[], maxChars: number): string[] {
  const groups: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current && current.length + 1 + sentence.length > maxChars) {
      groups.push(current)
      current = sentence
    } else {
      current = current ? `${current} ${sentence}` : sentence
    }
  }
  if (current) groups.push(current)
  return groups
}
