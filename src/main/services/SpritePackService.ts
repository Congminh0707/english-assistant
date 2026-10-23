import type { SpriteMeta } from '@shared/schemas/sprites'
import type { TranslateStatus } from '@shared/schemas/translate'
import type { SpriteStage } from '@shared/spritePack'
import type { SpritePackManager } from '../sprites/SpritePackManager'
import { ModelInstaller } from './ModelInstaller'

/**
 * Gói sprite độ phân giải cao (tải thêm): trạng thái/tải qua ModelInstaller và đọc ảnh/metadata cho renderer.
 * Ảnh trả về dạng data URL (CSP của cửa sổ đã cho phép `img-src data:`), nên không cần giao thức tuỳ chỉnh.
 */
export class SpritePackService {
  private readonly installer: ModelInstaller

  constructor(
    private readonly deps: {
      pack: SpritePackManager
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

  remove(): TranslateStatus {
    this.deps.pack.remove()
    return this.status()
  }

  asset(input: { character: string; stage: SpriteStage; name: string }): string | null {
    const data = this.deps.pack.image(input.character, input.stage, input.name)
    return data ? `data:image/webp;base64,${data.toString('base64')}` : null
  }

  meta(input: { character: string; stage: SpriteStage }): SpriteMeta | null {
    return this.deps.pack.meta(input.character, input.stage) as SpriteMeta | null
  }
}
