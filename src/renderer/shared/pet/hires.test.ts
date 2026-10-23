import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mascot phải biết gói 288px có sẵn không TRƯỚC khi chọn sprite (startHires trả Promise xong sau khi có trạng thái)
describe('startHires', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('promise xong sau khi nhận trạng thái; gọi lại trả cùng promise; hiresReady đúng', async () => {
    let resolveStatus: (v: unknown) => void = () => undefined
    const invoke = vi.fn(
      (channel: string) =>
        new Promise((resolve) => {
          if (channel === 'sprites:status') resolveStatus = resolve
        })
    )
    ;(globalThis as unknown as { window: unknown }).window = { api: { invoke, on: vi.fn() } }
    const hires = await import('./hires')

    const p = hires.startHires()
    expect(hires.startHires()).toBe(p)
    expect(hires.hiresReady.value).toBe(false)

    resolveStatus({ ok: true, data: { state: 'ready', receivedBytes: 1, sizeBytes: 1 } })
    await p
    expect(hires.hiresReady.value).toBe(true)
    expect(hires.hiresVersion.value).toBe(1)
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('lỗi IPC khi hỏi trạng thái: vẫn xong (không treo), gói coi như chưa có', async () => {
    const invoke = vi.fn(() => Promise.reject(new Error('boom')))
    ;(globalThis as unknown as { window: unknown }).window = { api: { invoke, on: vi.fn() } }
    const hires = await import('./hires')
    await hires.startHires()
    expect(hires.hiresReady.value).toBe(false)
  })
})
