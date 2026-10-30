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
let startPromise: Promise<void> | null = null
/** Tăng mỗi khi gói đổi trạng thái → component phụ thuộc nạp lại */
export const hiresVersion = ref(0)

const assets = new Map<string, Promise<string | null>>()
const bitmaps = new Map<string, Promise<SpriteStrip | null>>()
const metas = new Map<string, Promise<SpriteMeta | null>>()

/**
 * Bắt đầu theo dõi trạng thái gói (gọi nhiều lần cũng chỉ chạy một lần mỗi cửa sổ). Promise xong khi đã biết gói
 * có sẵn hay không: nơi cần chọn độ phân giải NGAY (mascot lúc khởi động) phải `await` trước, nếu không sẽ nạp
 * sprite 96px rồi kẹt ở chất lượng thấp.
 */
export function startHires(): Promise<void> {
  if (startPromise) return startPromise
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
    bitmaps.clear()
    metas.clear()
    hiresReady.value = ready
    hiresVersion.value++
  }
  window.api.on('sprites:status-changed', apply)
  startPromise = invoke('sprites:status')
    .then(apply)
    .catch(() => undefined)
  return startPromise
}

const stageOf = (stage: string): SpriteStage => stage as SpriteStage

/** Data URL một lớp ảnh (sheet / acc-* / accb-*) hoặc null nếu gói không có */
export function hiresAsset(character: string, stage: string, name: string): Promise<string | null> {
  const key = `${character}/${stage}/${name}`
  let p = assets.get(key)
  if (!p) {
    p = invoke('sprites:asset', { character, stage: stageOf(stage), name }).catch(() => null)
    // Lỗi IPC thoáng qua không được nhớ mãi: thân (sheet) null thì lần sau thử lại thay vì kẹt ở sprite 96px
    if (name === 'sheet') void p.then((v) => v ?? assets.delete(key))
    assets.set(key, p)
  }
  return p
}

/**
 * Các hàng của một lớp ảnh chứa một hoạt ảnh + kích thước khung (px của gói) và lề quanh vùng nhân vật (gói cũ
 * không có lề). `frames` là toạ độ từng khung trong `bitmap` (đã trừ hàng đầu của dải).
 */
export interface SpriteStrip {
  bitmap: ImageBitmap
  frameW: number
  frameH: number
  padX: number
  padTop: number
  frames: Array<{ sx: number; sy: number }>
}

export type StripAnim = 'idle' | 'walk'

/** Số cột của sheet — cùng bộ cài (sprites.ts COLUMNS) */
const COLUMNS = 8
/** Khung mặc định khi sheet.json của gói không ghi hoạt ảnh — cùng bộ cài (sprites.ts IDLE/WALK_FRAMES) */
const DEFAULT_FRAMES: Record<StripAnim, number[]> = {
  idle: [0, 1, 2, 3, 4, 5, 6, 7],
  walk: [98, 99, 100, 101, 102, 103, 104, 105]
}
/** Giải mã tuần tự: mỗi sheet 288px là 2304×8928 ≈ 82 MB khi giải mã, chạy song song sẽ ngốn bộ nhớ */
let decodeQueue: Promise<unknown> = Promise.resolve()

/**
 * Chỉ CÁC HÀNG chứa một hoạt ảnh của một lớp ảnh (idle: 2304×288 ≈ 2,6 MB) dưới dạng ImageBitmap, giải mã một lần
 * rồi nhớ lại. Trang Thú cưng hiện ~12 sprite: dùng nguyên sheet làm background-image thì mỗi sheet 82 MB × 12 ≈ 1 GB
 * ảnh giải mã → giật nặng. Ở đây chỉ giữ phần cần vẽ.
 */
export function hiresStrip(
  character: string,
  stage: string,
  name: string,
  anim: StripAnim = 'idle'
): Promise<SpriteStrip | null> {
  const key = `${character}/${stage}/${name}/${anim}`
  let p = bitmaps.get(key)
  if (!p) {
    const job = decodeQueue.then(async () => {
      const url = await hiresAsset(character, stage, name)
      if (!url) return null
      // Data URL → Blob bằng atob (fetch(data:) bị CSP connect-src chặn); createImageBitmap giải mã ngoài luồng chính
      const comma = url.indexOf(',')
      const mime = url.slice(5, url.indexOf(';')) || 'image/webp'
      const bin = atob(url.slice(comma + 1))
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      // Kích thước khung đọc từ sheet.json của gói (gói cũ: 288 vuông, không lề)
      const meta = await hiresMeta(character, stage)
      const frameW = meta?.frameSize.w ?? HIRES_FRAME
      const frameH = meta?.frameSize.h ?? HIRES_FRAME
      const list = meta?.animations[anim]?.frames ?? DEFAULT_FRAMES[anim]
      const row0 = Math.floor(Math.min(...list) / COLUMNS)
      const rows = Math.floor(Math.max(...list) / COLUMNS) - row0 + 1
      const bitmap = await createImageBitmap(
        new Blob([bytes], { type: mime }),
        0,
        row0 * frameH,
        frameW * COLUMNS,
        frameH * rows
      )
      return {
        bitmap,
        frameW,
        frameH,
        padX: meta?.pad?.x ?? 0,
        padTop: meta?.pad?.top ?? 0,
        frames: list.map((f) => ({
          sx: (f % COLUMNS) * frameW,
          sy: (Math.floor(f / COLUMNS) - row0) * frameH
        }))
      }
    })
    p = job.catch(() => null)
    decodeQueue = p
    if (name === 'sheet') void p.then((v) => v ?? bitmaps.delete(key))
    bitmaps.set(key, p)
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
