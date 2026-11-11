<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { cefrLabel } from '@shared/placement'
import type {
  Lesson,
  LessonCatalog,
  LessonCompleteResult,
  LessonKind
} from '@shared/schemas/lesson'
import { LESSON_PASS_PERCENT } from '@shared/schemas/lesson'
import { invoke } from '@renderer/shared/ipc'
import { BookOpen } from 'lucide-vue-next'
import AudioPackPanel from '@renderer/shared/components/AudioPackPanel.vue'
import LessonExercises from './LessonExercises.vue'
import LessonViewer from './LessonViewer.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { SHELL_FOCUS } from '../places'

// Bài học nền tảng: danh sách theo chương → đọc bài → làm bài tập → kết quả (thưởng lần đầu đạt).
const props = withDefaults(
  defineProps<{ kind?: LessonKind; startId?: string; courseMode?: boolean }>(),
  { kind: 'lesson', startId: undefined, courseMode: false }
)
const emit = defineEmits<{ changed: []; exit: [] }>()

/** Khoá i18n theo loại nội dung: study.lessons / study.grammar / study.reading */
const kindKey = computed(() => (props.kind === 'lesson' ? 'lessons' : props.kind))

const { t } = useI18n()

type Mode = 'list' | 'read' | 'exercise' | 'result'
const mode = ref<Mode>('list')
const catalog = ref<LessonCatalog | null>(null)
const lesson = ref<Lesson | null>(null)
const result = ref<LessonCompleteResult | null>(null)
const busy = ref(false)

// Đang đọc/làm/xem kết quả một bài → báo PlaceShell ẩn tab
const shellFocus = inject(SHELL_FOCUS, null)
watch(
  mode,
  (m) => {
    if (shellFocus) shellFocus.value = m !== 'list'
  },
  { immediate: true }
)
onUnmounted(() => {
  if (shellFocus) shellFocus.value = false
})

const nextUp = computed(() => {
  for (const unit of catalog.value?.units ?? []) {
    const found = unit.lessons.find((l) => !l.progress.done)
    if (found) return found
  }
  return null
})

const stars = computed(() => {
  const s = result.value?.score ?? 0
  return s >= 90 ? 3 : s >= LESSON_PASS_PERCENT ? 2 : 1
})

async function loadCatalog(): Promise<void> {
  catalog.value = await invoke('lesson:catalog', { kind: props.kind })
}

async function open(id: string): Promise<void> {
  if (busy.value) return
  busy.value = true
  try {
    lesson.value = await invoke('lesson:get', { kind: props.kind, id })
    result.value = null
    mode.value = 'read'
  } finally {
    busy.value = false
  }
}

async function finish(
  correct: number,
  total: number,
  byType: Array<{ type: string; correct: number; total: number }>
): Promise<void> {
  if (!lesson.value) return
  busy.value = true
  try {
    result.value = await invoke('lesson:complete', {
      kind: props.kind,
      lessonId: lesson.value.id,
      correct,
      total,
      byType
    })
    mode.value = 'result'
    await loadCatalog()
    emit('changed')
  } finally {
    busy.value = false
  }
}

async function backToList(): Promise<void> {
  // Mở từ lộ trình: quay về lộ trình thay vì danh sách bài
  if (props.courseMode) return emit('exit')
  mode.value = 'list'
  await loadCatalog()
}

onMounted(async () => {
  if (props.startId) await open(props.startId)
  else await loadCatalog()
})
</script>

