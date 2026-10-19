import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'

/** Giữ tối đa chừng này file (xoá file ít dùng gần đây nhất khi vượt) */
const MAX_FILES = 3000

/** Bộ nhớ đệm file WAV đã tạo trên đĩa (userData/tts-cache): lần sau nghe lại tức thì, không tốn CPU */
export class TtsCache {
  constructor(private readonly dir: string) {}

  /** Khoá cache theo giọng + tốc độ + văn bản (chuẩn hoá khoảng trắng) */
  static key(voice: string, speed: number, text: string): string {
    const normalized = text.replace(/\s+/g, ' ').trim()
    return createHash('sha256').update(`${voice}|${speed}|${normalized}`).digest('hex').slice(0, 40)
  }

  get(key: string): Uint8Array | null {
    const path = this.path(key)
    if (!existsSync(path)) return null
    try {
      const data = readFileSync(path)
      // Đánh dấu "mới dùng" để xoá theo LRU
      const now = new Date()
      utimesSync(path, now, now)
      return new Uint8Array(data)
    } catch {
      return null
    }
  }

  set(key: string, audio: Uint8Array): void {
    mkdirSync(this.dir, { recursive: true })
    writeFileSync(this.path(key), audio)
    this.evict()
  }

  clear(): void {
    rmSync(this.dir, { recursive: true, force: true })
  }

  /** Số file đang lưu */
  get size(): number {
    return existsSync(this.dir) ? readdirSync(this.dir).filter((f) => f.endsWith('.wav')).length : 0
  }

  private path(key: string): string {
    return join(this.dir, `${key}.wav`)
  }

  private evict(): void {
    const files = readdirSync(this.dir).filter((f) => f.endsWith('.wav'))
    if (files.length <= MAX_FILES) return
    const byAge = files
      .map((f) => ({ f, t: statSync(join(this.dir, f)).mtimeMs }))
      .sort((a, b) => a.t - b.t)
    for (const { f } of byAge.slice(0, files.length - MAX_FILES + 100)) {
      rmSync(join(this.dir, f), { force: true })
    }
  }
}
