import { ref, type Ref } from 'vue'
import type { UpdateStatus } from '@shared/schemas/update'
import { invoke } from '../ipc'

// Trạng thái cập nhật dùng chung trong cả cửa sổ (tải một lần, nghe sự kiện từ main)
const status = ref<UpdateStatus | null>(null)
let started = false

function start(): void {
  if (started) return
  started = true
  void invoke('update:status')
    .then((s) => (status.value = s))
    .catch(() => undefined)
  window.api.on('update:status-changed', (s) => (status.value = s))
}

/** Trạng thái cập nhật + hành động kiểm tra / tải / cài (dùng trong Cài đặt) */
export function useUpdateStatus(): {
  status: Ref<UpdateStatus | null>
  check: () => Promise<void>
  download: () => Promise<void>
  install: () => Promise<void>
} {
  start()
  return {
    status,
    check: async () => {
      status.value = await invoke('update:check')
    },
    download: async () => {
      status.value = await invoke('update:download')
    },
    install: async () => {
      await invoke('update:install')
    }
  }
}
