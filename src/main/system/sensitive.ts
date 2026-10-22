/**
 * Chuỗi có vẻ là dữ liệu nhạy cảm (mật khẩu, token, OTP, số thẻ) → không xử lý, không lưu
 * (docs/16-privacy-and-security.md#2).
 */
export function looksSensitive(text: string): boolean {
  const t = text.trim()
  if (!t || /\s/.test(t)) return false
  if (/^\d[\d -]{5,}$/.test(t)) return true // OTP, số thẻ, số tài khoản
  if (t.length >= 12) {
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(t)).length
    if (kinds >= 3) return true // chuỗi kiểu mật khẩu / API key
  }
  return /^(sk|pk|ghp|gho|xox[bp])[-_]/i.test(t)
}
