import { ref, type Ref } from 'vue'
import { HIRES_FRAME, type SpriteStage } from '@shared/spritePack'
import type { SpriteMeta } from '@shared/schemas/sprites'
import type { TranslateStatus } from '@shared/schemas/translate'
import { invoke } from '@renderer/shared/ipc'

// Gói sprite độ phân giải cao (khung 288px, tải thêm): khi đã cài thì thú cưng dùng ảnh trong gói thay cho
// sprite 96px của bộ cài. Ảnh đến từ main dưới dạng data URL (IPC `sprites:asset`) và được nhớ lại theo khoá.
export { HIRES_FRAME }

/** Gói đã cài và dùng được */
export const hiresReady = ref(false)
/** Trạng thái tải đầy đủ (cho panel trong Cài đặt) */
const packStatus = ref<TranslateStatus | null>(null)
let started = false
/** Tăng mỗi khi gói đổi trạng thái → component phụ thuộc nạp lại */
export const hiresVersion = ref(0)

const assets = new Map<string, Promise<string | null>>()
const metas = new Map<string, Promise<SpriteMeta | null>>()

/** Bắt đầu theo dõi trạng thái gói (gọi nhiều lần cũng chỉ chạy một lần mỗi cửa sổ) */
export function startHires(): void {
  if (started) return
  started = true
  /** Đang cập nhật gói đã cài: giữ nguyên bản cũ đang dùng, xong thì nạp lại ảnh mới */
  let updating = false
  const apply = (status: TranslateStatus): void => {
    packStatus.value = status
    if (status.state === 'downloading') {
      updating = hiresReady.value
      return
    }
    const ready = status.state === 'ready'
    if (ready === hiresReady.value && !updating) return
    updating = false
    assets.clear()
    metas.clear()
    hiresReady.value = ready
    hiresVersion.value++
  }
  void invoke('sprites:status')
    .then(apply)
    .catch(() => undefined)
  window.api.on('sprites:status-changed', apply)
}

const stageOf = (stage: string): SpriteStage => stage as SpriteStage

/** Data URL một lớp ảnh (sheet / acc-* / accb-*) hoặc null nếu gói không có */
export function hiresAsset(character: string, stage: string, name: string): Promise<string | null> {
  const key = `${character}/${stage}/${name}`
  let p = assets.get(key)
  if (!p) {
    p = invoke('sprites:asset', { character, stage: stageOf(stage), name }).catch(() => null)
    assets.set(key, p)
  }
  return p
}

export function hiresMeta(character: string, stage: string): Promise<SpriteMeta | null> {
  const key = `${character}/${stage}`
  let p = metas.get(key)
  if (!p) {
    p = invoke('sprites:meta', { character, stage: stageOf(stage) }).catch(() => null)
    metas.set(key, p)
  }
  return p
}

/** Trạng thái gói + hành động tải/huỷ/gỡ (panel trong Cài đặt) */
export function useSpritePack(): {
  status: Ref<TranslateStatus | null>
  install: () => Promise<void>
  cancel: () => void
  remove: () => Promise<void>
} {
  startHires()
  return {
    status: packStatus,
    install: async () => {
      packStatus.value = await invoke('sprites:install')
    },
    cancel: () => void invoke('sprites:cancel'),
    remove: async () => {
      packStatus.value = await invoke('sprites:remove')
    }
  }
}
