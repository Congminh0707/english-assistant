import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { safeStorage } from 'electron'

/** Nơi lưu bí mật của người dùng (API key): mã hoá bằng DPAPI của Windows qua Electron safeStorage. Không bao giờ log giá trị. */
export interface SecretStore {
  /** Máy có mã hoá được không (nếu không thì từ chối lưu, không lưu dạng rõ) */
  canStore(): boolean
  get(name: string): string | null
  set(name: string, value: string): void
  delete(name: string): void
}

export class SafeStorageSecretStore implements SecretStore {
  constructor(private readonly file: string) {}

  canStore(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  get(name: string): string | null {
    const enc = this.read()[name]
    if (!enc || !this.canStore()) return null
    try {
      return safeStorage.decryptString(Buffer.from(enc, 'base64'))
    } catch {
      return null // file hỏng hoặc đổi tài khoản Windows → coi như chưa có key
    }
  }

  set(name: string, value: string): void {
    if (!this.canStore()) throw new Error('secret store: encryption unavailable')
    const all = this.read()
    all[name] = safeStorage.encryptString(value).toString('base64')
    this.write(all)
  }

  delete(name: string): void {
    const all = this.read()
    if (!(name in all)) return
    delete all[name]
    this.write(all)
  }

  private read(): Record<string, string> {
    try {
      if (!existsSync(this.file)) return {}
      const data = JSON.parse(readFileSync(this.file, 'utf8')) as unknown
      return data && typeof data === 'object' ? (data as Record<string, string>) : {}
    } catch {
      return {}
    }
  }

  private write(all: Record<string, string>): void {
    mkdirSync(dirname(this.file), { recursive: true })
    writeFileSync(this.file, JSON.stringify(all), 'utf8')
  }
}
