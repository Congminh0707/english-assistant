import { onBeforeUnmount, onMounted, ref } from 'vue'

// Rời giữa chừng một phiên học (luyện tập, bài tập, ôn tập, bài kiểm tra, lượt chơi của bé) phải hỏi lại: mỗi phiên
// đang làm dở đăng ký một hàm "đang làm dở không", mọi chỗ thoát gọi `confirmLeave()` trước khi đổi màn.
const guards = new Set<() => boolean>()

/** Hộp thoại đang hỏi (LeaveConfirm.vue hiển thị); null = không hỏi */
export const leavePrompt = ref<{ answer: (leave: boolean) => void } | null>(null)

export const isLeaveGuarded = (): boolean => [...guards].some((g) => g())

/** Đăng ký trong setup của phiên học: `active()` trả true khi đang làm dở */
export function useLeaveGuard(active: () => boolean): void {
  onMounted(() => guards.add(active))
  onBeforeUnmount(() => guards.delete(active))
}

/** true = được đi tiếp (không có gì dở, hoặc người dùng đồng ý bỏ); false = ở lại */
export function confirmLeave(): Promise<boolean> {
  if (!isLeaveGuarded()) return Promise.resolve(true)
  if (leavePrompt.value) return Promise.resolve(false)
  return new Promise((resolve) => {
    leavePrompt.value = {
      answer: (leave) => {
        leavePrompt.value = null
        resolve(leave)
      }
    }
  })
}
