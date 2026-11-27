import { registerCharacters } from '@shared/characters'
import type { PackCharacterMeta } from '@shared/schemas/characterPack'
import type { AppI18n } from './i18n'
import { invoke } from './ipc'
import { registerQuirks } from './pet/quirks'

/**
 * Gọi trong main.ts của mỗi cửa sổ, trước khi mount: lấy các gói nhân vật đã cài từ main rồi đăng ký nhân vật
 * (@shared/characters), tên + câu thoại (characters.<id>, mascot.chars.<id>) và hoạt ảnh riêng (pet/quirks).
 * Hình lấy sau, khi cần (PetFigure → characters:art). Lỗi không chặn app: trả [] và app chạy với nhân vật gốc.
 * Trả các nhân vật đã đăng ký (cửa sổ mascot dùng để đăng ký vùng bấm).
 */
export async function loadCharacterPacks(i18n: AppI18n): Promise<PackCharacterMeta[]> {
  try {
    const { packs } = await invoke('characters:packs')
    const out: PackCharacterMeta[] = []
    for (const pack of packs) {
      const added = new Set(
        registerCharacters(
          pack.characters.map(({ id, price, minLevel, emoji, name }) => ({
            id,
            pack: pack.id,
            price,
            minLevel,
            emoji,
            name
          }))
        )
      )
      for (const c of pack.characters) {
        if (!added.has(c.id)) continue
        for (const lang of ['vi', 'en'] as const) {
          const { name, desc, lines } = c.i18n[lang]
          i18n.global.mergeLocaleMessage(lang, {
            characters: { [c.id]: { name, desc } },
            mascot: { chars: { [c.id]: lines } }
          } as never)
        }
        if (c.quirks) registerQuirks(c.id, c.quirks)
        out.push(c)
      }
    }
    return out
  } catch (err) {
    console.warn('[character-pack] không nạp được gói nhân vật', err)
    return []
  }
}
