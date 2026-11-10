<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from 'lucide-vue-next'
import ArtScene from '@renderer/shared/components/ArtScene.vue'
import { PLACE_PAGES, PLACE_SCENE, SHELL_FOCUS, type Place, type StudyPage } from '../places'

// Khung màn trong v2: cảnh địa điểm bên trái, nội dung trên nền giấy bên phải (docs/23 §1).
const props = defineProps<{ place: Place; page: StudyPage; dark: boolean; parentTab: boolean }>()
const emit = defineEmits<{ home: []; go: [page: StudyPage] }>()
const { t } = useI18n()
/** Đang học một bài: ẩn tab, chỉ còn nút quay lại */
const focus = ref(false)
provide(SHELL_FOCUS, focus)

const scene = computed(() => `place-${PLACE_SCENE[props.place]}${props.dark ? '-dark' : ''}`)
// parentTab = hồ sơ đang dùng là trẻ em (phụ huynh đang xem): có tab Phụ huynh, không có Nhật ký (chỉ người lớn)
const tabs = computed(() =>
  PLACE_PAGES[props.place].filter((p) =>
    p === 'parent' ? props.parentTab : p !== 'diary' || !props.parentTab
  )
)

function onKey(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || e.defaultPrevented) return
  if (document.querySelector('[role="dialog"]')) return
  emit('home')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="shell">
    <aside class="scene">
      <ArtScene class="art" :name="scene" fill />
      <div class="head">
        <button type="button" class="back" data-nav="village" @click="emit('home')">
          <ArrowLeft :size="15" :stroke-width="2.4" />{{ t('study.place.back') }} <kbd>Esc</kbd>
        </button>
        <span class="name">{{ t(`study.place.${place}`) }}</span>
      </div>
    </aside>
    <main class="paper">
      <nav v-if="tabs.length > 1 && !focus" class="tabs">
        <button
          v-for="p in tabs"
          :key="p"
          type="button"
          class="tab"
          :class="{ on: p === page }"
          :data-nav="p"
          @click="emit('go', p)"
        >
          {{ t(`study.nav.${p}`) }}
        </button>
      </nav>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
}
.scene {
  position: relative;
  flex: none;
  width: 216px;
  overflow: hidden;
}
.art {
  position: absolute;
  inset: 0;
}
.head {
  position: absolute;
  top: var(--sp-3);
  left: var(--sp-3);
  display: grid;
  gap: var(--sp-2);
  justify-items: start;
}
.back {
  display: inline-flex;
  white-space: nowrap;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 var(--sp-3);
  border: 2px solid var(--c-ink);
  border-radius: var(--r-pill);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 700;
  box-shadow: 0 2px 0 var(--c-ink);
  cursor: pointer;
}
.back kbd {
  color: var(--c-ink-soft);
  font: 500 var(--fs-xs) var(--font-ui);
}
.name {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 var(--sp-3);
  border: 2px solid var(--c-surface);
  border-radius: var(--r-pill);
  background: var(--c-primary);
  box-shadow: 0 2px 0 var(--c-ink);
  color: var(--c-on-primary);
  font-size: var(--fs-sm);
  font-weight: 800;
}
.paper {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--sp-5);
  background: var(--c-bg);
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  width: fit-content;
  max-width: 100%;
  gap: var(--sp-1);
  margin-bottom: var(--sp-4);
  padding: var(--sp-1);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.tab {
  min-height: 28px;
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
/* Cửa sổ hẹp: nhường chỗ cho nội dung */
@media (max-width: 820px) {
  .scene {
    width: 128px;
  }
  .back kbd {
    display: none;
  }
}
</style>
