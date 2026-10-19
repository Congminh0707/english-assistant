import { looksVietnamese } from '@shared/sentences'
import {
  TRANSLATE_MAX_CHARS,
  type TranslateResult,
  type TranslateStatus
} from '@shared/schemas/translate'
import { AppError } from '../core/AppError'
import type { TranslationEngine } from '../translate/engine'
import type { ModelManager } from '../translate/ModelManager'
import { ModelInstaller } from './ModelInstaller'

const CACHE_SIZE = 200

/**
 * Dịch câu offline (opus-mt en→vi): trạng thái/tải model (qua ModelInstaller), dịch qua engine, nhớ kết quả gần đây.
 * Không bao giờ ghi nội dung dịch ra log. docs/11-ai-and-speech.md#2-dịch--tra-từ
 */
export class TranslationService {
  private readonly installer: ModelInstaller
  private readonly cache = new Map<string, string>()

  constructor(
    private readonly deps: {
      models: ModelManager
      engine: TranslationEngine
      /** Gọi mỗi khi trạng thái đổi (đẩy xuống renderer) */
      onStatus?: (status: TranslateStatus) => void
      now?: () => number
    }
  ) {
    this.installer = new ModelInstaller({
      models: deps.models,
      onStatus: deps.onStatus,
      now: deps.now
    })
  }

  status(): TranslateStatus {
    return this.installer.status()
  }

  /** Tải model (người dùng đã đồng ý). Gọi lại khi đang tải thì dùng chung lần tải đó. */
  install(): Promise<TranslateStatus> {
    return this.installer.install()
  }

  cancelInstall(): void {
    this.installer.cancel()
  }

  async translate(text: string): Promise<TranslateResult> {
    const input = text.replace(/\s+/g, ' ').trim().slice(0, TRANSLATE_MAX_CHARS)
    if (!input) throw new AppError('VALIDATION', 'errors.validation')
    if (looksVietnamese(input))
      throw new AppError('TRANSLATE_UNSUPPORTED', 'errors.translateUnsupported')
    if (!this.deps.models.isInstalled()) {
      throw new AppError('TRANSLATE_NOT_READY', 'errors.translateNotReady')
    }

    const cached = this.cache.get(input)
    if (cached !== undefined) {
      // Dùng gần nhất → đưa xuống cuối Map (LRU)
      this.cache.delete(input)
      this.cache.set(input, cached)
      return { text: cached, engine: 'opus-mt', cached: true }
    }

    const out = await this.deps.engine.translate(input)
    if (!out) throw new AppError('TRANSLATE_FAILED', 'errors.translateFailed')
    this.cache.set(input, out)
    if (this.cache.size > CACHE_SIZE) this.cache.delete(this.cache.keys().next().value as string)
    return { text: out, engine: 'opus-mt', cached: false }
  }

  dispose(): void {
    this.cancelInstall()
    this.deps.engine.dispose()
  }
}
