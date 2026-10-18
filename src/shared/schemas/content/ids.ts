// Id nội dung ổn định — đừng đổi cách sinh id khi đã phát hành pack,
// vì user.db (SRS, saved_words) lưu tham chiếu bằng chuỗi này.

/** Khoá chuẩn hoá của một từ: chữ thường, khoảng trắng → '_' */
export function wordKey(lemma: string): string {
  return lemma.trim().toLowerCase().replace(/\s+/g, '_')
}

/** 'Monday' → 'word:en:monday', 'give up' → 'word:en:give_up' */
export function wordId(lemma: string): string {
  return `word:en:${wordKey(lemma)}`
}

export function tatoebaSentenceId(tatoebaId: number | string): string {
  return `sentence:tatoeba:${tatoebaId}`
}
