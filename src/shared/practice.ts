// Chấm bài luyện tập — phần thuần (không phụ thuộc electron/DB), dùng ở main và test.

/** Tách câu thành các từ chuẩn hoá để so sánh: chữ thường, bỏ dấu câu ở hai đầu, giữ ' và - ở giữa từ */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''))
    .filter(Boolean)
}

/** Hai câu giống nhau (bỏ qua hoa/thường và dấu câu)? */
export function sameSentence(a: string, b: string): boolean {
  const x = normalizeWords(a)
  const y = normalizeWords(b)
  return x.length === y.length && x.every((w, i) => w === y[i])
}

/** Tỉ lệ từ đúng khi chép chính tả: độ dài dãy con chung dài nhất (theo từ) / số từ của câu gốc */
export function dictationAccuracy(expected: string, typed: string): number {
  const a = normalizeWords(expected)
  const b = normalizeWords(typed)
  if (!a.length) return 0
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  // Gõ thừa từ cũng bị trừ: chia cho số từ lớn hơn
  return dp[a.length][b.length] / Math.max(a.length, b.length)
}

/** Chép chính tả đạt khi đúng từ 90% từ trở lên */
export const DICTATION_PASS = 0.9

/** `order` có phải hoán vị của 0..n-1 không */
export function isPermutation(order: number[], n: number): boolean {
  return order.length === n && new Set(order).size === n && order.every((i) => i >= 0 && i < n)
}
