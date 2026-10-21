import type { PackAccent } from '@shared/audioPack'
import type { AudioClipResult } from '@shared/schemas/audio'
import type { TranslateStatus } from '@shared/schemas/translate'
import type { AudioPackManager } from '../audio/AudioPackManager'
import { ModelInstaller } from './ModelInstaller'

/**
 * Gói âm thanh bài nghe tạo sẵn (MP3, tải thêm): trạng thái/tải qua ModelInstaller và tra âm thanh theo câu.
 * Có gói thì bài nghe phát ngay giọng tự nhiên mà không cần model giọng đọc ~92 MB. docs/11-ai-and-speech.md#3
 */
export class AudioPackService {
  private readonly installer: ModelInstaller

  constructor(
    private readonly deps: {
      pack: AudioPackManager
      onStatus?: (status: TranslateStatus) => void
    }
  ) {
    this.installer = new ModelInstaller({ models: deps.pack, onStatus: deps.onStatus })
  }

  status(): TranslateStatus {
    return this.installer.status()
  }

  install(): Promise<TranslateStatus> {
    return this.installer.install()
  }

  cancelInstall(): void {
    this.installer.cancel()
  }

  /** Gỡ gói để lấy lại dung lượng */
  remove(): TranslateStatus {
    this.deps.pack.remove()
    return this.status()
  }

  clip(input: { text: string; accent: PackAccent; rate: number }): AudioClipResult {
    const audio = this.deps.pack.clip(input.accent, input.rate, input.text)
    return audio ? { audio, mime: 'audio/mpeg' } : null
  }
}
