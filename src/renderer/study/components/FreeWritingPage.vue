<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  FREE_TOPIC_MAX_CHARS,
  FREE_WRITING_BANDS,
  FREE_WRITING_FEEDBACK_MIN_WORDS,
  FREE_WRITING_LENGTHS,
  FREE_WRITING_MAX_CHARS,
  FREE_WRITING_REWARD_MIN_WORDS,
  freeWritingWordCount,
  lengthRange
} from '@shared/freeWriting'
import type { WritingResult } from '@shared/schemas/writing'
import { useFreeWritingStore } from '@renderer/shared/stores/freeWriting'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import WriteBoard from '../exercises/WriteBoard.vue'
import WritingFeedback from '../exercises/WritingFeedback.vue'

// Viết tự do theo đề (docs/07 "Viết tự do"): chỉ hiển thị; lưu, thưởng, nhận xét AI do FreeWritingService (main) lo,
// bản nháp giữ trong useFreeWritingStore.
const emit = defineEmits<{ changed: [] }>()
const { t, locale } = useI18n()
const s = useFreeWritingStore()

const draftWords = computed(() => freeWritingWordCount(s.draft))
const canSave = computed(
  () => !!s.draft.trim() && (s.custom ? !!s.customText.trim() : !!s.topicId) && s.busy === null
)
const aiReady = computed(() => !!s.view?.aiReady)
/** Nhận xét AI dưới dạng kết quả chấm bài viết để dùng lại WritingFeedback (không có ngưỡng đạt) */
const feedbackResult = computed<WritingResult | null>(() =>
  s.entry?.feedback
    ? {
        passed: true,
        gradedBy: 'ai',
        words: s.entry.words,
        feedback: s.entry.feedback,
        aiReason: null
      }
    : null
)
const canAskAi = computed(
  () =>
    !!s.entry &&
    !s.entry.feedback &&
    !s.editing &&
    s.entry.words >= FREE_WRITING_FEEDBACK_MIN_WORDS &&
    s.busy === null
)

const dateOf = (ms: number): string =>
  new Date(ms).toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-GB')

async function submit(withFeedback: boolean): Promise<void> {
  await s.submit(withFeedback)
  emit('changed')
}

async function saveEdit(): Promise<void> {
  await s.saveEdit()
  emit('changed')
}

async function remove(): Promise<void> {
  if (!window.confirm(t('study.freeWriting.confirmDelete'))) return
  await s.remove()
}

const refreshAi = (): void => void s.refreshAi()
let offSettings: (() => void) | undefined
onMounted(() => {
  void s.load()
  window.addEventListener('focus', refreshAi)
  offSettings = window.api.on('settings:changed', refreshAi)
})
onUnmounted(() => {
  window.removeEventListener('focus', refreshAi)
  offSettings?.()
})
</script>

