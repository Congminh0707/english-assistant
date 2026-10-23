import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { unzipSync } from 'fflate'
import { CHARACTER_IDS } from '@shared/characters'
import {
  SPRITE_ASSET_NAME,
  SPRITE_STAGES,
  type SpritePackManifest,
  type SpriteStage
} from '@shared/spritePack'
import { AppError } from '../core/AppError'
import { downloadVerified, type DownloadSpec } from '../core/downloadVerified'
import type { Installable } from '../services/ModelInstaller'

export interface SpritePackSpec extends DownloadSpec {
  id: string
  version: string
}

const MARKER = 'installed.json'
/** Đường dẫn hợp lệ trong gói: <nhân vật>/<giai đoạn>/(sheet.json | sheet.webp | acc-*.webp | accb-*.webp) */
const ENTRY = /^([a-z]+)\/([a-z]+)\/(sheet\.json|(?:sheet|accb?-[a-z-]+)\.webp)$/

/**
 * Gói sprite độ phân giải cao (zip: manifest.json + <nhân vật>/<giai đoạn>/*.webp), tải một lần vào
 * userData/sprite-packs/<id>/. Kiểm tra kích thước + sha256 trước khi giải nén, chỉ nhận đường dẫn đúng mẫu
 * (không thể ghi ra ngoài thư mục gói). Không import electron nên test được ở Node.
 */
export class SpritePackManager implements Installable {
  private readonly fetchFn: typeof fetch

  constructor(
    private readonly deps: {
      /** userData/sprite-packs */
      packsDir: string
      spec: SpritePackSpec
      fetch?: typeof fetch
    }
  ) {
    this.fetchFn = deps.fetch ?? fetch
  }

  get dir(): string {
    return join(this.deps.packsDir, this.deps.spec.id)
  }

  get sizeBytes(): number {
    return this.deps.spec.size
  }

  /** Phiên bản đang cài (null nếu chưa cài) */
  private installedVersion(): string | null {
    try {
      const marker = JSON.parse(readFileSync(join(this.dir, MARKER), 'utf8')) as {
        version?: string
      }
      return marker.version ?? null
    } catch {
      return null
    }
  }

  /** Có gói đã cài (kể cả bản cũ — vẫn dùng được cho tới khi người dùng cập nhật) */
  isInstalled(): boolean {
    return this.installedVersion() !== null
  }

  /** Đã cài nhưng app có bản mới hơn: người dùng chọn Cập nhật, không tự tải ngầm */
  updateAvailable(): boolean {
    const v = this.installedVersion()
    return v !== null && v !== this.deps.spec.version
  }

  async install(onProgress: (receivedBytes: number) => void, signal?: AbortSignal): Promise<void> {
    const { spec } = this.deps
    mkdirSync(this.dir, { recursive: true })
    const zip = await downloadVerified(spec, this.fetchFn, onProgress, signal)
    this.extract(zip)
    await writeFile(
      join(this.dir, MARKER),
      JSON.stringify({ version: spec.version, installedAt: new Date().toISOString() })
    )
  }

  /** Giải nén vào thư mục tạm rồi đổi tên → không bao giờ để gói dở dang ở chỗ app đọc */
  private extract(zip: Buffer): void {
    const files = unzipSync(new Uint8Array(zip))
    const raw = files['manifest.json']
    if (!raw) throw new AppError('PACK_INVALID', 'errors.packInvalid')
    const manifest = JSON.parse(new TextDecoder().decode(raw)) as SpritePackManifest
    if (manifest.id !== this.deps.spec.id) throw new AppError('PACK_INVALID', 'errors.packInvalid')
    const tmp = join(this.dir, 'files.tmp')
    rmSync(tmp, { recursive: true, force: true })
    mkdirSync(tmp, { recursive: true })
    for (const rel of manifest.files) {
      const data = files[rel]
      const m = ENTRY.exec(rel)
      if (!data || !m || !CHARACTER_IDS.includes(m[1] as never)) {
        throw new AppError('PACK_INVALID', 'errors.packInvalid')
      }
      const out = join(tmp, rel)
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, data)
    }
    const target = join(this.dir, 'files')
    rmSync(target, { recursive: true, force: true })
    renameSync(tmp, target)
  }

  remove(): void {
    rmSync(this.dir, { recursive: true, force: true })
  }

  private path(character: string, stage: SpriteStage, file: string): string | null {
    if (!this.isInstalled()) return null
    if (!CHARACTER_IDS.includes(character as never) || !SPRITE_STAGES.includes(stage)) return null
    const p = join(this.dir, 'files', character, stage, file)
    return existsSync(p) ? p : null
  }

  /** Ảnh một lớp (sheet / phụ kiện) hoặc null nếu gói chưa cài / không có lớp đó */
  image(character: string, stage: SpriteStage, name: string): Buffer | null {
    if (!SPRITE_ASSET_NAME.test(name)) return null
    const p = this.path(character, stage, `${name}.webp`)
    return p ? readFileSync(p) : null
  }

  /** sheet.json của gói (khung 288px, cùng tên hoạt ảnh như bộ cài) hoặc null */
  meta(character: string, stage: SpriteStage): unknown {
    const p = this.path(character, stage, 'sheet.json')
    return p ? (JSON.parse(readFileSync(p, 'utf8')) as unknown) : null
  }
}
