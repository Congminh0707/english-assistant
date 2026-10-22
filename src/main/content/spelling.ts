/** Từ có thể gợi ý khi người dùng gõ sai chính tả */
export interface SpellingCandidate {
  /** Cách viết khớp để so khoảng cách (lemma hoặc dạng chia, chữ thường) */
  text: string
  /** Từ hiển thị gợi ý (lemma) */
  lemma: string
  /** Thứ hạng tần suất (nhỏ = phổ biến); null = không rõ */
  rank: number | null
}

/** Khoảng cách Damerau–Levenshtein (thêm/xoá/thay/đảo chỗ hai ký tự liền kề); vượt `max` trả `max + 1` */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows: number[][] = []
  for (let i = 0; i <= a.length; i++) {
    rows.push(new Array<number>(b.length + 1).fill(0))
    rows[i][0] = i
  }
  for (let j = 0; j <= b.length; j++) rows[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let best = max + 1
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let d = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, rows[i - 2][j - 2] + 1)
      }
      rows[i][j] = d
      best = Math.min(best, d)
    }
    if (best > max) return max + 1
  }
  return rows[a.length][b.length]
}

/**
 * Gợi ý từ gần nhất khi tra không ra (registation → registration). Từ ngắn chỉ cho sai 1 ký tự (tránh gợi ý bừa),
 * từ dài cho sai tối đa 2. Xếp theo khoảng cách rồi độ phổ biến; mỗi lemma chỉ xuất hiện một lần.
 */
export function suggestSpelling(
  query: string,
  candidates: SpellingCandidate[],
  limit = 3
): string[] {
  const q = query.toLowerCase()
  if (!/^[a-z'-]{3,}$/.test(q)) return []
  const max = q.length >= 7 ? 2 : 1
  const best = new Map<string, { d: number; rank: number }>()
  for (const c of candidates) {
    if (Math.abs(c.text.length - q.length) > max) continue
    const d = editDistance(q, c.text, max)
    if (d === 0 || d > max) continue
    const rank = c.rank ?? 1e9
    const prev = best.get(c.lemma)
    if (!prev || d < prev.d || (d === prev.d && rank < prev.rank)) best.set(c.lemma, { d, rank })
  }
  return [...best.entries()]
    .sort((a, b) => a[1].d - b[1].d || a[1].rank - b[1].rank || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([lemma]) => lemma)
}