<template>
  <section class="fw">
    <h1 class="page-title">{{ t('study.freeWriting.title') }}</h1>
    <p class="muted">
      {{ t('study.freeWriting.intro') }}
      {{ t('study.freeWriting.reward', { n: FREE_WRITING_REWARD_MIN_WORDS }) }}
    </p>
    <p v-if="s.loadError" class="error" role="alert">{{ t(s.loadError) }}</p>

    <!-- Viết bài mới -->
    <template v-if="!s.entry">
      <div class="card block">
        <h2>{{ t('study.freeWriting.topic') }}</h2>
        <div class="chips" role="group" :aria-label="t('study.freeWriting.band')">
          <button
            v-for="b in FREE_WRITING_BANDS"
            :key="b"
            type="button"
            class="btn btn--sm btn--pill"
            :class="{ 'btn--primary': s.band === b }"
            :aria-pressed="s.band === b"
            @click="s.setBand(b)"
          >
            {{ b }}
          </button>
          <button
            type="button"
            class="btn btn--sm btn--pill"
            :class="{ 'btn--primary': s.custom }"
            :aria-pressed="s.custom"
            @click="s.custom = !s.custom"
          >
            <UiIcon name="pencil" :size="14" /> {{ t('study.freeWriting.custom') }}
          </button>
        </div>

        <template v-if="!s.custom">
          <div class="row">
            <select
              :value="s.topicId ?? ''"
              :aria-label="t('study.freeWriting.topic')"
              @change="s.topicId = ($event.target as HTMLSelectElement).value || null"
            >
              <option v-for="tp in s.topics" :key="tp.id" :value="tp.id">{{ tp.title }}</option>
            </select>
            <button type="button" class="btn btn--sm" @click="s.randomTopic()">
              <UiIcon name="shuffle" :size="14" /> {{ t('study.freeWriting.another') }}
            </button>
          </div>
          <template v-if="s.topic">
            <p class="prompt">{{ s.topic.prompt }}</p>
            <div class="hints">
              <h3><UiIcon name="hint" :size="14" /> {{ t('study.freeWriting.hints') }}</h3>
              <ul>
                <li v-for="(h, i) in s.topic.hints" :key="i">{{ h }}</li>
              </ul>
            </div>
          </template>
          <p v-else-if="s.view" class="muted">{{ t('study.freeWriting.noTopics') }}</p>
        </template>
        <template v-else>
          <div class="row">
            <input
              v-model="s.customText"
              type="text"
              class="custom"
              :maxlength="FREE_TOPIC_MAX_CHARS"
              :placeholder="t('study.freeWriting.customPlaceholder')"
              :aria-label="t('study.freeWriting.custom')"
            />
          </div>
          <p class="muted">
            {{ t('study.freeWriting.customHint', { band: s.band }) }} · {{ s.customText.length }}/{{
              FREE_TOPIC_MAX_CHARS
            }}
          </p>
        </template>
      </div>

      <div class="card block">
        <h2>{{ t('study.freeWriting.write') }}</h2>
        <div class="chips" role="group" :aria-label="t('study.freeWriting.length')">
          <button
            v-for="l in FREE_WRITING_LENGTHS"
            :key="l"
            type="button"
            class="btn btn--sm btn--pill"
            :class="{ 'btn--primary': s.length === l }"
            :aria-pressed="s.length === l"
            @click="s.length = l"
          >
            {{
              t('study.freeWriting.lengthOption', {
                name: t(`study.freeWriting.lengths.${l}`),
                min: lengthRange(s.rangeBand, l).min,
                max: lengthRange(s.rangeBand, l).max
              })
            }}
          </button>
        </div>
        <WriteBoard
          v-model="s.draft"
          :min-words="s.range.min"
          :max-words="s.range.max"
          :max-chars="FREE_WRITING_MAX_CHARS"
          :locked="s.busy !== null"
          :label="t('study.freeWriting.write')"
        />
        <div class="bar">
          <span v-if="s.busy === 'feedback'" class="muted" role="status">
            {{ t('study.freeWriting.feedbackBusy') }}
          </span>
          <span class="actions">
            <button
              type="button"
              class="btn"
              :class="{ 'btn--primary': !aiReady }"
              :disabled="!canSave"
              @click="submit(false)"
            >
              <UiIcon name="save" /> {{ t('study.freeWriting.save') }}
            </button>
            <button
              v-if="aiReady"
              type="button"
              class="btn btn--primary"
              :disabled="!canSave || draftWords < FREE_WRITING_FEEDBACK_MIN_WORDS"
              @click="submit(true)"
            >
              <UiIcon name="pencil" /> {{ t('study.freeWriting.saveFeedback') }}
            </button>
          </span>
        </div>
        <p v-if="s.error" class="error" role="alert">{{ t(s.error) }}</p>
        <p v-else-if="aiReady && draftWords < FREE_WRITING_FEEDBACK_MIN_WORDS" class="muted">
          {{ t('study.freeWriting.minFeedback', { n: FREE_WRITING_FEEDBACK_MIN_WORDS }) }}
        </p>
        <p v-else-if="s.view && !aiReady" class="muted">{{ t('study.freeWriting.aiHint') }}</p>
      </div>
    </template>

    <!-- Bài đang mở -->
    <template v-else>
      <div class="card block">
        <div class="head">
          <h2>{{ s.entry.title }}</h2>
          <span class="chip">{{ s.entry.band }}</span>
          <span class="chip">{{ t(`study.freeWriting.lengths.${s.entry.length}`) }}</span>
          <span class="chip">{{ t('study.freeWriting.words', { n: s.entry.words }) }}</span>
          <span class="muted">{{ dateOf(s.entry.createdAt) }}</span>
        </div>
        <p v-if="s.entry.task !== s.entry.title" class="prompt">{{ s.entry.task }}</p>

        <WriteBoard
          v-if="s.editing"
          v-model="s.editText"
          :min-words="s.entry.minWords"
          :max-words="s.entry.maxWords"
          :max-chars="FREE_WRITING_MAX_CHARS"
          :locked="s.busy !== null"
          :label="t('study.freeWriting.write')"
        />
        <p v-else class="para">{{ s.entry.text }}</p>

        <div class="bar">
          <span v-if="s.busy === 'feedback'" class="muted" role="status">
            {{ t('study.freeWriting.feedbackBusy') }}
          </span>
          <span class="actions">
            <template v-if="s.editing">
              <button
                type="button"
                class="btn"
                :disabled="s.busy !== null"
                @click="s.editing = false"
              >
                {{ t('study.freeWriting.cancel') }}
              </button>
              <button
                type="button"
                class="btn btn--primary"
                :disabled="!s.editText.trim() || s.busy !== null"
                @click="saveEdit"
              >
                <UiIcon name="save" /> {{ t('study.freeWriting.save') }}
              </button>
            </template>
            <template v-else>
              <button type="button" class="btn" :disabled="s.busy !== null" @click="s.newEntry()">
                <UiIcon name="write" /> {{ t('study.freeWriting.newEntry') }}
              </button>
              <button type="button" class="btn" :disabled="s.busy !== null" @click="s.startEdit()">
                <UiIcon name="pencil" /> {{ t('study.freeWriting.edit') }}
              </button>
              <button
                type="button"
                class="btn btn--ghost"
                :disabled="s.busy !== null"
                @click="remove"
              >
                <UiIcon name="trash" /> {{ t('study.freeWriting.delete') }}
              </button>
              <button
                v-if="!s.entry.feedback"
                type="button"
                class="btn btn--primary"
                :disabled="!canAskAi"
                @click="s.requestFeedback()"
              >
                <UiIcon name="pencil" /> {{ t('study.freeWriting.feedback') }}
              </button>
            </template>
          </span>
        </div>
        <p v-if="s.error" class="error" role="alert">{{ t(s.error) }}</p>
        <p v-else-if="s.stale" class="muted" role="status">{{ t('study.freeWriting.stale') }}</p>
        <p v-else-if="s.aiReason" class="muted" role="status">
          {{ t('study.freeWriting.noFeedback') }} {{ t(s.aiReason) }}
          {{ t('study.freeWriting.retryHint') }}
        </p>
        <p
          v-else-if="!s.entry.feedback && s.entry.words < FREE_WRITING_FEEDBACK_MIN_WORDS"
          class="muted"
        >
          {{ t('study.freeWriting.minFeedback', { n: FREE_WRITING_FEEDBACK_MIN_WORDS }) }}
        </p>
      </div>
      <WritingFeedback
        v-if="feedbackResult && !s.editing"
        :write="feedbackResult"
        :graded="false"
      />
    </template>

    <!-- Bài đã viết -->
    <div class="card block">
      <h2>{{ t('study.freeWriting.history', { n: s.total }) }}</h2>
      <p v-if="!s.history.length" class="muted">{{ t('study.freeWriting.empty') }}</p>
      <ul v-else class="list">
        <li v-for="e in s.history" :key="e.id">
          <button
            type="button"
            class="btn btn--ghost btn--block item"
            :class="{ on: e.id === s.entry?.id }"
            @click="s.open(e.id)"
          >
            <span class="date">{{ dateOf(e.createdAt) }}</span>
            <span class="title">{{ e.title }}</span>
            <span class="muted">{{ t('study.freeWriting.words', { n: e.words }) }}</span>
            <span v-if="e.score !== null" class="chip chip--primary">
              {{ t('study.freeWriting.score', { n: e.score }) }}
            </span>
          </button>
        </li>
      </ul>
      <button v-if="s.hasMore" type="button" class="btn btn--sm" @click="s.loadHistory(true)">
        {{ t('study.freeWriting.more') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.fw {
  display: grid;
  gap: var(--sp-4);
  max-width: 760px;
}
.fw .page-title {
  margin: 0;
}
.block {
  display: grid;
  gap: var(--sp-3);
}
h2 {
  margin: 0;
  font-size: var(--fs-lg);
}
.chips,
.row,
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
.row select,
.custom {
  flex: 1;
  min-width: 0;
}
.prompt {
  margin: 0;
  font-weight: 600;
  line-height: 1.5;
}
.hints h3 {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin: 0 0 var(--sp-1);
  font-size: var(--fs-sm);
}
.hints ul {
  display: grid;
  gap: var(--sp-1);
  margin: 0;
  padding-left: var(--sp-4);
  color: var(--c-ink-soft);
}
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
.actions {
  display: flex;
  flex-wrap: wrap;
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
.para {
  margin: 0;
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
  line-height: 1.5;
  white-space: pre-line;
}
.list {
  display: grid;
  gap: var(--sp-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.item {
  justify-content: flex-start;
  gap: var(--sp-3);
  min-width: 0;
  text-align: left;
}
.item.on {
  background: var(--c-surface-2);
}
.date {
  flex: none;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}
.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
