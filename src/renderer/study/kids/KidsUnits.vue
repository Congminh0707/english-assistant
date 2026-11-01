<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsActivity, KidsUnits } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import PictureImage from '@renderer/shared/components/PictureImage.vue'

// Danh sách hoạt động ABC: chữ cái, âm, ghép âm, từ nhìn là nhớ. Mỗi ô có hình, tên đọc to và số sao đã đạt.
const emit = defineEmits<{ open: [activity: KidsActivity] }>()

const { t } = useI18n()
const { speak } = useTts()

const data = ref<KidsUnits | null>(null)
const current = ref(0)
const unit = computed(() => data.value?.units[current.value] ?? null)

function pickUnit(i: number): void {
  current.value = i
  const u = data.value?.units[i]
  if (u) speak(u.title, 'us', 0.85)
}

function open(activity: KidsActivity): void {
  speak(activity.title, 'us', 0.85)
  emit('open', activity)
}

onMounted(async () => {
  data.value = await invoke('kids:units')
})
</script>

<template>
  <section class="k-screen wide">
    <h1 class="k-title">ABC</h1>
    <p v-if="!data" class="k-sub">{{ t('kids.loading') }}</p>
    <div v-else class="tabs">
      <button
        v-for="(u, i) in data.units"
        :key="u.id"
        type="button"
        class="k-big tab"
        :class="{ soft: i === current }"
        @click="pickUnit(i)"
      >
        <PictureImage :id="u.picture" :size="48" />
        <span class="tab-name">{{ u.title }}</span>
        <span class="vi">{{ u.vi }}</span>
      </button>
    </div>
    <div v-if="unit" class="k-row cards">
      <button
        v-for="a in unit.activities"
        :key="a.id"
        type="button"
        class="k-big act"
        @click="open(a)"
      >
        <PictureImage :id="a.picture ?? unit.picture" :size="96" />
        <span class="name">{{ a.title }}</span>
        <span class="k-stars" role="img" :aria-label="t('kids.units.stars', { n: a.stars })">
          <UiIcon
            v-for="n in 3"
            :key="n"
            name="star"
            :size="28"
            :class="n <= a.stars ? 'on' : 'off'"
          />
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.wide {
  max-width: 1080px;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-4);
}
.tab {
  min-width: 120px;
  padding: var(--sp-2) var(--sp-3);
  box-shadow: 0 4px 0 var(--c-ink);
}
.tab-name {
  font-size: 18px;
}
.vi {
  font-family: var(--font-ui);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--c-ink-soft);
}
.cards {
  gap: var(--sp-4);
  padding-top: var(--sp-2);
}
.act {
  min-width: 180px;
  gap: var(--sp-3);
  padding: var(--sp-5) var(--sp-4);
}
.name {
  font-size: 22px;
}
.k-stars .on {
  fill: currentcolor;
}
</style>
