// Hợp đồng IPC: một nguồn định nghĩa duy nhất cho input/output của mọi kênh (docs/13-coding-conventions.md#3-ipc).
// Main validate input bằng các schema này; renderer/preload chỉ dùng kiểu (import type).
import { z } from 'zod'
import type { EventName, InvokeChannel, SendChannel } from './ipc-channels'
import { InventoryItemSchema, MascotReactionSchema, PetStateSchema } from './schemas/pet'
import { SettingsSchema, SettingUpdateSchema } from './schemas/settings'

export const WalkResultSchema = z.object({ blocked: z.enum(['left', 'right']).nullable() })
export const DragEndResultSchema = z.object({ falling: z.boolean() })
export type WalkResult = z.infer<typeof WalkResultSchema>
export type DragEndResult = z.infer<typeof DragEndResultSchema>

export const invokeContract = {
  'mascot:drag-end': { input: z.void(), output: DragEndResultSchema },
  'mascot:walk': { input: z.number().finite().min(-20).max(20), output: WalkResultSchema },
  'pet:get': { input: z.void(), output: PetStateSchema },
  'pet:pat': { input: z.void(), output: PetStateSchema },
  'pet:feed': { input: z.object({ itemId: z.string().min(1) }), output: PetStateSchema },
  'inventory:list': { input: z.void(), output: z.array(InventoryItemSchema) },
  'settings:get-all': { input: z.void(), output: SettingsSchema },
  'settings:set': { input: SettingUpdateSchema, output: SettingsSchema }
} satisfies Record<InvokeChannel, { input: z.ZodType; output: z.ZodType }>

export const sendContract = {
  'mascot:set-click-through': { input: z.boolean() },
  'mascot:drag-start': { input: z.void() },
  'mascot:context-menu': { input: z.void() },
  'popup:hide': { input: z.void() }
} satisfies Record<SendChannel, { input: z.ZodType }>

export const eventContract = {
  'mascot:landed': z.void(),
  'mascot:react': MascotReactionSchema,
  'pet:updated': PetStateSchema,
  'settings:changed': SettingsSchema
} satisfies Record<EventName, z.ZodType>

// --- Kiểu suy ra từ hợp đồng ---

type InvokeDefs = typeof invokeContract
type SendDefs = typeof sendContract
type EventDefs = typeof eventContract

export type InvokeInput<K extends InvokeChannel> = z.input<InvokeDefs[K]['input']>
export type InvokeOutput<K extends InvokeChannel> = z.output<InvokeDefs[K]['output']>
export type SendInput<K extends SendChannel> = z.input<SendDefs[K]['input']>
export type EventPayload<E extends EventName> = z.output<EventDefs[E]>

/** Kênh không có input thì gọi không cần đối số */
export type ArgsOf<T> = [T] extends [void] ? [] : [T]

export interface IpcErrorInfo {
  code: string
  /** Khoá i18n để renderer hiển thị thông báo */
  messageKey: string
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcErrorInfo }

/** API mà preload expose ra window.api */
export interface AppApi {
  invoke<K extends InvokeChannel>(
    channel: K,
    ...args: ArgsOf<InvokeInput<K>>
  ): Promise<IpcResult<InvokeOutput<K>>>
  send<K extends SendChannel>(channel: K, ...args: ArgsOf<SendInput<K>>): void
  /** Lắng nghe sự kiện từ main. Trả về hàm huỷ đăng ký. */
  on<E extends EventName>(event: E, cb: (payload: EventPayload<E>) => void): () => void
}
