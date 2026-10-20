// Các nhân vật thú cưng: thiết kế gốc của dự án (không dùng nhân vật có bản quyền).
// Mỗi nhân vật có 5 giai đoạn tiến hoá; level/XP thuộc về hồ sơ nên đổi nhân vật vẫn giữ nguyên tiến độ.
// Sprite: src/renderer/mascot/assets/characters/<id>/<giai đoạn>/ (sinh bởi scripts/sprites/make-characters.mjs).

export const CHARACTER_IDS = ['bi', 'webster', 'draco', 'robo', 'kitsu'] as const
export type CharacterId = (typeof CHARACTER_IDS)[number]

export interface CharacterDef {
  /** Giá mua (xu); 0 = có sẵn */
  price: number
  /** Level thú cưng tối thiểu để mua */
  minLevel: number
  emoji: string
  /** Tên mặc định hiển thị khi chưa đặt tên riêng */
  name: string
}

export const CHARACTERS = {
  bi: { price: 0, minLevel: 0, emoji: '🐣', name: 'Bi' },
  webster: { price: 500, minLevel: 5, emoji: '🕷️', name: 'Webby' },
  draco: { price: 700, minLevel: 8, emoji: '🐲', name: 'Draco' },
  robo: { price: 700, minLevel: 8, emoji: '🤖', name: 'Robo' },
  kitsu: { price: 600, minLevel: 5, emoji: '🦊', name: 'Kitsu' }
} as const satisfies Record<CharacterId, CharacterDef>

export const DEFAULT_CHARACTER_ID: CharacterId = 'bi'

export const isCharacterId = (id: string): id is CharacterId => id in CHARACTERS

/** Id nhân vật trong DB: bản cũ lưu 'placeholder' (chính là Bi); id lạ → Bi */
export function normalizeCharacterId(id: string): CharacterId {
  return isCharacterId(id) ? id : DEFAULT_CHARACTER_ID
}

/** Mã vật phẩm của nhân vật trong túi đồ/cửa hàng: 'char:draco' */
export const characterItemId = (id: CharacterId): string => `char:${id}`

export const isCharacterItem = (itemId: string): boolean =>
  itemId.startsWith('char:') && isCharacterId(itemId.slice(5))

export const characterFromItem = (itemId: string): CharacterId =>
  normalizeCharacterId(itemId.slice(5))
