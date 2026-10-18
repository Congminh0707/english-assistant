// Kênh IPC & kiểu dùng chung giữa main, preload và renderer.
// Phase 0: định nghĩa tay. Phase 1 chuyển sang ipc-contract dùng zod (docs/13-coding-conventions.md#3-ipc).

export const IpcChannel = {
  /** renderer → main (send): bật/tắt click xuyên qua cho cửa sổ mascot */
  mascotSetClickThrough: 'mascot:set-click-through',
  /** renderer → main (send): bắt đầu kéo nhân vật */
  mascotDragStart: 'mascot:drag-start',
  /** renderer → main (invoke): thả nhân vật, trả về DragEndResult */
  mascotDragEnd: 'mascot:drag-end',
  /** renderer → main (invoke): đi ngang dx pixel, trả về WalkResult */
  mascotWalk: 'mascot:walk',
  /** renderer (popup) → main (send): đóng popup */
  popupHide: 'popup:hide'
} as const

export const IpcEvent = {
  /** main → renderer: nhân vật đã rơi chạm đất */
  mascotLanded: 'mascot:landed'
} as const

export type IpcEventName = (typeof IpcEvent)[keyof typeof IpcEvent]

export interface WalkResult {
  /** Mép màn hình đã chặn bước đi (nếu có) */
  blocked: 'left' | 'right' | null
}

export interface DragEndResult {
  /** true nếu nhân vật đang ở trên không và sẽ rơi xuống; main gửi mascot:landed khi chạm đất */
  falling: boolean
}

/** API mà preload expose ra window.api */
export interface AppApi {
  mascot: {
    setClickThrough(enabled: boolean): void
    dragStart(): void
    dragEnd(): Promise<DragEndResult>
    walk(dx: number): Promise<WalkResult>
  }
  popup: {
    hide(): void
  }
  /** Lắng nghe sự kiện từ main. Trả về hàm huỷ đăng ký. */
  on(event: IpcEventName, cb: () => void): () => void
}
