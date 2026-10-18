import type { InvokeChannel } from '@shared/ipc-channels'
import type { ArgsOf, InvokeInput, InvokeOutput, IpcErrorInfo } from '@shared/ipc-contract'

/** Lỗi trả về từ main; messageKey dùng với t() để hiển thị */
export class IpcError extends Error {
  constructor(readonly info: IpcErrorInfo) {
    super(info.code)
    this.name = 'IpcError'
  }
}

/** Gọi main và trả thẳng dữ liệu (ném IpcError nếu lỗi) — giống gọi API bằng axios */
export async function invoke<K extends InvokeChannel>(
  channel: K,
  ...args: ArgsOf<InvokeInput<K>>
): Promise<InvokeOutput<K>> {
  const result = await window.api.invoke(channel, ...args)
  if (!result.ok) throw new IpcError(result.error)
  return result.data
}
