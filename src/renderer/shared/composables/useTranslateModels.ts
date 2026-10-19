import { ref, type Ref } from 'vue'
import type { TranslateDirection, TranslateStatus } from '@shared/schemas/translate'
import { invoke } from '../ipc'

// Trạng thái model dịch của cả hai chiều: dùng chung trong cả cửa sổ (tải một lần, nghe sự kiện từ main)
const statuses: Record<TranslateDirection, Ref<TranslateStatus | null>> = {
  'en-vi': ref(null),
  'vi-en': ref(null)
}
const DIRECTIONS: TranslateDirection[] = ['en-vi', 'vi-en']
let started = false

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
  statuses: Record<TranslateDirection, Ref<TranslateStatus | null>>
  install: (direction: TranslateDirection) => Promise<TranslateStatus>
  cancel: (direction: TranslateDirection) => void
  remove: (direction: TranslateDirection) => Promise<void>
} {
  start()
  return {
    statuses,
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
