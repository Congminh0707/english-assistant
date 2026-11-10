<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DIARY_MAX_CHARS,
  DIARY_MIN_WORDS,
  diaryWordCount,
  type DiaryEntry,
  type DiaryToday
} from '@shared/schemas/diary'
import { invoke, IpcError } from '@renderer/shared/ipc'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Nhật ký tiếng Anh buổi tối (docs/07 §14): chỉ hiển thị; lưu, thưởng, sửa bằng AI do DiaryService (main) lo.
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()

const view = ref<DiaryToday | null>(null)
const history = ref<DiaryEntry[]>([])
const draft = ref('')
const busy = ref<'save' | 'correct' | null>(null)
const error = ref('')
const savedNote = ref(false)
/** Bản AI sửa bị bỏ vì chữ đã đổi trong lúc chờ */
const stale = ref(false)

const entry = computed(() => view.value?.entry ?? null)
const words = computed(() => diaryWordCount(draft.value))
const dirty = computed(() => draft.value.trim() !== (entry.value?.text ?? ''))
const past = computed(() => history.value.filter((e) => e.id !== entry.value?.id))

function firstLine(text: string): string {
  return text.split(/\r?\n/)[0]
}

function showError(err: unknown): void {
  error.value = t(err instanceof IpcError ? err.info.messageKey : 'errors.unknown')
}

async function load(): Promise<void> {
  try {
    const [today, list] = await Promise.all([invoke('diary:today'), invoke('diary:list')])
    view.value = today
    history.value = list
    draft.value = today.entry?.text ?? ''
  } catch (err) {
    showError(err)
  }
}

/** Lưu chữ đang gõ (thưởng XP do main quyết định) */
async function persist(): Promise<void> {
  const saved = await invoke('diary:save', { text: draft.value })
  if (view.value) view.value = { ...view.value, entry: saved }
  draft.value = saved.text
  savedNote.value = true
  history.value = await invoke('diary:list')
  emit('changed')
}

async function run(kind: 'save' | 'correct', fn: () => Promise<void>): Promise<void> {
  busy.value = kind
  error.value = ''
  stale.value = false
  try {
    await fn()
  } catch (err) {
    showError(err)
  } finally {
    busy.value = null
  }
}

const save = (): Promise<void> => run('save', persist)

/** AI sửa đoạn hôm nay (lưu trước nếu chữ đã đổi) */
const correct = (): Promise<void> =>
  run('correct', async () => {
    if (dirty.value) await persist()
    const { entry: fixed, stale: changed } = await invoke('diary:correct')
    if (view.value) view.value = { ...view.value, entry: fixed }
    stale.value = changed
  })

onMounted(load)
</script>

<template>
  <section class="diary">
    <h1 class="page-title">{{ t('study.diary.title') }}</h1>

    <div class="card write">
      <p class="prompt">
        <UiIcon name="write" />
        <span>{{ view ? t(view.promptKey) : '' }}</span>
      </p>
      <textarea
        v-model="draft"
        rows="5"
        :maxlength="DIARY_MAX_CHARS"
        :placeholder="t('study.diary.placeholder')"
        :aria-label="t('study.diary.title')"
        @input="savedNote = false"
      />
      <div class="bar">
        <span class="count">
          {{ t('study.diary.words', { n: words }) }}
          <template v-if="words < DIARY_MIN_WORDS">
            · {{ t('study.diary.minWords', { n: DIARY_MIN_WORDS }) }}
          </template>
        </span>
        <span v-if="savedNote && !dirty" class="chip chip--success">
          {{ t('study.diary.saved') }}
        </span>
        <span class="actions">
          <button
            v-if="view?.aiReady"
            type="button"
            class="btn"
            :disabled="!draft.trim() || busy !== null"
            @click="correct"
          >
            <UiIcon name="pencil" />
            {{ busy === 'correct' ? t('study.diary.correcting') : t('study.diary.correct') }}
          </button>
          <button
            type="button"
            class="btn btn--primary"
            :disabled="!draft.trim() || !dirty || busy !== null"
            @click="save"
          >
            <UiIcon name="save" />
            {{ t('study.diary.save') }}
          </button>
        </span>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-else-if="stale" class="muted" role="status">{{ t('study.diary.staleCorrection') }}</p>
      <p v-else-if="view && !view.aiReady" class="muted">{{ t('study.diary.aiHint') }}</p>
    </div>

    <div v-if="entry?.corrected" class="card fixed">
      <h2>{{ t('study.diary.corrected') }}</h2>
      <p class="corrected">{{ entry.corrected }}</p>
      <ul v-if="entry.changes.length" class="changes">
        <li v-for="(c, i) in entry.changes" :key="i">
          <span class="from">{{ c.from }}</span>
          <UiIcon name="next" :size="14" />
          <span class="to">{{ c.to }}</span>
          <span class="note">{{ c.note_vi }}</span>
        </li>
      </ul>
      <p v-else class="muted">{{ t('study.diary.noChanges') }}</p>
      <p v-if="entry.praise" class="praise">
        <UiIcon name="star" />
        <span>{{ entry.praise }}</span>
      </p>
    </div>

    <div class="card past">
      <h2>{{ t('study.diary.history') }}</h2>
      <p v-if="!past.length" class="muted">{{ t('study.diary.empty') }}</p>
      <ul v-else class="days">
        <li v-for="e in past" :key="e.id">
          <span class="day">{{ e.day }}</span>
          <span class="line">{{ firstLine(e.text) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.diary {
  display: grid;
  gap: var(--sp-4);
  max-width: 760px;
}
.diary .page-title {
  margin: 0;
}
.write,
.fixed,
.past {
  display: grid;
  gap: var(--sp-3);
}
h2 {
  margin: 0;
  font-size: var(--fs-lg);
}
.prompt {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 700;
}
textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  line-height: 1.5;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
.count {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.actions {
  display: flex;
  gap: var(--sp-2);
  margin-left: auto;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.error {
  margin: 0;
  color: var(--c-danger);
  font-size: var(--fs-sm);
}
.corrected {
  margin: 0;
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-success-soft);
  line-height: 1.5;
  white-space: pre-line;
}
.changes,
.days {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.changes li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.from {
  color: var(--c-danger);
  text-decoration: line-through;
}
.to {
  color: var(--c-success);
  font-weight: 700;
}
.note {
  flex-basis: 100%;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.praise {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  color: var(--c-warning);
  font-weight: 600;
}
.days li {
  display: flex;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
  min-width: 0;
}
.day {
  flex: none;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}
.line {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
