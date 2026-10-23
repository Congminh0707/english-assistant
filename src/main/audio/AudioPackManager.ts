import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { unzipSync } from 'fflate'
import { packClipKey, type PackAccent, type PackManifest } from '@shared/audioPack'
import { AppError } from '../core/AppError'
import { downloadVerified } from '../core/downloadVerified'
import type { Installable } from '../services/ModelInstaller'

export interface AudioPackSpec {
  id: string
  version: string
  /** Địa chỉ tải file .zip (GitHub Release của dự án) */
  url: string
  size: number
  sha256: string
}

const MARKER = 'installed.json'

/**
 * Gói âm thanh tạo sẵn (zip: manifest.json + clips/*.mp3), tải một lần vào userData/audio-packs/<id>/.
 * Kiểm tra kích thước + sha256 trước khi giải nén; không import electron nên test được ở Node.
 */
export class AudioPackManager implements Installable {
  private index: Map<string, string> | null = null
  private readonly fetchFn: typeof fetch

  constructor(
    private readonly deps: {
      /** userData/audio-packs */
      packsDir: string
      spec: AudioPackSpec
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

  isInstalled(): boolean {
    try {
      const marker = JSON.parse(readFileSync(join(this.dir, MARKER), 'utf8')) as {
        version?: string
      }
      return marker.version === this.deps.spec.version
    } catch {
      return false
    }
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
    this.index = null
  }

  /** Giải nén vào thư mục tạm rồi đổi tên → không bao giờ để gói dở dang ở chỗ app đọc */
  private extract(zip: Buffer): void {
    const files = unzipSync(new Uint8Array(zip))
    const manifest = JSON.parse(new TextDecoder().decode(files['manifest.json'])) as PackManifest
    if (manifest.id !== this.deps.spec.id) throw new AppError('PACK_INVALID', 'errors.packInvalid')
    const tmp = join(this.dir, 'clips.tmp')
    rmSync(tmp, { recursive: true, force: true })
    mkdirSync(tmp, { recursive: true })
    for (const name of Object.values(manifest.clips)) {
      const data = files[`clips/${name}`]
      if (!data) throw new AppError('PACK_INVALID', 'errors.packInvalid')
      writeFileSync(join(tmp, name), data)
    }
    writeFileSync(join(this.dir, 'manifest.json'), JSON.stringify(manifest))
    const target = join(this.dir, 'clips')
    rmSync(target, { recursive: true, force: true })
    renameSync(tmp, target)
  }

  remove(): void {
    rmSync(this.dir, { recursive: true, force: true })
    this.index = null
  }

  /** Âm thanh đã tạo sẵn cho (giọng, tốc độ, câu) hoặc null nếu gói chưa có / không chứa câu này */
  clip(accent: PackAccent, rate: number, text: string): Uint8Array | null {
    if (!this.isInstalled()) return null
    const name = this.loadIndex().get(packClipKey(accent, rate, text))
    if (!name) return null
    const path = join(this.dir, 'clips', name)
    if (!existsSync(path) || statSync(path).size === 0) return null
    return new Uint8Array(readFileSync(path))
  }

  private loadIndex(): Map<string, string> {
    if (this.index) return this.index
    try {
      const manifest = JSON.parse(
        readFileSync(join(this.dir, 'manifest.json'), 'utf8')
      ) as PackManifest
      this.index = new Map(Object.entries(manifest.clips))
    } catch {
      this.index = new Map()
    }
    return this.index
  }
}
