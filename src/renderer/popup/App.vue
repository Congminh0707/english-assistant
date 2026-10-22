<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DictEntry, LookupResult } from '@shared/schemas/dictionary'
import type { TranslateDirection } from '@shared/schemas/translate'
import { looksVietnamese } from '@shared/sentences'
import { invoke, IpcError } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { useTts } from '@renderer/shared/composables/useTts'
import TtsIndicator from '@renderer/shared/components/TtsIndicator.vue'
import { useTranslateModels } from '@renderer/shared/composables/useTranslateModels'

// Popup tra từ offline (docs/12-ui-ux-guidelines.md#popup-dịch-nhanh).
// Mở bằng phím tắt: main đọc clipboard rồi gửi 'popup:query'; người dùng cũng có thể gõ để tra.
const SHORTCUT = 'Ctrl + Alt + T'

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const { speak } = useTts()

const input = ref('')
const inputEl = ref<HTMLInputElement>()
const result = ref<LookupResult | null>(null)
const selected = ref(0)
const loading = ref(false)
const toast = ref('')
/** Câu gốc khi người dùng copy cả câu rồi bấm vào một từ — lưu làm ngữ cảnh cho thẻ SRS */
const contextSentence = ref<string | null>(null)
/** Bản dịch cả câu (opus-mt offline) cho câu/cụm không có trong từ điển */
const translation = ref<{
  phase: 'idle' | 'loading' | 'done' | 'error'
  text: string
  errorKey: string
  /** Engine đã dịch (để gợi ý nâng cấp khi dùng bản nhanh) */
  engine: 'opus-mt' | 'mbart-50' | null
}>({ phase: 'idle', text: '', errorKey: '', engine: null })
const models = useTranslateModels()
/** Chiều dịch của văn bản đang tra (tự nhận: có dấu tiếng Việt → Việt→Anh) */
const direction = computed<TranslateDirection>(() =>
  looksVietnamese(result.value?.query ?? '') ? 'vi-en' : 'en-vi'
)
/** Model chất lượng cao đã tải và đang được ưu tiên (cài đặt translate.highQuality) */
const highReady = computed(
  () =>
    models.statuses.high.value?.state === 'ready' && settingsStore.settings['translate.highQuality']
)
/** Dịch được ngay: có model chất lượng cao, hoặc opus-mt của chiều này */
const canTranslate = computed(
  () => highReady.value || models.statuses[direction.value].value?.state === 'ready'
)
/** Model đang hiển thị trạng thái tải: bản chất lượng cao nếu đang tải, ngược lại opus-mt của chiều này */
const downloadKey = computed<'high' | TranslateDirection>(() =>
  models.statuses.high.value?.state === 'downloading' ? 'high' : direction.value
)
const modelStatus = computed(() => models.statuses[downloadKey.value].value)
const highStatus = computed(() => models.statuses.high.value)
const highSizeMb = computed(() => Math.round((highStatus.value?.sizeBytes ?? 0) / MB))
/** Gợi ý nâng cấp: vừa dịch bằng bản nhanh và chưa có bản chất lượng cao */
const canUpgrade = computed(
  () =>
    translation.value.phase === 'done' &&
    translation.value.engine === 'opus-mt' &&
    highStatus.value?.state === 'not-installed'
)
/** Văn bản đang chờ dịch (đợi người dùng tải model) */
let pendingText: string | null = null
let translateSeq = 0
const MB = 1024 * 1024
const cleanups: Array<() => void> = []
let toastTimer = 0
let lookupSeq = 0

