// Cấu hình các content pack build được bằng `pnpm content:build [packId]`.
import type { LevelCode, Track } from '../../src/shared/schemas/content'

export interface PackConfig {
  id: string
  version: string
  title: { vi: string; en: string }
  /**
   * License của cả pack. core-dictionary chứa dữ liệu CC BY-SA (Wiktionary, NGSL, TSL, Octanove)
   * → cả pack mang CC BY-SA 4.0 (docs/08-content-sources.md §1.2).
   */
  license: string
  tracks: Track[]
  levels?: LevelCode[]
}

export const PACKS: Record<string, PackConfig> = {
  'core-dictionary': {
    id: 'core-dictionary',
    version: '1.0.0',
    title: { vi: 'Từ điển Anh–Việt cốt lõi', en: 'Core English–Vietnamese dictionary' },
    license: 'CC-BY-SA-4.0',
    tracks: []
  }
}
