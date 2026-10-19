import { createHash } from 'node:crypto'
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { AppError } from '../core/AppError'
import { modelBaseUrl, modelTotalBytes, OPUS_MT_EN_VI, type ModelSpec } from './modelFiles'

const MARKER = 'installed.json'

/**
 * Quản lý file model dịch offline trong userData/models: kiểm tra đã cài chưa, tải về (có tiến trình, huỷ được),
 * xác minh kích thước + sha256 từng file trước khi dùng. Không import electron để test được.
 */
export class ModelManager {
  private readonly spec: ModelSpec
  private readonly fetchFn: typeof fetch

  constructor(
    private readonly deps: {
      /** userData/models */
      modelsDir: string
      fetch?: typeof fetch
      spec?: ModelSpec
    }
  ) {
    this.spec = deps.spec ?? OPUS_MT_EN_VI
    this.fetchFn = deps.fetch ?? fetch
  }

  /** Thư mục chứa model, theo cấu trúc `<models>/<id>/` mà transformers.js đọc */
  get dir(): string {
    return join(this.deps.modelsDir, ...this.spec.id.split('/'))
  }

  get sizeBytes(): number {
    return modelTotalBytes(this.spec)
  }

  /** Đã tải đủ và đúng phiên bản (kiểm tra nhanh bằng kích thước file, không băm lại 100 MB) */
  isInstalled(): boolean {
    try {
      const marker = JSON.parse(readFileSync(join(this.dir, MARKER), 'utf8')) as {
        revision?: string
      }
      if (marker.revision !== this.spec.revision) return false
      return this.spec.files.every((f) => {
        const path = join(this.dir, f.path)
        return existsSync(path) && statSync(path).size === f.size
      })
    } catch {
      return false
    }
  }

  /**
   * Tải toàn bộ file còn thiếu. `onProgress` nhận tổng số byte đã có (kể cả file đã tải trước đó).
   * Tải vào file `.part`, kiểm tra sha256 rồi mới đổi tên → không bao giờ để file hỏng ở chỗ model đọc.
   */
  async install(onProgress: (receivedBytes: number) => void, signal?: AbortSignal): Promise<void> {
    mkdirSync(this.dir, { recursive: true })
    let done = 0
    onProgress(0)
    for (const file of this.spec.files) {
      const target = join(this.dir, file.path)
      if (existsSync(target) && statSync(target).size === file.size) {
        done += file.size
        onProgress(done)
        continue
      }
      mkdirSync(dirname(target), { recursive: true })
      const base = done
      await this.download(file.path, file.size, file.sha256, target, signal, (n) =>
        onProgress(base + n)
      )
      done += file.size
      onProgress(done)
    }
    await writeFile(
      join(this.dir, MARKER),
      JSON.stringify({ revision: this.spec.revision, installedAt: new Date().toISOString() })
    )
  }

  remove(): void {
    rmSync(this.dir, { recursive: true, force: true })
  }

  private async download(
    path: string,
    size: number,
    sha256: string,
    target: string,
    signal: AbortSignal | undefined,
    onBytes: (n: number) => void
  ): Promise<void> {
    const part = `${target}.part`
    const response = await this.fetchFn(modelBaseUrl(this.spec) + path, { signal })
    if (!response.ok || !response.body) {
      throw new AppError('MODEL_DOWNLOAD', 'errors.modelDownload')
    }
    const hash = createHash('sha256')
    let received = 0
    const meter = new Transform({
      transform(chunk: Buffer, _enc, cb): void {
        hash.update(chunk)
        received += chunk.length
        onBytes(received)
        cb(null, chunk)
      }
    })
    try {
      await pipeline(
        Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
        meter,
        createWriteStream(part),
        signal ? { signal } : {}
      )
    } catch (err) {
      rmSync(part, { force: true })
      throw err
    }
    if (received !== size || hash.digest('hex') !== sha256) {
      rmSync(part, { force: true })
      throw new AppError('MODEL_CORRUPT', 'errors.modelCorrupt')
    }
    await rename(part, target)
  }
}
