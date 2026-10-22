// Cửa hàng: đồ ăn (đã có trong pet.ts) và phụ kiện cho mascot — định nghĩa thuần, dùng ở main, renderer và test.
// docs/06-levels-and-progression.md (cửa hàng), docs/05-mascot-system.md (phụ kiện)

import { CHARACTERS, characterItemId, CHARACTER_IDS, isCharacterItem } from './characters'
import { FOODS, isFoodId } from './pet'

/** Vị trí đeo: mỗi vị trí chỉ đeo được một món */
export type AccessorySlot = 'head' | 'face' | 'neck' | 'back'

export interface AccessoryDef {
  price: number
  emoji: string
  slot: AccessorySlot
  /** Level thú cưng tối thiểu để mua (0 = không yêu cầu) */
  minLevel: number
}

export const ACCESSORIES = {
  'acc:bow': { price: 30, emoji: '🎀', slot: 'head', minLevel: 0 },
  'acc:glasses': { price: 60, emoji: '👓', slot: 'face', minLevel: 0 },
  'acc:scarf': { price: 80, emoji: '🧣', slot: 'neck', minLevel: 0 },
  'acc:hat': { price: 120, emoji: '🎩', slot: 'head', minLevel: 5 },
  'acc:crown': { price: 300, emoji: '👑', slot: 'head', minLevel: 10 },
  'acc:flower': { price: 40, emoji: '🌸', slot: 'head', minLevel: 0 },
  'acc:party-hat': { price: 70, emoji: '🥳', slot: 'head', minLevel: 0 },
  'acc:headphones': { price: 150, emoji: '🎧', slot: 'head', minLevel: 5 },
  'acc:sunglasses': { price: 90, emoji: '🕶️', slot: 'face', minLevel: 3 },
  'acc:cape': { price: 200, emoji: '🦸', slot: 'back', minLevel: 8 },
  'acc:wings': { price: 450, emoji: '🪽', slot: 'back', minLevel: 15 },
  'acc:bowtie': { price: 70, emoji: '🎀', slot: 'neck', minLevel: 0 },
  'acc:cap': { price: 60, emoji: '🧢', slot: 'head', minLevel: 2 },
  'acc:cat-ears': { price: 90, emoji: '🐱', slot: 'head', minLevel: 2 },
  'acc:backpack': { price: 180, emoji: '🎒', slot: 'back', minLevel: 3 },
  'acc:eyepatch': { price: 100, emoji: '🏴‍☠️', slot: 'face', minLevel: 4 },
  'acc:mask': { price: 130, emoji: '🥷', slot: 'face', minLevel: 6 },
  'acc:witch-hat': { price: 160, emoji: '🧙', slot: 'head', minLevel: 6 },
  'acc:medal': { price: 220, emoji: '🏅', slot: 'neck', minLevel: 10 },
  'acc:halo': { price: 350, emoji: '😇', slot: 'head', minLevel: 12 }
} as const satisfies Record<string, AccessoryDef>

export type AccessoryId = keyof typeof ACCESSORIES

export const isAccessoryId = (id: string): id is AccessoryId => id in ACCESSORIES

/** Thứ tự vẽ các lớp phụ kiện (lớp sau đè lên lớp trước) */
export const ACCESSORY_DRAW_ORDER: AccessoryId[] = [
  'acc:wings',
  'acc:cape',
  'acc:backpack',
  'acc:scarf',
  'acc:bowtie',
  'acc:medal',
  'acc:glasses',
  'acc:sunglasses',
  'acc:eyepatch',
  'acc:mask',
  'acc:bow',
  'acc:flower',
  'acc:cat-ears',
  'acc:party-hat',
  'acc:cap',
  'acc:hat',
  'acc:witch-hat',
  'acc:headphones',
  'acc:halo',
  'acc:crown'
]

/** Số đồ ăn tối đa trong túi mỗi loại */
export const MAX_FOOD_STACK = 99

export interface ShopEntry {
  id: string
  kind: 'food' | 'accessory' | 'character'
  price: number
  emoji: string
  minLevel: number
  slot: AccessorySlot | null
}

/** Danh mục cửa hàng: đồ ăn có giá + phụ kiện (đồ ăn chỉ có qua phần thưởng thì không bán) */
export function shopCatalog(): ShopEntry[] {
  const foods = Object.entries(FOODS)
    .filter(([, def]) => def.price !== null)
    .map(([id, def]) => ({
      id,
      kind: 'food' as const,
      price: def.price as number,
      emoji: def.emoji,
      minLevel: 0,
      slot: null
    }))
  const accessories = Object.entries(ACCESSORIES).map(([id, def]) => ({
    id,
    kind: 'accessory' as const,
    price: def.price,
    emoji: def.emoji,
    minLevel: def.minLevel,
    slot: def.slot
  }))
  const characters = CHARACTER_IDS.filter((id) => CHARACTERS[id].price > 0).map((id) => ({
    id: characterItemId(id),
    kind: 'character' as const,
    price: CHARACTERS[id].price,
    emoji: CHARACTERS[id].emoji,
    minLevel: CHARACTERS[id].minLevel,
    slot: null
  }))
  return [...foods, ...accessories, ...characters]
}

/** Danh sách phụ kiện đang đeo sau khi bật/tắt một món (một vị trí một món) */
export function toggleEquipped(equipped: string[], id: AccessoryId, wear: boolean): AccessoryId[] {
  const current = equipped.filter(isAccessoryId)
  const slot = ACCESSORIES[id].slot
  const without = current.filter((x) => x !== id && ACCESSORIES[x].slot !== slot)
  return wear ? [...without, id] : current.filter((x) => x !== id)
}

export const isShopItem = (id: string): boolean =>
  isFoodId(id) || isAccessoryId(id) || isCharacterItem(id)

/** Đọc cột `equipped` (JSON) an toàn: sai định dạng/id lạ → bỏ */
export function parseEquipped(json: string): string[] {
  try {
    const data: unknown = JSON.parse(json)
    return Array.isArray(data)
      ? data.filter((x): x is string => typeof x === 'string' && x in ACCESSORIES)
      : []
  } catch {
    return []
  }
}
