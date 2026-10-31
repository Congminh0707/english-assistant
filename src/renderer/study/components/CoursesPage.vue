<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  BookOpen,
  BookText,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Headphones,
  MessageSquare,
  PenLine,
  Rocket,
  Sprout
} from 'lucide-vue-next'
import { cefrLabel } from '@shared/placement'
import type { CourseDetail, CourseStepState, CourseSummary } from '@shared/schemas/course'
import { invoke } from '@renderer/shared/ipc'
import LessonsPage from './LessonsPage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Lộ trình học (Course → Unit → Lesson): danh sách khoá bên trái, chương và bài của khoá đang chọn bên phải;
// làm bài xong quay về lộ trình với bài kế tiếp được đánh dấu.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()

const courses = ref<CourseSummary[]>([])
const detail = ref<CourseDetail | null>(null)
const running = ref<CourseStepState | null>(null)
/** Chương đang mở; mặc định mở chương có bài kế tiếp */
const openUnits = ref<Set<string>>(new Set())

const KIND_ICON: Record<CourseStepState['kind'], Component> = {
  lesson: BookOpen,
  grammar: PenLine,
  reading: BookText,
  listening: Headphones
}
// Dữ liệu khoá lưu emoji; giao diện đổi sang icon lucide
const COURSE_ICON: Record<string, Component> = {
  '🌱': Sprout,
  '💬': MessageSquare,
  '🚀': Rocket
}
function courseIcon(emoji: string): Component {
  return COURSE_ICON[emoji] ?? GraduationCap
}

const nextId = computed(() => detail.value?.next?.id ?? null)

async function loadList(): Promise<void> {
  courses.value = (await invoke('course:list')).courses
  // Chưa chọn khoá nào thì mở khoá đang học dở (hoặc khoá đầu tiên)
  if (!detail.value && courses.value.length) {
    const cur =
      courses.value.find((c) => c.next && c.stepsDone > 0) ?? courses.value.find((c) => c.next)
    await openCourse((cur ?? courses.value[0]).id)
  }
}

async function openCourse(id: string): Promise<void> {
  detail.value = await invoke('course:get', { id })
  const withNext = detail.value.units.find((u) => u.steps.some((s) => s.id === nextId.value))
  openUnits.value = new Set([withNext?.id ?? detail.value.units[0]?.id ?? ''])
}