<template>
  <section class="lessons">
    <LessonViewer
      v-if="mode === 'read' && lesson"
      :lesson="lesson"
      @back="backToList"
      @start="mode = 'exercise'"
    />

    <LessonExercises
      v-else-if="mode === 'exercise' && lesson"
      :key="lesson.id + ':' + (result?.score ?? 'n')"
      :lesson="lesson"
      :kind="kind"
      @back="mode = 'read'"
      @finish="finish"
    />

    <div v-else-if="mode === 'result' && result && lesson" class="card result">
      <div class="stars" aria-hidden="true">
        <UiIcon v-for="n in stars" :key="n" name="star" :size="32" />
      </div>
      <h2>
        {{
          result.score >= LESSON_PASS_PERCENT
            ? t('study.lessons.passed', { score: result.score })
            : t('study.lessons.notPassed', { score: result.score })
        }}
      </h2>
      <p class="muted">{{ lesson.title }} · {{ t('study.lessons.best', { n: result.best }) }}</p>
      <p v-if="result.firstCompletion" class="chip chip--xp">
        {{ t('study.missions.reward', { xp: result.xp, coins: result.coins }) }}
      </p>
      <p v-else-if="result.score < LESSON_PASS_PERCENT" class="muted">
        {{ t('study.lessons.needMore', { n: LESSON_PASS_PERCENT }) }}
      </p>
      <p v-if="result.savedWords" class="chip chip--primary">
        <UiIcon name="saved" />
        {{ t('study.lessons.autoSaved', { n: result.savedWords }, result.savedWords) }}
      </p>
      <div class="row">
        <button
          v-if="!courseMode && result.nextLessonId && result.score >= LESSON_PASS_PERCENT"
          type="button"
          class="btn btn--primary"
          @click="open(result.nextLessonId)"
        >
          {{ t('study.lessons.nextLesson') }} <UiIcon name="next" />
        </button>
        <button type="button" class="btn" @click="mode = 'read'">
          {{ t('study.lessons.reread') }}
        </button>
        <button type="button" class="btn" @click="mode = 'exercise'">
          {{ t('study.lessons.retry') }}
        </button>
        <button type="button" class="btn" @click="backToList">
          {{ courseMode ? t('study.courses.backToCourse') : t('study.lessons.toList') }}
        </button>
      </div>
    </div>

    <template v-else-if="catalog">
      <h1 class="page-title">{{ t(`study.${kindKey}.title`) }}</h1>
      <p class="muted">{{ t(`study.${kindKey}.intro`) }}</p>
      <AudioPackPanel v-if="kind === 'listening'" compact />

      <div class="card progress">
        <div class="progress-text">
          {{ t('study.lessons.progress', { done: catalog.doneCount, total: catalog.totalCount }) }}
        </div>
        <progress class="bar" :value="catalog.doneCount" :max="Math.max(1, catalog.totalCount)" />
        <button v-if="nextUp" type="button" class="btn btn--primary" @click="open(nextUp.id)">
          <UiIcon name="play" /> {{ t('study.lessons.continue') }}: {{ nextUp.title }}
        </button>
        <p v-else-if="catalog.totalCount" class="chip chip--success">
          <UiIcon name="party" /> {{ t('study.lessons.allDone') }}
        </p>
      </div>

      <div v-if="!catalog.units.length" class="empty">
        <span class="empty-ico"><BookOpen :size="22" :stroke-width="2.2" /></span>
        <strong>{{ t('study.lessons.empty') }}</strong>
      </div>

      <section v-for="unit in catalog.units" :key="unit.id" class="card unit">
        <header class="unit-head">
          <span class="unit-icon"><BookOpen :size="20" :stroke-width="2.2" /></span>
          <div>
            <h2>{{ unit.title }}</h2>
            <p class="muted">{{ unit.summary }}</p>
          </div>
          <span class="unit-count">
            {{ unit.lessons.filter((l) => l.progress.done).length }}/{{ unit.lessons.length }}
          </span>
        </header>
        <ul class="list">
          <li v-for="l in unit.lessons" :key="l.id">
            <button
              type="button"
              class="lesson"
              :class="{ done: l.progress.done }"
              @click="open(l.id)"
            >
              <span class="state"><UiIcon :name="l.progress.done ? 'done' : 'dot'" /></span>
              <span class="lesson-main">
                <span class="lesson-title">{{ l.title }}</span>
                <span class="lesson-summary">{{ l.summary }}</span>
              </span>
              <span class="lesson-meta">
                <span class="chip chip--primary">{{ cefrLabel(l.level) }}</span>
                <span class="muted">{{ t('study.lessons.minutes', { n: l.minutes }) }}</span>
                <span v-if="l.progress.best !== null" class="best">{{ l.progress.best }}%</span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
.lessons {
  display: grid;
  gap: var(--sp-3);
  max-width: 980px;
}
.page-title {
  margin: 0;
}
h2 {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 800;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.progress {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--sp-1) var(--sp-4);
  align-items: center;
}
.progress .bar {
  width: 100%;
}
.progress-text {
  font-weight: 700;
}
.progress .btn,
.progress .chip {
  grid-row: 1 / 3;
  grid-column: 2;
}
.unit-head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}
.unit-head > div {
  flex: 1;
}
.unit-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.unit-count {
  font-weight: 700;
  color: var(--c-ink-soft);
}
.list {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.lesson {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  border: 2px solid var(--c-line);
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lesson:hover {
  background: var(--c-surface-2);
}
.lesson .state {
  display: inline-flex;
  color: var(--c-line);
}
.lesson.done .state {
  color: var(--c-success);
}
.lesson-main {
  flex: 1;
  display: grid;
  min-width: 0;
}
.lesson-title {
  font-weight: 700;
}
.lesson-summary {
  overflow: hidden;
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lesson-meta {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
}
.best {
  font-weight: 700;
  color: var(--c-success);
}
.empty {
  display: grid;
  gap: var(--sp-3);
  justify-items: center;
  padding: var(--sp-7) 0;
  font-size: var(--fs-xl);
  text-align: center;
}
.empty-ico {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  background: var(--c-surface-2);
  color: var(--c-ink-soft);
}
.result {
  display: grid;
  gap: var(--sp-2);
  justify-items: center;
  max-width: 560px;
  margin: var(--sp-6) auto 0;
  padding: var(--sp-6) var(--sp-5);
  text-align: center;
}
.result h2 {
  font-size: var(--fs-2xl);
}
.stars {
  display: flex;
  gap: var(--sp-2);
  color: var(--c-coin);
}
.stars :deep(svg) {
  fill: currentColor;
}
.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}
</style>
