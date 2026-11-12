<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { confirmLeave, isLeaveGuarded } from '../leaveGuard'
import { SHELL_FOCUS, type ListeningView } from '../places'
import LessonsPage from './LessonsPage.vue'
import VideoLibrary from './VideoLibrary.vue'

// Trang Nghe (docs/07 §6, §10): hai khung "Bài nghe" (danh sách bài) và "Video" (thư viện video có câu hỏi).
// Video từng là trang riêng, đã gộp vào đây (docs/decisions.md #65). Đang học một bài / đang xem video thì ẩn nút đổi khung.
const props = withDefaults(defineProps<{ startId?: string; view?: ListeningView }>(), {
  startId: undefined,
  view: 'lessons'
})
const emit = defineEmits<{ changed: []; 'update:view': [view: ListeningView] }>()

const { t } = useI18n()
const VIEWS: ListeningView[] = ['lessons', 'video']

const current = ref<ListeningView>(props.startId ? 'lessons' : props.view)
/** LessonsPage báo đang đọc/làm bài qua SHELL_FOCUS; VideoLibrary báo đang xem/kết quả */
const shellFocus = inject(SHELL_FOCUS, null)
const videoPhase = ref<'list' | 'watch' | 'result'>('list')
// Đổi khung từ ngoài (bấm lại tab Nghe, lối cũ 'videos'): VideoLibrary bị gỡ mà không báo → về 'list'
watch(
  () => props.view,
  (v) => {
    current.value = v
    videoPhase.value = 'list'
  }
)
const showSwitch = computed(() =>
  current.value === 'lessons' ? !shellFocus?.value : videoPhase.value === 'list'
)

async function pick(v: ListeningView): Promise<void> {
  if (v === current.value) return
  if (isLeaveGuarded() && !(await confirmLeave())) return
  videoPhase.value = 'list'
  current.value = v
  emit('update:view', v)
}
</script>

<template>
  <section class="listening">
    <nav v-if="showSwitch" class="tabs" role="tablist" :aria-label="t('study.listening.views')">
      <button
        v-for="v in VIEWS"
        :key="v"
        type="button"
        role="tab"
        class="tab"
        :class="{ on: current === v }"
        :aria-selected="current === v"
        @click="pick(v)"
      >
        {{ t(`study.listening.view.${v}`) }}
      </button>
    </nav>

    <LessonsPage
      v-if="current === 'lessons'"
      kind="listening"
      :start-id="startId"
      @changed="emit('changed')"
    />
    <template v-else>
      <h1 class="page-title">{{ t('study.videos.title') }}</h1>
      <VideoLibrary @phase="videoPhase = $event" />
    </template>
  </section>
</template>

<style scoped>
.listening {
  display: grid;
  gap: var(--sp-3);
  max-width: 980px;
}
.page-title {
  margin: 0;
}
.tabs {
  display: inline-flex;
  justify-self: start;
  gap: var(--sp-1);
  padding: var(--sp-1);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.tab {
  min-height: var(--btn-h-sm);
  padding: 0 var(--sp-3);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.tab.on {
  background: var(--c-surface);
  color: var(--c-ink);
  box-shadow: var(--shadow-sm);
}
</style>
