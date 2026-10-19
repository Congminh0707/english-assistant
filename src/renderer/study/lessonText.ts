// Cú pháp văn bản bài học (xem src/shared/schemas/lesson.ts): đoạn cách nhau bằng dòng trống, "- " là danh sách,
// **đậm**, `cụm tiếng Anh`. Phân tích thành cấu trúc rồi dựng bằng v-for — không dùng v-html (không HTML thô).

export interface Inline {
  kind: 'text' | 'bold' | 'code'
  text: string
}

export type MdBlock = { kind: 'p'; inline: Inline[] } | { kind: 'ul'; items: Inline[][] }

export function parseInline(source: string): Inline[] {
  const out: Inline[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  for (let m = re.exec(source); m; m = re.exec(source)) {
    if (m.index > last) out.push({ kind: 'text', text: source.slice(last, m.index) })
    const token = m[0]
    out.push(
      token.startsWith('**')
        ? { kind: 'bold', text: token.slice(2, -2) }
        : { kind: 'code', text: token.slice(1, -1) }
    )
    last = m.index + token.length
  }
  if (last < source.length) out.push({ kind: 'text', text: source.slice(last) })
  return out
}

export function parseMd(md: string): MdBlock[] {
  const blocks: MdBlock[] = []
  for (const chunk of md.split(/\n\s*\n/)) {
    const lines = chunk.split('\n').filter((l) => l.trim())
    let list: Inline[][] = []
    let paragraph: string[] = []
    const flushParagraph = (): void => {
      if (paragraph.length) blocks.push({ kind: 'p', inline: parseInline(paragraph.join(' ')) })
      paragraph = []
    }
    const flushList = (): void => {
      if (list.length) blocks.push({ kind: 'ul', items: list })
      list = []
    }
    for (const line of lines) {
      if (/^\s*-\s+/.test(line)) {
        flushParagraph()
        list.push(parseInline(line.replace(/^\s*-\s+/, '')))
      } else {
        flushList()
        paragraph.push(line.trim())
      }
    }
    flushParagraph()
    flushList()
  }
  return blocks
}

/** Chuẩn hoá câu trả lời gõ tay để so khớp: chữ thường, bỏ khoảng trắng thừa, nháy cong → thẳng, bỏ dấu câu cuối */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '')
}

export function isGapCorrect(typed: string, answers: string[]): boolean {
  const got = normalizeAnswer(typed)
  return !!got && answers.some((a) => normalizeAnswer(a) === got)
}
