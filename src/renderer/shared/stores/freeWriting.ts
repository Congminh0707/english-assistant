import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  lengthRange,
  pickRandomTopic,
  type FreeWritingBand,
  type FreeWritingLength
} from '@shared/freeWriting'
import type {
  FreeWritingEntry,
  FreeWritingSummary,
  FreeWritingTopic,
  FreeWritingTopicRef,
  FreeWritingView
} from '@shared/schemas/freeWriting'
import { invoke, IpcError } from '../ipc'

const reasonOf = (err: unknown): string =>
  err instanceof IpcError ? err.info.messageKey : 'errors.unknown'

/**
 * Viết tự do theo đề (docs/07 "Viết tự do"). Bản nháp (đề, độ dài, chữ đang gõ) nằm trong store nên đổi tab/địa điểm
 * rồi quay lại vẫn còn; lưu trước rồi mới xin AI nhận xét, gọi lỗi thì chữ vẫn ở nguyên trong ô.
 */
export const useFreeWritingStore = defineStore('freeWriting', () => {
  const view = ref<FreeWritingView | null>(null)
  const loadError = ref('')

  // Bản nháp bài mới
  const band = ref<FreeWritingBand>('A2')
  const topicId = ref<string | null>(null)
  /** true = đề tự đặt */
  const custom = ref(false)
  const customText = ref('')
  const length = ref<FreeWritingLength>('short')
  const draft = ref('')

  /** Bài đang mở (vừa lưu, hoặc mở từ danh sách); null = đang viết bài mới */
  const entry = ref<FreeWritingEntry | null>(null)
  /** Đang sửa chữ của bài đang mở */
  const editing = ref(false)
  const editText = ref('')

  const history = ref<FreeWritingSummary[]>([])
  const total = ref(0)

  const busy = ref<'save' | 'feedback' | 'delete' | null>(null)
  const error = ref('')
  /** Lý do không có nhận xét AI của lần bấm gần nhất (khoá i18n) */
  const aiReason = ref<string | null>(null)
  const stale = ref(false)

  const topics = computed<FreeWritingTopic[]>(() =>
    (view.value?.topics ?? []).filter((t) => t.band === band.value)
  )
  const topic = computed(() => view.value?.topics.find((t) => t.id === topicId.value) ?? null)
  /** Bậc tính khoảng số từ: bậc của đề đang chọn, hoặc bậc đang lọc khi tự đặt đề */
  const rangeBand = computed<FreeWritingBand>(() =>
    custom.value ? band.value : (topic.value?.band ?? band.value)
  )
  const range = computed(() => lengthRange(rangeBand.value, length.value))

  async function load(): Promise<void> {
    loadError.value = ''
    try {
      const prev = view.value?.profileId ?? null
      view.value = await invoke('free-writing:view')
      // Lần đầu, hoặc đã đổi sang hồ sơ khác: bỏ bản nháp / bài đang mở của hồ sơ trước, chọn lại bậc theo trình độ
      if (prev !== view.value.profileId) {
        if (prev !== null) resetDraft()
        band.value = view.value.band
        if (!topicId.value) randomTopic()
      }
      await loadHistory()
    } catch (err) {
      loadError.value = reasonOf(err)
    }
  }

  function resetDraft(): void {
    topicId.value = null
    custom.value = false
    customText.value = ''
    length.value = 'short'
    draft.value = ''
    entry.value = null
    editing.value = false
    editText.value = ''
    history.value = []
    total.value = 0
    error.value = ''
    aiReason.value = null
    stale.value = false
  }

  /** Đọc lại cờ AI (bật AI ở Cài đặt / focus lại cửa sổ) không đụng bản nháp; hồ sơ đã đổi thì nạp lại cả trang */
  async function refreshAi(): Promise<void> {
    try {
      const v = await invoke('free-writing:view')
      if (view.value && view.value.profileId !== v.profileId) await load()
      else if (view.value) view.value = { ...view.value, aiReady: v.aiReady }
    } catch {
      // giữ trạng thái cũ
    }
  }

  async function loadHistory(more = false): Promise<void> {
    const page = await invoke('free-writing:list', { offset: more ? history.value.length : 0 })
    history.value = more ? [...history.value, ...page.entries] : page.entries
    total.value = page.total
  }

  function setBand(next: FreeWritingBand): void {
    band.value = next
    if (topic.value?.band !== next) randomTopic()
  }

  function randomTopic(): void {
    topicId.value = pickRandomTopic(view.value?.topics ?? [], band.value, topicId.value)?.id ?? null
  }

  function topicRef(): FreeWritingTopicRef | null {
    if (custom.value) {
      const text = customText.value.trim()
      return text ? { kind: 'custom', text, band: band.value } : null
    }
    return topicId.value ? { kind: 'topic', id: topicId.value } : null
  }

  async function run(
    kind: 'save' | 'feedback' | 'delete',
    fn: () => Promise<void>
  ): Promise<boolean> {
    busy.value = kind
    error.value = ''
    try {
      await fn()
      return true
    } catch (err) {
      error.value = reasonOf(err)
      return false
    } finally {
      busy.value = null
    }
  }

  /** Lưu bài mới (chữ trong ô giữ nguyên tới khi lưu xong); `withFeedback` thì xin AI nhận xét ngay sau đó */
  async function submit(withFeedback: boolean): Promise<void> {
    const sel = topicRef()
    if (!sel || !draft.value.trim()) return
    aiReason.value = null
    stale.value = false
    const saved = await run('save', async () => {
      entry.value = await invoke('free-writing:create', {
        topic: sel,
        length: length.value,
        text: draft.value
      })
      draft.value = ''
      await loadHistory()
    })
    if (saved && withFeedback) await requestFeedback()
  }

  /** Xin AI nhận xét bài đang mở (cũng là nút "Nhận xét bằng AI" để thử lại sau) */
  async function requestFeedback(): Promise<void> {
    const current = entry.value
    if (!current) return
    aiReason.value = null
    stale.value = false
    await run('feedback', async () => {
      const r = await invoke('free-writing:feedback', { id: current.id })
      if (entry.value?.id === current.id) entry.value = r.entry
      aiReason.value = r.aiReason
      stale.value = r.stale
      if (r.entry.score !== null) await loadHistory()
    })
  }

  async function open(id: string): Promise<void> {
    aiReason.value = null
    stale.value = false
    editing.value = false
    await run('save', async () => {
      entry.value = await invoke('free-writing:get', { id })
    })
  }

  function startEdit(): void {
    if (!entry.value) return
    editText.value = entry.value.text
    editing.value = true
  }

  async function saveEdit(): Promise<void> {
    const current = entry.value
    if (!current || !editText.value.trim()) return
    const ok = await run('save', async () => {
      entry.value = await invoke('free-writing:update', { id: current.id, text: editText.value })
      await loadHistory()
    })
    if (ok) editing.value = false
  }

  async function remove(): Promise<void> {
    const current = entry.value
    if (!current) return
    await run('delete', async () => {
      await invoke('free-writing:delete', { id: current.id })
      entry.value = null
      editing.value = false
      await loadHistory()
    })
  }

  /** Đóng bài đang mở, quay lại viết bài mới (bản nháp cũ vẫn còn) */
  function newEntry(): void {
    entry.value = null
    editing.value = false
    aiReason.value = null
    stale.value = false
    error.value = ''
  }

  const hasMore = computed(() => history.value.length < total.value)

  return {
    view,
    loadError,
    band,
    topicId,
    custom,
    customText,
    length,
    draft,
    entry,
    editing,
    editText,
    history,
    total,
    hasMore,
    busy,
    error,
    aiReason,
    stale,
    topics,
    topic,
    rangeBand,
    range,
    load,
    refreshAi,
    loadHistory,
    setBand,
    randomTopic,
    submit,
    requestFeedback,
    open,
    startEdit,
    saveEdit,
    remove,
    newEntry
  }
})
