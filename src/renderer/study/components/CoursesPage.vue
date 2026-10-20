<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { cefrLabel } from '@shared/placement'
import type { CourseDetail, CourseStepState, CourseSummary } from '@shared/schemas/course'
import { invoke } from '@renderer/shared/ipc'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import LessonsPage from './LessonsPage.vue'

// Lộ trình học (Course → Unit → Lesson): chọn khoá → xem các chương và bài theo thứ tự → làm bài; xong quay về lộ trình
// với bài kế tiếp được đánh dấu.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()

const courses = ref<CourseSummary[]>([])
const detail = ref<CourseDetail | null>(null)
const running = ref<CourseStepState | null>(null)

const KIND_ICON = { lesson: '📚', grammar: '✍️', reading: '📖', listening: '🎧' } as const

const nextId = computed(() => detail.value?.next?.id ?? null)

async function loadList(): Promise<void> {
  courses.value = (await invoke('course:list')).courses
}

async function openCourse(id: string): Promise<void> {
  detail.value = await invoke('course:get', { id })
}

function start(step: CourseStepState): void {
  running.value = step
}

async function backFromLesson(): Promise<void> {
  running.value = null
  if (detail.value) await openCourse(detail.value.id)
  await loadList()
  emit('changed')
}

async function backToCourses(): Promise<void> {
  detail.value = null
  await loadList()
}

onMounted(loadList)
</script>

<template>
  <section class="courses">
    <LessonsPage
      v-if="running"
      :key="running.id"
      :kind="running.kind"
      :start-id="running.id"
      course-mode
      @exit="backFromLesson"
      @changed="emit('changed')"
    />

    <template v-else-if="detail">
      <button type="button" class="link" @click="backToCourses">
        ← {{ t('study.courses.back') }}
      </button>
      <header class="head">
        <span class="icon">{{ detail.icon }}</span>
        <div>
          <h1>{{ detail.title }}</h1>
          <p class="muted">{{ detail.summary }}</p>
          <p class="muted small">
            {{
              t('study.courses.levels', {
                from: cefrLabel(detail.levelFrom),
                to: cefrLabel(detail.levelTo)
              })
            }}
          </p>
        </div>
      </header>
      <PxPanel class="progress">
        <div>
          {{ t('study.courses.progress', { done: detail.stepsDone, total: detail.stepsTotal }) }}
        </div>
        <PxBar :value="detail.stepsDone" :max="Math.max(1, detail.stepsTotal)" label="course" />
        <button v-if="detail.next" type="button" class="primary" @click="start(detail.next)">
          ▶ {{ t('study.courses.continue') }}: {{ detail.next.title }}
        </button>
        <p v-else class="done">{{ t('study.courses.done') }}</p>
      </PxPanel>

      <PxPanel v-for="unit in detail.units" :key="unit.id" class="unit">
        <h2>{{ unit.title }}</h2>
        <p class="muted small">{{ unit.summary }}</p>
        <ul class="steps">
          <li v-for="s in unit.steps" :key="s.id">
            <button
              type="button"
              class="step"
              :class="{ done: s.done, next: s.id === nextId }"
              @click="start(s)"
            >
              <span class="state">{{ s.done ? '✅' : s.id === nextId ? '▶️' : '▫️' }}</span>
              <span class="kind" :title="t(`study.courses.kind.${s.kind}`)">{{
                KIND_ICON[s.kind]
              }}</span>
              <span class="title">{{ s.title }}</span>
              <span class="meta muted">
                {{ t('study.courses.minutes', { n: s.minutes }) }}
                <strong v-if="s.best !== null"> · {{ s.best }}%</strong>
              </span>
            </button>
          </li>
        </ul>
      </PxPanel>
    </template>

    <template v-else>
      <h1>{{ t('study.courses.title') }}</h1>
      <p class="muted">{{ t('study.courses.intro') }}</p>
      <PxPanel v-for="c in courses" :key="c.id" class="course">
        <div class="row">
          <span class="icon">{{ c.icon }}</span>
          <div class="main">
            <h2>{{ c.title }}</h2>
            <p class="muted">{{ c.summary }}</p>
            <p class="muted small">
              {{
                t('study.courses.levels', {
                  from: cefrLabel(c.levelFrom),
                  to: cefrLabel(c.levelTo)
                })
              }}
              · {{ t('study.courses.progress', { done: c.stepsDone, total: c.stepsTotal }) }}
            </p>
            <PxBar :value="c.stepsDone" :max="Math.max(1, c.stepsTotal)" label="course" />
          </div>
          <button type="button" class="primary" @click="openCourse(c.id)">
            {{ c.stepsDone ? t('study.courses.continue') : t('study.courses.start') }}
          </button>
        </div>
      </PxPanel>
    </template>
  </section>
</template>

<style scoped>
.courses {
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
  font-size: 17px;
}
.muted {
  margin: 2px 0;
  color: var(--c-ink-soft);
}
.small {
  font-size: 12px;
}
.link {
  justify-self: start;
  border: none;
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  cursor: pointer;
}
.head,
.row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.icon {
  font-size: 40px;
}
.main {
  display: grid;
  flex: 1;
  gap: 4px;
}
.course,
.unit,
.progress {
  padding: 14px 16px;
}
.progress {
  display: grid;
  gap: 8px;
}
.primary {
  padding: 8px 16px;
  border: var(--px) solid var(--c-border);
  background: var(--c-primary);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.done {
  margin: 0;
  font-weight: 700;
  color: var(--c-success);
}
.steps {
  display: grid;
  gap: 4px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}
.step {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: var(--px) solid transparent;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.step:hover {
  background: #eef3ff;
}
.step.next {
  border-color: var(--c-primary);
  background: #fff3a0;
  font-weight: 700;
}
.step .title {
  flex: 1;
}
.step.done .title {
  color: var(--c-ink-soft);
}
</style>
