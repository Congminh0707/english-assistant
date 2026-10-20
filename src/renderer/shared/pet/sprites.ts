import { normalizeCharacterId } from '@shared/characters'

// Sprite sheet của thú cưng dùng trong cửa sổ Học tập (cùng file với mascot, do
// scripts/sprites/make-characters.mjs sinh). Khung 96×96, 8 cột; hoạt ảnh idle = frame 0–7.
export const FRAME = 96
export const COLUMNS = 8
export const IDLE_FRAMES = 8

const sheetUrls = import.meta.glob('../../mascot/assets/characters/*/*/sheet.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
const accessoryUrls = import.meta.glob('../../mascot/assets/characters/*/*/acc-*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const accessoryBackUrls = import.meta.glob('../../mascot/assets/characters/*/*/accb-*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const base = '../../mascot/assets/characters'

/** URL sheet của một nhân vật ở một giai đoạn; không có thì rơi về baby của nhân vật, rồi Bi */
export function sheetUrl(characterId: string, stage: string): string {
  const char = normalizeCharacterId(characterId)
  return (
    sheetUrls[`${base}/${char}/${stage}/sheet.png`] ??
    sheetUrls[`${base}/${char}/baby/sheet.png`] ??
    sheetUrls[`${base}/bi/baby/sheet.png`] ??
    ''
  )
}

/** URL sheet phụ kiện ('acc:bow') của nhân vật ở giai đoạn đó; undefined nếu chưa có */
/** Lớp sau lưng của phụ kiện (áo choàng, cánh); undefined nếu không có */
export function accessoryBackUrl(
  characterId: string,
  stage: string,
  accessoryId: string
): string | undefined {
  const char = normalizeCharacterId(characterId)
  return accessoryBackUrls[`${base}/${char}/${stage}/accb-${accessoryId.split(':')[1]}.png`]
}

export function accessoryUrl(
  characterId: string,
  stage: string,
  accessoryId: string
): string | undefined {
  const char = normalizeCharacterId(characterId)
  return accessoryUrls[`${base}/${char}/${stage}/acc-${accessoryId.split(':')[1]}.png`]
}
