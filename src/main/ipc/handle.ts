import { ipcMain, type WebContents } from 'electron'
import { is } from '@electron-toolkit/utils'
import type { InvokeChannel, SendChannel } from '@shared/ipc-channels'
import {
  invokeContract,
  sendContract,
  type InvokeOutput,
  type IpcResult
} from '@shared/ipc-contract'
import type { z } from 'zod'
import { AppError } from '../core/AppError'

type ParsedInvokeInput<K extends InvokeChannel> = z.output<(typeof invokeContract)[K]['input']>
type ParsedSendInput<K extends SendChannel> = z.output<(typeof sendContract)[K]['input']>

interface HandlerOptions {
  /** Chỉ nhận lệnh từ (các) cửa sổ này; bỏ trống = mọi cửa sổ của app */
  from?: () => WebContents | WebContents[]
}

function allowed(sender: WebContents, opts?: HandlerOptions): boolean {
  if (!opts?.from) return true
  const list = opts.from()
  return Array.isArray(list) ? list.includes(sender) : list === sender
}

/**
 * Ghi log khi dữ liệu renderer gửi lên sai hợp đồng — chỉ ghi tên trường, mã lỗi và độ dài chuỗi,
 * KHÔNG ghi nội dung (có thể là clipboard, văn bản người dùng...: AGENTS.md cấm log).
 */
function logValidation(channel: string, raw: unknown, error: z.ZodError): void {
  const issues = error.issues.map((i) => {
    let value: unknown = raw
    for (const key of i.path) value = (value as Record<PropertyKey, unknown> | undefined)?.[key]
    const shape = typeof value === 'string' ? `string(${value.length})` : typeof value
    return `${i.path.join('.') || '(root)'}: ${i.code} [${shape}]`
  })
  console.warn(`[ipc] ${channel} dữ liệu không hợp lệ: ${issues.join('; ')}`)
}

/**
 * Đăng ký kênh invoke có validate input bằng zod (~ Route + FormRequest trong Laravel).
 * Lỗi được chuyển thành { ok: false, error } để renderer hiển thị qua i18n.
 */
export function handle<K extends InvokeChannel>(
  channel: K,
  fn: (input: ParsedInvokeInput<K>) => InvokeOutput<K> | Promise<InvokeOutput<K>>,
  opts?: HandlerOptions
): void {
  const def = invokeContract[channel]
  ipcMain.handle(channel, async (e, raw): Promise<IpcResult<InvokeOutput<K>>> => {
    if (!allowed(e.sender, opts)) {
      return { ok: false, error: { code: 'FORBIDDEN', messageKey: 'errors.unknown' } }
    }
    const parsed = def.input.safeParse(raw)
    if (!parsed.success) {
      logValidation(channel, raw, parsed.error)
      return { ok: false, error: { code: 'VALIDATION', messageKey: 'errors.validation' } }
    }
    try {
      const data = await fn(parsed.data as ParsedInvokeInput<K>)
      // Dev: kiểm tra luôn output để phát hiện sớm dữ liệu sai hợp đồng
      if (is.dev) def.output.parse(data)
      return { ok: true, data }
    } catch (err) {
      if (err instanceof AppError) return { ok: false, error: err.toIpc() }
      console.error(`[ipc] ${channel} failed:`, err)
      return { ok: false, error: { code: 'INTERNAL', messageKey: 'errors.unknown' } }
    }
  })
}

/** Đăng ký kênh send (không trả kết quả), có validate input. */
export function onSend<K extends SendChannel>(
  channel: K,
  fn: (input: ParsedSendInput<K>) => void,
  opts?: HandlerOptions
): void {
  const def = sendContract[channel]
  ipcMain.on(channel, (e, raw) => {
    if (!allowed(e.sender, opts)) return
    const parsed = def.input.safeParse(raw)
    if (!parsed.success) {
      logValidation(channel, raw, parsed.error)
      return
    }
    try {
      fn(parsed.data as ParsedSendInput<K>)
    } catch (err) {
      console.error(`[ipc] ${channel} failed:`, err)
    }
  })
}