function toggleUnit(id: string): void {
  const next = new Set(openUnits.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openUnits.value = next
}

function unitDone(steps: CourseStepState[]): number {
  return steps.filter((s) => s.done).length
}

function start(step: CourseStepState): void {
  running.value = step
}

async function backFromLesson(): Promise<void> {
  running.value = null
  if (detail.value) await openCourse(detail.value.id)
  courses.value = (await invoke('course:list')).courses
  emit('changed')
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

    <template v-else>
      <h1 class="page-title">{{ t('study.courses.title') }}</h1>
      <p class="intro">{{ t('study.courses.intro') }}</p>
      <div class="cols">
        <ul class="list">
          <li v-for="c in courses" :key="c.id">
            <button
              type="button"
              class="card course"
              :class="{ on: detail?.id === c.id }"
              @click="openCourse(c.id)"
            >
              <span class="ico"
                ><component :is="courseIcon(c.icon)" :size="20" :stroke-width="2.2"
              /></span>
              <span class="main">
                <strong>{{ c.title }}</strong>
                <span class="muted">
                  {{
                    t('study.courses.levels', {
                      from: cefrLabel(c.levelFrom),
                      to: cefrLabel(c.levelTo)
                    })
                  }}
                </span>
              </span>
              <progress class="bar" :value="c.stepsDone" :max="Math.max(1, c.stepsTotal)" />
              <span class="count">
                <span v-if="!c.next && c.stepsTotal" class="chip chip--success">{{
                  t('study.courses.done')
                }}</span>
                <span v-else class="muted">{{
                  t('study.courses.progress', { done: c.stepsDone, total: c.stepsTotal })
                }}</span>
              </span>
            </button>
          </li>
        </ul>

        <div v-if="detail" class="detail">
          <header class="card head">
            <div class="top">
              <h2>{{ detail.title }}</h2>
              <p class="muted">{{ detail.summary }}</p>
            </div>
            <div class="prog">
              <div class="prog-bar">
                <strong>{{
                  t('study.courses.progress', { done: detail.stepsDone, total: detail.stepsTotal })
                }}</strong>
                <progress
                  class="bar"
                  :value="detail.stepsDone"
                  :max="Math.max(1, detail.stepsTotal)"
                />
              </div>
              <button
                v-if="detail.next"
                type="button"
                class="btn btn--primary"
                @click="start(detail.next)"
              >
                <UiIcon name="play" /> {{ t('study.courses.continue') }}: {{ detail.next.title }}
              </button>
              <span v-else class="chip chip--success">{{ t('study.courses.done') }}</span>
            </div>
          </header>

          <section v-for="unit in detail.units" :key="unit.id" class="card unit">
            <button
              type="button"
              class="unit-head"
              :aria-expanded="openUnits.has(unit.id)"
              @click="toggleUnit(unit.id)"
            >
              <span class="unit-title">
                <strong>{{ unit.title }}</strong>
                <span v-if="openUnits.has(unit.id)" class="muted">{{ unit.summary }}</span>
              </span>
              <span class="muted">{{ unitDone(unit.steps) }}/{{ unit.steps.length }}</span>
              <component
                :is="openUnits.has(unit.id) ? ChevronDown : ChevronRight"
                :size="16"
                :stroke-width="2.4"
              />
            </button>
            <ul v-if="openUnits.has(unit.id)" class="steps">
              <li v-for="s in unit.steps" :key="s.id">
                <button
                  type="button"
                  class="step"
                  :class="{ done: s.done, next: s.id === nextId }"
                  @click="start(s)"
                >
                  <span class="state"
                    ><UiIcon :name="s.done ? 'done' : s.id === nextId ? 'play' : 'dot'"
                  /></span>
                  <span class="kind" :title="t(`study.courses.kind.${s.kind}`)"
                    ><component :is="KIND_ICON[s.kind]" :size="16" :stroke-width="2.2"
                  /></span>
                  <span class="title">{{ s.title }}</span>
                  <span class="meta muted">
                    {{ t('study.courses.minutes', { n: s.minutes }) }}
                  </span>
                  <strong v-if="s.best !== null" class="best">{{ s.best }}%</strong>
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.courses {
  display: grid;
  gap: var(--sp-3);
  max-width: 980px;
}
.page-title {
  margin: 0;
}
.intro {
  margin: calc(-1 * var(--sp-2)) 0 var(--sp-2);
  color: var(--c-ink-soft);
}
h2 {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 800;
}
.muted {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.cols {
  display: grid;
  grid-template-columns: minmax(200px, 264px) minmax(0, 1fr);
  gap: var(--sp-4);
  align-items: start;
}
@media (max-width: 820px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
.list {
  display: grid;
  gap: var(--sp-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
.course {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--sp-1) var(--sp-3);
  align-items: center;
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.course.on {
  border-color: var(--c-primary);
}
.ico {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  background: var(--c-success-soft);
  color: var(--c-success);
}
.course.on .ico {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.main {
  display: grid;
  min-width: 0;
}
.course .bar,
.course .count {
  grid-column: 1 / -1;
}
.count {
  justify-self: end;
  font-size: var(--fs-sm);
}
.bar {
  width: 100%;
}
.detail {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
.head {
  display: grid;
  gap: var(--sp-3);
}
.top p {
  margin: 2px 0 0;
}
.prog {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-4);
}
.prog-bar {
  display: grid;
  flex: 1;
  gap: var(--sp-1);
  min-width: 160px;
}
.unit {
  padding: var(--sp-3) var(--sp-4);
}
.unit-head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.unit-title {
  display: grid;
  flex: 1;
  min-width: 0;
}
.steps {
  display: grid;
  gap: var(--sp-1);
  margin: var(--sp-2) 0 0;
  padding: 0;
  list-style: none;
}
.step {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  min-height: 36px;
  padding: var(--sp-1) var(--sp-2);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.step:hover {
  background: var(--c-surface-2);
}
.step.next {
  background: var(--c-primary-soft);
  font-weight: 700;
}
.step .state {
  display: inline-flex;
  color: var(--c-line);
}
.step.done .state {
  color: var(--c-success);
}
.step.next .state {
  color: var(--c-primary);
}
.step .kind {
  display: inline-flex;
  color: var(--c-ink-soft);
}
.step .title {
  flex: 1;
  min-width: 0;
}
.step.done .title {
  color: var(--c-ink-soft);
}
.best {
  min-width: 40px;
  color: var(--c-success);
  font-size: var(--fs-sm);
  text-align: right;
}
</style>