const entry = computed<DictEntry | null>(() => result.value?.entries[selected.value] ?? null)
const others = computed(() =>
  (result.value?.entries ?? []).map((e, i) => ({ e, i })).filter(({ i }) => i !== selected.value)
)
const sentenceTokens = computed(() =>
  result.value?.kind === 'sentence'
    ? looksVietnamese(result.value.query)
      ? []
      : [...new Set(result.value.query.split(/[^A-Za-z'-]+/).filter((w) => w.length > 1))]
    : []
)

const sizeMb = computed(() => Math.round((modelStatus.value?.sizeBytes ?? 0) / MB))
const doneMb = computed(() => Math.round((modelStatus.value?.receivedBytes ?? 0) / MB))
const showTranslation = computed(() => {
  const r = result.value
  if (!r || r.packMissing) return false
  return r.kind === 'sentence' || (r.kind === 'phrase' && r.entries.length === 0)
})

async function translate(text: string): Promise<void> {
  const seq = ++translateSeq
  pendingText = text
  if (!canTranslate.value) {
    translation.value = { phase: 'idle', text: '', errorKey: '', engine: null }
    return
  }
  translation.value = { phase: 'loading', text: '', errorKey: '', engine: null }
  try {
    const res = await invoke('translate:text', { text })
    if (seq !== translateSeq) return
    pendingText = null
    translation.value = { phase: 'done', text: res.text, errorKey: '', engine: res.engine }
  } catch (err) {
    if (seq !== translateSeq) return
    const key = err instanceof IpcError ? err.info.messageKey : 'errors.translateFailed'
    translation.value = { phase: 'error', text: '', errorKey: key, engine: null }
  }
}

async function installModel(): Promise<void> {
  try {
    // Khi tải xong, sự kiện 'translate:status-changed' sẽ kích hoạt dịch câu đang chờ
    await models.install(direction.value)
  } catch (err) {
    console.warn('[popup] install model failed', err)
  }
}

async function installHigh(): Promise<void> {
  try {
    await models.install('high')
  } catch (err) {
    console.warn('[popup] install high-quality model failed', err)
  }
}

function cancelInstall(): void {
  models.cancel(downloadKey.value)
}

async function lookup(text: string): Promise<void> {
  const seq = ++lookupSeq
  input.value = text
  selected.value = 0
  loading.value = true
  try {
    const res = await invoke('dictionary:lookup', { text })
    if (seq !== lookupSeq) return // đã có lần tra mới hơn
    result.value = res
    if (res.kind === 'sentence') contextSentence.value = res.query
    translateSeq++
    translation.value = { phase: 'idle', text: '', errorKey: '', engine: null }
    pendingText = null
    if (
      !res.packMissing &&
      (res.kind === 'sentence' || (res.kind === 'phrase' && res.entries.length === 0))
    ) {
      void translate(res.query)
    }
  } catch (err) {
    console.warn('[popup] lookup failed', err)
  } finally {
    if (seq === lookupSeq) loading.value = false
  }
}

function lookupToken(word: string): void {
  void lookup(word)
}

function onSubmit(): void {
  contextSentence.value = null
  void lookup(input.value)
}

async function save(): Promise<void> {
  const e = entry.value
  if (!e || e.saved) return
  try {
    await invoke('vocab:save', { contentId: e.id, text: e.lemma, context: contextSentence.value })
    e.saved = true
    showToast(t('popup.savedToast'))
  } catch (err) {
    console.warn('[popup] save failed', err)
  }
}

function showToast(message: string): void {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 1800)
}

function hide(): void {
  window.api.send('popup:hide')
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') hide()
  else if (e.key.toLowerCase() === 's' && e.ctrlKey) {
    e.preventDefault()
    void save()
  }
}

async function onQuery({ text }: { text: string }): Promise<void> {
  contextSentence.value = null
  if (text) await lookup(text)
  else {
    input.value = ''
    result.value = null
  }
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select()
}

watch(
  () => settingsStore.settings['ui.language'],
  (lang) => {
    locale.value = lang
  }
)

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  cleanups.push(
    settingsStore.listen(),
    window.api.on('popup:query', onQuery),
    // Tải xong từ nơi khác (Cài đặt) trong lúc popup đang chờ → dịch luôn
    window.api.on('translate:status-changed', ({ direction: dir, status }) => {
      if ((dir === direction.value || dir === 'high') && status.state === 'ready' && pendingText) {
        void translate(pendingText)
      }
    })
  )
  await settingsStore.load()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <div class="popup">
    <header class="header">
      <span class="title">{{ t('popup.title') }}</span>
      <button class="close" type="button" :aria-label="t('popup.close')" @click="hide">✕</button>
    </header>

    <form class="search" @submit.prevent="onSubmit">
      <input
        ref="inputEl"
        v-model="input"
        type="text"
        spellcheck="false"
        :placeholder="t('popup.searchPlaceholder')"
      />
    </form>

    <main class="body">
      <p v-if="loading && !result" class="muted">{{ t('popup.loading') }}</p>

      <p v-else-if="!result || result.kind === 'empty'" class="muted">
        {{ t('popup.empty', { shortcut: SHORTCUT }) }}
      </p>

      <p v-else-if="result.packMissing" class="muted">{{ t('popup.packMissing') }}</p>

      <div v-else-if="result.kind === 'sentence'">
        <p class="muted">{{ t('popup.sentence') }}</p>
        <div v-if="showTranslation" class="translation">
          <div class="tr-head">
            <strong>{{ t('translate.title') }}</strong>
            <span class="ai" :title="t('translate.machineHint')">{{
              t('translate.machineBadge')
            }}</span>
          </div>
          <p v-if="translation.phase === 'loading'" class="muted">
            {{ t('translate.translating') }}
          </p>
          <p v-else-if="translation.phase === 'done'" class="tr-text">{{ translation.text }}</p>
          <p v-if="canUpgrade" class="tr-upgrade">
            {{ t('translate.upgradeHint') }}
            <button type="button" class="token" @click="installHigh">
              {{ t('translate.downloadHigh', { size: highSizeMb }) }}
            </button>
          </p>
          <p v-else-if="translation.phase === 'error'" class="tr-error">
            {{ t(translation.errorKey) }}
          </p>
          <div v-else-if="modelStatus?.state === 'downloading'" class="tr-download">
            <span class="muted">{{
              t('translate.downloading', { done: doneMb, total: sizeMb })
            }}</span>
            <progress :value="modelStatus.receivedBytes" :max="modelStatus.sizeBytes" />
            <button type="button" class="token" @click="cancelInstall">
              {{ t('translate.cancel') }}
            </button>
          </div>
          <div v-else-if="modelStatus" class="tr-download">
            <span class="muted">{{ t('translate.needModel', { size: sizeMb }) }}</span>
            <span v-if="modelStatus.errorKey" class="tr-error">{{ t(modelStatus.errorKey) }}</span>
            <button type="button" class="save" @click="installModel">
              {{ modelStatus.errorKey ? t('translate.retry') : t('translate.download') }}
            </button>
            <button type="button" class="token" @click="installHigh">
              {{ t('translate.downloadHigh', { size: highSizeMb }) }}
            </button>
          </div>
        </div>
        <div class="tokens">
          <button
            v-for="w in sentenceTokens"
            :key="w"
            type="button"
            class="token"
            @click="lookupToken(w)"
          >
            {{ w }}
          </button>
        </div>
      </div>

      <div v-else-if="!entry">
        <p class="muted">{{ t('popup.notFound', { query: result.query }) }}</p>
        <div v-if="result.suggestions.length" class="tokens">
          <span class="muted">{{ t('popup.didYouMean') }}</span>
          <button
            v-for="w in result.suggestions"
            :key="w"
            type="button"
            class="token"
            @click="lookupToken(w)"
          >
            {{ w }}
          </button>
        </div>
        <div v-if="showTranslation" class="translation">
          <div class="tr-head">
            <strong>{{ t('translate.title') }}</strong>
            <span class="ai" :title="t('translate.machineHint')">{{
              t('translate.machineBadge')
            }}</span>
          </div>
          <p v-if="translation.phase === 'loading'" class="muted">
            {{ t('translate.translating') }}
          </p>
          <p v-else-if="translation.phase === 'done'" class="tr-text">{{ translation.text }}</p>
          <p v-if="canUpgrade" class="tr-upgrade">
            {{ t('translate.upgradeHint') }}
            <button type="button" class="token" @click="installHigh">
              {{ t('translate.downloadHigh', { size: highSizeMb }) }}
            </button>
          </p>
          <p v-else-if="translation.phase === 'error'" class="tr-error">
            {{ t(translation.errorKey) }}
          </p>
          <div v-else-if="modelStatus?.state === 'downloading'" class="tr-download">
            <span class="muted">{{
              t('translate.downloading', { done: doneMb, total: sizeMb })
            }}</span>
            <progress :value="modelStatus.receivedBytes" :max="modelStatus.sizeBytes" />
            <button type="button" class="token" @click="cancelInstall">
              {{ t('translate.cancel') }}
            </button>
          </div>
          <div v-else-if="modelStatus" class="tr-download">
            <span class="muted">{{ t('translate.needModel', { size: sizeMb }) }}</span>
            <button type="button" class="save" @click="installModel">
              {{ t('translate.download') }}
            </button>
            <button type="button" class="token" @click="installHigh">
              {{ t('translate.downloadHigh', { size: highSizeMb }) }}
            </button>
          </div>
        </div>
      </div>

      <article v-else class="entry">
        <div class="headline">
          <span class="lemma">{{ entry.lemma }}</span>
          <span class="level" :title="entry.level">{{ entry.level.replace('_', '.') }}</span>
          <span class="pos">{{ entry.pos.join(', ') }}</span>
        </div>
        <p v-if="entry.via === 'form'" class="form-of">
          “{{ result.query }}” — {{ t('popup.formOf', { tags: entry.formTags.join(', ') }) }}
          <strong>{{ entry.lemma }}</strong>
        </p>
        <div class="ipa">
          <button
            type="button"
            class="say"
            :title="t('popup.listen')"
            @click="speak(entry.lemma, 'us')"
          >
            🔊 US <span v-if="entry.ipaUs">{{ entry.ipaUs }}</span>
          </button>
          <button
            type="button"
            class="say"
            :title="t('popup.listen')"
            @click="speak(entry.lemma, 'uk')"
          >
            🔊 UK <span v-if="entry.ipaUk">{{ entry.ipaUk }}</span>
          </button>
        </div>

        <p class="vi">
          <template v-if="entry.vi.length">{{ entry.vi.join('; ') }}</template>
          <span v-else class="muted">{{ t('popup.noVi') }}</span>
          <span v-if="entry.viGenerated" class="ai" :title="t('popup.aiHint')">{{
            t('popup.aiBadge')
          }}</span>
        </p>

        <ol class="senses">
          <li v-for="(s, i) in entry.senses.slice(0, 2)" :key="i">
            <em>{{ s.pos }}</em> {{ s.en }}
          </li>
        </ol>

        <div v-if="entry.examples.length" class="examples">
          <div v-for="(ex, i) in entry.examples" :key="i" class="example">
            <button type="button" class="say mini" @click="speak(ex.en)">🔊</button>
            <div>
              <div>{{ ex.en }}</div>
              <div v-if="ex.vi" class="muted">{{ ex.vi }}</div>
            </div>
          </div>
        </div>

        <div v-if="others.length" class="others">
          <span class="muted">{{ t('popup.otherResults') }}:</span>
          <button
            v-for="{ e, i } in others"
            :key="e.id"
            type="button"
            class="token"
            @click="selected = i"
          >
            {{ e.lemma }}
          </button>
        </div>
      </article>
    </main>

    <footer class="footer">
      <span>{{ toast || t('popup.footer') }}</span>
      <button
        v-if="entry"
        type="button"
        class="save"
        :class="{ done: entry.saved }"
        :disabled="entry.saved"
        @click="save"
      >
        {{ entry.saved ? `✓ ${t('popup.saved')}` : `💾 ${t('popup.save')}` }}
      </button>
    </footer>
    <TtsIndicator />
  </div>
</template>

<style scoped>
.popup {
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
  color: var(--c-ink);
  border: var(--px) solid var(--c-border);
  font-family: var(--font-ui);
  font-size: 14px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--c-primary);
  color: #fff;
  border-bottom: var(--px) solid var(--c-border);
}
.title {
  font-weight: 700;
}
.close {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
}
.search {
  padding: 8px 12px 0;
}
.search input {
  box-sizing: border-box;
  width: 100%;
  padding: 6px 8px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  outline: none;
}
.search input:focus {
  box-shadow: var(--px) var(--px) 0 0 var(--c-primary);
}
.body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}
.muted {
  color: var(--c-ink-soft);
}
.headline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.lemma {
  font-size: 22px;
  font-weight: 700;
}
.level {
  padding: 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-border);
}
.pos {
  color: var(--c-ink-soft);
  font-style: italic;
}
.form-of {
  margin: 2px 0;
  font-size: 12px;
  color: var(--c-ink-soft);
}
.ipa {
  display: flex;
  gap: 6px;
  margin: 4px 0 6px;
}
.say {
  padding: 1px 6px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.say:hover {
  background: #eef3ff;
}
.say.mini {
  padding: 0 4px;
  align-self: flex-start;
}
.vi {
  margin: 4px 0;
  font-size: 16px;
  font-weight: 600;
}
.ai {
  margin-left: 6px;
  padding: 0 4px;
  font-size: 10px;
  color: var(--c-ink);
  background: var(--c-warning);
  border: 1px solid var(--c-border);
  vertical-align: middle;
  cursor: help;
}
.senses {
  margin: 4px 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--c-ink-soft);
}
.senses em {
  color: var(--c-ink);
}
.examples {
  display: grid;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
}
.example {
  display: flex;
  gap: 6px;
}
.translation {
  display: grid;
  gap: 4px;
  margin: 6px 0;
  padding: 6px 8px;
  background: #fff8dc;
  border-left: 3px solid var(--c-primary);
}
.tr-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tr-upgrade {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--c-ink-soft);
}
.tr-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.tr-error {
  margin: 0;
  font-size: 12px;
  color: var(--c-danger);
}
.tr-download {
  display: grid;
  gap: 4px;
  justify-items: start;
  font-size: 12px;
}
.tr-download progress {
  width: 100%;
}
.tokens,
.others {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
}
.token {
  padding: 1px 6px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  cursor: pointer;
}
.token:hover {
  background: #eef3ff;
}
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--c-ink-soft);
  border-top: 1px dashed var(--c-ink-soft);
}
.save {
  padding: 3px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-success);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.save.done {
  background: var(--c-surface);
  color: var(--c-ink-soft);
  box-shadow: none;
  cursor: default;
}
</style>
