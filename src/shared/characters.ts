// Các nhân vật thú cưng: 5 nhân vật gốc của dự án (danh sách tĩnh bên dưới) + nhân vật từ gói nhân vật người dùng tự cài
// (file .eapack, cài thủ công trong Cài đặt; main nạp và đăng ký lúc khởi động, renderer đăng ký trước khi mount — sổ đăng ký cuối file).
// Mỗi nhân vật có 5 giai đoạn tiến hoá; level/XP thuộc về hồ sơ nên đổi nhân vật vẫn giữ nguyên tiến độ.
// Hình vẽ: src/renderer/shared/art/pets/<id>.pet.json (sinh bởi scripts/design-data/mascot/export.py); nhân vật của gói: trong file gói.

/** 5 nhân vật gốc, có sẵn trong app */
export const CHARACTER_IDS = ['bi', 'lupo', 'draco', 'robo', 'kitsu'] as const
export type BuiltinCharacterId = (typeof CHARACTER_IDS)[number]
/** Id nhân vật: nhân vật gốc hoặc nhân vật của gói đã cài (đã kiểm tra bằng `isCharacterId`) */
export type CharacterId = string

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
  lupo: { price: 500, minLevel: 5, emoji: '🐺', name: 'Lupo' },
  draco: { price: 700, minLevel: 8, emoji: '🐲', name: 'Draco' },
  robo: { price: 700, minLevel: 8, emoji: '🤖', name: 'Robo' },
  kitsu: { price: 600, minLevel: 5, emoji: '🦊', name: 'Kitsu' }
} as const satisfies Record<BuiltinCharacterId, CharacterDef>

export const DEFAULT_CHARACTER_ID: BuiltinCharacterId = 'bi'

/** Id nhân vật hợp lệ cho gói nhân vật (cũng là tên file/khoá i18n nên chỉ chữ thường, số, gạch nối) */
// Không cho tên thiết bị đặc biệt của Windows (con, nul, com1...) vì id thành tên file `<id>.eapack`
export const PACK_CHARACTER_ID = /^(?!(?:con|prn|aux|nul|com\d|lpt\d)$)[a-z][a-z0-9-]{1,23}$/

const isBuiltin = (id: string): id is BuiltinCharacterId => Object.hasOwn(CHARACTERS, id)

// ---- Sổ đăng ký nhân vật của gói (trạng thái module; không import node/electron/vue) ----

export interface RegisteredCharacter extends CharacterDef {
  id: string
  /** Id gói chứa nhân vật */
  pack: string
}

const registered = new Map<string, RegisteredCharacter>()

/**
 * Đăng ký nhân vật của các gói đã cài. Bỏ qua id sai dạng, trùng nhân vật gốc hoặc trùng nhân vật đã đăng ký
 * (main đã kiểm tra khi cài; đây là chốt chặn cuối). Trả các id đã đăng ký.
 */
export function registerCharacters(defs: readonly RegisteredCharacter[]): string[] {
  const added: string[] = []
  for (const def of defs) {
    if (!PACK_CHARACTER_ID.test(def.id) || isBuiltin(def.id) || registered.has(def.id)) continue
    const { id, pack, price, minLevel, emoji, name } = def
    registered.set(id, { id, pack, price, minLevel, emoji, name })
    added.push(id)
  }
  return added
}

export function clearRegisteredCharacters(): void {
  registered.clear()
}

/** Mọi nhân vật: 5 nhân vật gốc rồi tới nhân vật của gói theo thứ tự đăng ký */
export const allCharacterIds = (): CharacterId[] => [...CHARACTER_IDS, ...registered.keys()]

export function characterDef(id: string): CharacterDef | undefined {
  return isBuiltin(id) ? CHARACTERS[id] : registered.get(id)
}

/** Nhân vật đến từ gói nhân vật đã cài (không phải nhân vật gốc) */
export const isPackCharacter = (id: string): boolean => registered.has(id)

export const isCharacterId = (id: string): id is CharacterId => isBuiltin(id) || registered.has(id)

/**
 * Id nhân vật trong DB: bản cũ lưu 'placeholder' (chính là Bi); id lạ → Bi. Nhân vật của gói đã gỡ cũng về Bi
 * nhưng DB giữ nguyên id, cài lại gói thì nhân vật quay lại.
 */
export function normalizeCharacterId(id: string): CharacterId {
  return isCharacterId(id) ? id : DEFAULT_CHARACTER_ID
}

/** Mã vật phẩm của nhân vật trong túi đồ/cửa hàng: 'char:draco' */
export const characterItemId = (id: CharacterId): string => `char:${id}`

export const isCharacterItem = (itemId: string): boolean =>
  itemId.startsWith('char:') && isCharacterId(itemId.slice(5))

export const characterFromItem = (itemId: string): CharacterId =>
  normalizeCharacterId(itemId.slice(5))
