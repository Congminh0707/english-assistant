import { ref, type Ref } from 'vue'
import type { TranslateModelKey, TranslateStatus } from '@shared/schemas/translate'
import { invoke } from '../ipc'

// Trạng thái các model dịch (opus-mt từng chiều + 'high' = mBART-50 chất lượng cao): dùng chung trong cả cửa sổ
const statuses: Record<TranslateModelKey, Ref<TranslateStatus | null>> = {
  'en-vi': ref(null),
  'vi-en': ref(null),
  high: ref(null)
}
const DIRECTIONS: TranslateModelKey[] = ['en-vi', 'vi-en', 'high']
let started = false

/** Đọc lại trạng thái mọi model từ main (tránh dùng trạng thái cũ khi cửa sổ đã mở từ lâu) */
async function refresh(): Promise<void> {
  await Promise.all(
    DIRECTIONS.map((direction) =>
      invoke('translate:status', { direction })
        .then((s) => (statuses[direction].value = s))
        .catch(() => undefined)
    )
  )
}

function start(): void {
  if (started) return
  started = true
  for (const direction of DIRECTIONS) {
    void invoke('translate:status', { direction })
      .then((s) => (statuses[direction].value = s))
      .catch(() => undefined)
  }
  window.api.on('translate:status-changed', ({ direction, status }) => {
    statuses[direction].value = status
  })
}

/** Trạng thái các model dịch + hành động tải/huỷ/xoá (dùng trong popup và Cài đặt) */
export function useTranslateModels(): {
  statuses: Record<TranslateModelKey, Ref<TranslateStatus | null>>
  refresh: () => Promise<void>
  install: (direction: TranslateModelKey) => Promise<TranslateStatus>
  cancel: (direction: TranslateModelKey) => void
  remove: (direction: TranslateModelKey) => Promise<void>
} {
  start()
  return {
    statuses,
    refresh,
    install: async (direction) => {
      const status = await invoke('translate:install', { direction })
      statuses[direction].value = status
      return status
    },
    cancel: (direction) => void invoke('translate:cancel', { direction }),
    remove: async (direction) => {
      statuses[direction].value = await invoke('translate:remove', { direction })
    }
  }
}
