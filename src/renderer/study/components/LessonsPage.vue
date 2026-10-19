<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import LessonExercises from './LessonExercises.vue'
import LessonViewer from './LessonViewer.vue'

// Bài học nền tảng: danh sách theo chương → đọc bài → làm bài tập → kết quả (thưởng lần đầu đạt).
const props = withDefaults(defineProps<{ kind?: LessonKind }>(), { kind: 'lesson' })
const emit = defineEmits<{ changed: [] }>()

/** Khoá i18n theo loại nội dung: study.lessons / study.grammar / study.reading */
const kindKey = computed(() =>
  props.kind === 'grammar' ? 'grammar' : props.kind === 'reading' ? 'reading' : 'lessons'
)

const { t } = useI18n()

type Mode = 'list' | 'read' | 'exercise' | 'result'
const mode = ref<Mode>('list')
const catalog = ref<LessonCatalog | null>(null)
const lesson = ref<Lesson | null>(null)
const result = ref<LessonCompleteResult | null>(null)
const busy = ref(false)

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

async function finish(correct: number, total: number): Promise<void> {
  if (!lesson.value) return
  busy.value = true
  try {
    result.value = await invoke('lesson:complete', {
      kind: props.kind,
      lessonId: lesson.value.id,
      correct,
      total
    })
    mode.value = 'result'
    await loadCatalog()
    emit('changed')
  } finally {
    busy.value = false
  }
}

async function backToList(): Promise<void> {
  mode.value = 'list'
  await loadCatalog()
}

onMounted(loadCatalog)
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
      @back="mode = 'read'"
      @finish="finish"
    />

    <PxPanel v-else-if="mode === 'result' && result && lesson" class="result">
      <div class="stars" aria-hidden="true">{{ '⭐'.repeat(stars) }}</div>
      <h2>
        {{
          result.score >= LESSON_PASS_PERCENT
            ? t('study.lessons.passed', { score: result.score })
            : t('study.lessons.notPassed', { score: result.score })
        }}
      </h2>
      <p class="muted">{{ lesson.title }} · {{ t('study.lessons.best', { n: result.best }) }}</p>
      <p v-if="result.firstCompletion" class="reward">
        {{ t('study.missions.reward', { xp: result.xp, coins: result.coins }) }}
      </p>
      <p v-else-if="result.score < LESSON_PASS_PERCENT" class="muted">
        {{ t('study.lessons.needMore', { n: LESSON_PASS_PERCENT }) }}
      </p>
      <div class="row">
        <button
          v-if="result.nextLessonId && result.score >= LESSON_PASS_PERCENT"
          type="button"
          class="primary"
          @click="open(result.nextLessonId)"
        >
          {{ t('study.lessons.nextLesson') }} →
        </button>
        <button type="button" class="secondary" @click="mode = 'read'">
          {{ t('study.lessons.reread') }}
        </button>
        <button type="button" class="secondary" @click="mode = 'exercise'">
          {{ t('study.lessons.retry') }}
        </button>
        <button type="button" class="secondary" @click="backToList">
          {{ t('study.lessons.toList') }}
        </button>
      </div>
    </PxPanel>

    <template v-else-if="catalog">
      <h1>{{ t(`study.${kindKey}.title`) }}</h1>
      <p class="muted">{{ t(`study.${kindKey}.intro`) }}</p>

      <PxPanel class="progress">
        <div class="progress-text">
          {{ t('study.lessons.progress', { done: catalog.doneCount, total: catalog.totalCount }) }}
        </div>
        <PxBar :value="catalog.doneCount" :max="Math.max(1, catalog.totalCount)" label="progress" />
        <button v-if="nextUp" type="button" class="primary" @click="open(nextUp.id)">
          ▶ {{ t('study.lessons.continue') }}: {{ nextUp.title }}
        </button>
        <p v-else-if="catalog.totalCount" class="reward">🎉 {{ t('study.lessons.allDone') }}</p>
      </PxPanel>

      <p v-if="!catalog.units.length" class="muted">{{ t('study.lessons.empty') }}</p>

      <PxPanel v-for="unit in catalog.units" :key="unit.id" class="unit">
        <header class="unit-head">
          <span class="unit-icon">{{ unit.icon }}</span>
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
              <span class="state">{{ l.progress.done ? '✅' : '▫️' }}</span>
              <span class="lesson-main">
                <span class="lesson-title">{{ l.title }}</span>
                <span class="lesson-summary">{{ l.summary }}</span>
              </span>
              <span class="lesson-meta">
                <span class="tag">{{ cefrLabel(l.level) }}</span>
                <span class="muted">{{ t('study.lessons.minutes', { n: l.minutes }) }}</span>
                <span v-if="l.progress.best !== null" class="best">{{ l.progress.best }}%</span>
              </span>
            </button>
          </li>
        </ul>
      </PxPanel>
    </template>
  </section>
</template>

<style scoped>
.lessons {
  display: grid;
  gap: 12px;
  max-width: 760px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: 22px;
}
h2 {
  margin: 0;
  font-size: 16px;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: 13px;
}
.progress {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
}
.progress-text {
  font-weight: 700;
}
.primary {
  justify-self: start;
  padding: 10px 18px;
  border: var(--px) solid var(--c-border);
  background: var(--c-success);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.secondary {
  padding: 8px 14px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  cursor: pointer;
}
.reward {
  margin: 0;
  font-weight: 700;
  color: var(--c-xp);
}
.unit {
  padding: 14px 16px;
}
.unit-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.unit-head > div {
  flex: 1;
}
.unit-icon {
  font-size: 30px;
}
.unit-count {
  font-weight: 700;
  color: var(--c-ink-soft);
}
.list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lesson {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lesson:hover {
  background: #eef3ff;
}
.lesson.done {
  background: #eef8f0;
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
  font-size: 12px;
  color: var(--c-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lesson-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.tag {
  padding: 0 5px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-border);
}
.best {
  font-weight: 700;
  color: var(--c-success);
}
.result {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 28px 24px;
  text-align: center;
}
.stars {
  font-size: 40px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}
</style>
