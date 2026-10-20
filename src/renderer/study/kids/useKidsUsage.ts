import { onUnmounted, ref, type Ref } from 'vue'
import type { UsageStatus } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'

/** Mỗi chừng này giây gửi một lần báo "bé đang dùng app" (chỉ khi cửa sổ đang hiện và được chọn) */
const TICK_SECONDS = 15

/**
 * Đếm thời gian bé dùng app trong ngày để áp dụng giới hạn của phụ huynh. Main là nguồn sự thật: renderer chỉ báo
 * số giây đã trôi qua khi cửa sổ đang hiện, main cộng dồn và trả lại tình trạng (còn bao nhiêu, đã khoá chưa).
 */
export function useKidsUsage(initial: UsageStatus | null = null): {
  usage: Ref<UsageStatus | null>
  set: (status: UsageStatus) => void
} {
  const usage = ref<UsageStatus | null>(initial)
  const timer = window.setInterval(async () => {
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return
    try {
      usage.value = await invoke('kids:tick', { seconds: TICK_SECONDS })
    } catch (err) {
      console.warn('[kids] tick failed', err)
    }
  }, TICK_SECONDS * 1000)
  onUnmounted(() => window.clearInterval(timer))
  return { usage, set: (status) => (usage.value = status) }
}
