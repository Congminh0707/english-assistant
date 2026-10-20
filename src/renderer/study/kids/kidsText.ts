// Lời nói và nhãn của giao diện trẻ em: là nội dung tiếng Anh được đọc to cho bé nghe (như từ vựng, không phải chuỗi
// giao diện của người lớn), nên để ở đây. Chú thích tiếng Việt dành cho phụ huynh đi qua i18n (kids.* trong vi/en.json).

export const PRAISE = ['Yes!', 'Great!', 'Well done!', 'Super!', 'Good job!', 'Wow!']
export const TRY_AGAIN = ['Try again!', 'Oops! Try again!', 'Not quite!']

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

/** Ô trên màn hình chính của bé */
export interface KidsTile {
  id: 'play' | 'abc' | 'stickers' | 'pet'
  /** Id hình pixel */
  picture: string
  /** Câu đọc to và nhãn hiện to */
  say: string
  /** Khoá i18n chú thích tiếng Việt nhỏ cho phụ huynh */
  viKey: string
}

export const TILES: readonly KidsTile[] = [
  { id: 'play', picture: 'ball', say: "Let's play!", viKey: 'kids.tile.play' },
  { id: 'abc', picture: 'apple', say: 'ABC', viKey: 'kids.tile.abc' },
  { id: 'stickers', picture: 'star', say: 'My stickers', viKey: 'kids.tile.stickers' },
  { id: 'pet', picture: 'cat', say: 'My pet', viKey: 'kids.tile.pet' }
]

/** Đồ ăn thưởng → hình pixel */
export const FOOD_PICTURE: Record<string, string> = {
  'food:onigiri': 'rice',
  'food:cake': 'cake',
  'food:watermelon': 'watermelon',
  'food:milk-tea': 'tea',
  'food:birthday-cake': 'cake'
}

/** Tên tiếng Anh của đồ ăn để đọc to */
export const FOOD_NAME: Record<string, string> = {
  'food:onigiri': 'rice',
  'food:cake': 'cake',
  'food:watermelon': 'watermelon',
  'food:milk-tea': 'tea',
  'food:birthday-cake': 'birthday cake'
}
