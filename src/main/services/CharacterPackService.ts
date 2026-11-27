import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'
import type { RegisteredCharacter } from '@shared/characters'
import {
  CHARACTER_PACK_EXT,
  CHARACTER_PACK_MAX_BYTES,
  CharacterPackSchema,
  packSecurityProblems,
  type CharacterPack,
  type CharacterPackInfo,
  type PetArt
} from '@shared/schemas/characterPack'
import { AppError } from '../core/AppError'

/** Gói không hợp lệ: `reason` chỉ để ghi log (không chứa nội dung người dùng), renderer hiện errors.characterPackInvalid */
export class CharacterPackError extends AppError {
  constructor(readonly reason: string) {
    super('CHARACTER_PACK_INVALID', 'errors.characterPackInvalid', reason)
  }
}

interface LoadedPack {
  pack: CharacterPack
  file: string
}

/**
 * Gói nhân vật (.eapack) người dùng tự cài: mỗi gói một file JSON trong `dir` (userData/character-packs).
 * Nạp lúc khởi động (gói hỏng bị bỏ qua + ghi log, app vẫn chạy), kiểm tra kỹ khi cài vì hình vẽ của gói đi thẳng vào
 * innerHTML của PetFigure: schema chặt, giới hạn cỡ file, id nhân vật không trùng nhân vật gốc / gói khác, quét svg/css.
 * Gỡ gói chỉ xoá file: DB (pet_states.character_id, túi đồ) giữ nguyên, id lạ tự về Bi, cài lại là có lại.
 */
export class CharacterPackService {
  private packs = new Map<string, LoadedPack>()

  constructor(private readonly deps: { dir: string; log?: (message: string) => void }) {}

  private log(message: string): void {
    ;(this.deps.log ?? console.warn)(`[character-pack] ${message}`)
  }

  /** Đọc lại mọi gói trong thư mục */
  load(): void {
    this.packs.clear()
    let files: string[]
    try {
      files = readdirSync(this.deps.dir)
        .filter((f) => f.toLowerCase().endsWith(CHARACTER_PACK_EXT))
        .sort()
    } catch {
      return // chưa có thư mục = chưa cài gói nào
    }
    for (const name of files) {
      const file = join(this.deps.dir, name)
      try {
        if (statSync(file).size > CHARACTER_PACK_MAX_BYTES) throw new CharacterPackError('quá cỡ')
        const pack = this.validate(readFileSync(file, 'utf8'))
        if (this.packs.has(pack.id)) throw new CharacterPackError(`trùng id gói ${pack.id}`)
        this.packs.set(pack.id, { pack, file })
      } catch (err) {
        this.log(`bỏ qua ${name}: ${err instanceof CharacterPackError ? err.reason : String(err)}`)
      }
    }
  }

  /** Gói đã cài, không kèm hình */
  list(): CharacterPackInfo[] {
    return [...this.packs.values()].map(({ pack }) => ({
      id: pack.id,
      name: pack.name,
      version: pack.version,
      characters: pack.characters.map(
        ({ id, price, minLevel, emoji, name, i18n, hit, quirks }) => ({
          id,
          price,
          minLevel,
          emoji,
          name,
          i18n,
          hit,
          quirks
        })
      )
    }))
  }

  /** Nhân vật của mọi gói để đăng ký vào sổ của @shared/characters */
  characters(): RegisteredCharacter[] {
    return [...this.packs.values()].flatMap(({ pack }) =>
      pack.characters.map((c) => ({
        id: c.id,
        pack: pack.id,
        price: c.price,
        minLevel: c.minLevel,
        emoji: c.emoji,
        name: c.name
      }))
    )
  }

  art(id: string): PetArt | null {
    for (const { pack } of this.packs.values()) {
      const c = pack.characters.find((x) => x.id === id)
      if (c) return c.art
    }
    return null
  }

  /**
   * Kiểm tra rồi chép gói vào thư mục (`<id gói>.eapack`, không dùng tên file người dùng). Cài lại cùng id gói = thay bản cũ.
   * `fileName` chỉ để ghi log.
   */
  install(text: string, fileName: string): CharacterPackInfo {
    let pack: CharacterPack
    try {
      pack = this.validate(text)
    } catch (err) {
      if (err instanceof CharacterPackError) this.log(`không cài ${fileName}: ${err.reason}`)
      throw err
    }
    mkdirSync(this.deps.dir, { recursive: true })
    const file = join(this.deps.dir, `${pack.id}${CHARACTER_PACK_EXT}`)
    const tmp = `${file}.tmp`
    writeFileSync(tmp, text, 'utf8')
    renameSync(tmp, file)
    const old = this.packs.get(pack.id)
    if (old && old.file !== file) rmSync(old.file, { force: true })
    this.packs.set(pack.id, { pack, file })
    return this.list().find((p) => p.id === pack.id)!
  }

  remove(packId: string): void {
    const loaded = this.packs.get(packId)
    if (!loaded) throw new AppError('ITEM_UNKNOWN', 'errors.itemUnknown')
    rmSync(loaded.file, { force: true })
    this.packs.delete(packId)
  }

  /** Schema + quét svg/css + id nhân vật không trùng gói khác (gói cùng id được phép: đó là cài lại) */
  private validate(text: string): CharacterPack {
    if (Buffer.byteLength(text, 'utf8') > CHARACTER_PACK_MAX_BYTES)
      throw new CharacterPackError('quá cỡ')
    let raw: unknown
    try {
      raw = JSON.parse(text)
    } catch {
      throw new CharacterPackError('không phải JSON')
    }
    const parsed = CharacterPackSchema.safeParse(raw)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      throw new CharacterPackError(
        `sai định dạng: ${issue.path.join('.') || '(gốc)'} ${issue.message}`
      )
    }
    const pack = parsed.data
    const unsafe = packSecurityProblems(pack)
    if (unsafe.length) throw new CharacterPackError(unsafe[0])
    for (const [id, { pack: other }] of this.packs) {
      if (id === pack.id) continue
      const clash = pack.characters.find((c) => other.characters.some((o) => o.id === c.id))
      if (clash) throw new CharacterPackError(`nhân vật ${clash.id} đã có trong gói ${id}`)
    }
    return pack
  }
}
