// Tách từ tiếng Anh đơn giản cho thống kê tần suất và chọn câu ví dụ.
const TOKEN_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g

export interface Token {
  /** Như trong câu (giữ hoa/thường) */
  raw: string
  /** Chữ thường, dấu nháy cong → thẳng */
  norm: string
}

export function tokenize(text: string): Token[] {
  const out: Token[] = []
  for (const m of text.matchAll(TOKEN_RE)) {
    const raw = m[0].replace(/’/g, "'")
    out.push({ raw, norm: raw.toLowerCase() })
  }
  return out
}

/** "don't" → ["don't", "do"]; "Tom's" → ["tom's", "tom"] — để quy dạng rút gọn về lemma */
export function tokenVariants(norm: string): string[] {
  const out = [norm]
  const m = /^(.+?)('s|'re|'ve|'ll|'d|'m|n't)$/.exec(norm)
  if (m) {
    let base = m[1]
    if (m[2] === "n't") {
      if (base === 'wo') base = 'will'
      else if (base === 'ca') base = 'can'
      else if (base === 'sha') base = 'shall'
    }
    out.push(base)
  }
  return out
}

/** Từ chỉ gồm chữ cái (có thể có '-' hoặc ''' bên trong) */
export function isPlainWord(w: string): boolean {
  return /^[A-Za-z]+(?:['-][A-Za-z]+)*$/.test(w)
}

/** Bỏ ngoặc, ghi chú thừa trong một bản dịch/định nghĩa */
export function cleanGloss(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()
}

const STOP = new Set(
  'a an the of to in on at for by with from and or but as is be are was were it its this that these those something someone one which who whom what used person thing'.split(
    ' '
  )
)

/** Các từ nội dung (chữ thường) — dùng so khớp nhãn nghĩa của bảng dịch với định nghĩa */
export function contentWords(s: string): Set<string> {
  return new Set(
    tokenize(s)
      .map((t) => t.norm)
      .filter((w) => w.length > 1 && !STOP.has(w))
  )
}
