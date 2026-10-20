<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsActivity, KidsUnits } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'

// Danh sách hoạt động ABC: chữ cái, âm, ghép âm, từ nhìn là nhớ. Mỗi ô có hình, tên đọc to và số sao đã đạt.
const emit = defineEmits<{ open: [activity: KidsActivity] }>()

const { t } = useI18n()
const { speak } = useTts()

const data = ref<KidsUnits | null>(null)

const stars = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n)

function open(activity: KidsActivity): void {
  speak(activity.title, 'us', 0.85)
  emit('open', activity)
}

onMounted(async () => {
  data.value = await invoke('kids:units')
})
</script>

<template>
  <section class="k-screen">
    <h1 class="k-title">ABC</h1>
    <div v-for="unit in data?.units ?? []" :key="unit.id" class="unit">
      <h2 class="unit-head">
        <PixelPicture :id="unit.picture" :size="56" />
        <span>{{ unit.title }}</span>
        <span class="vi">{{ unit.vi }}</span>
      </h2>
      <div class="k-row">
        <button
          v-for="a in unit.activities"
          :key="a.id"
          type="button"
          class="k-big act"
          @click="open(a)"
        >
          <PixelPicture :id="a.picture ?? unit.picture" :size="96" />
          <span class="name">{{ a.title }}</span>
          <span class="k-stars" :aria-label="t('kids.units.stars', { n: a.stars })">{{
            stars(a.stars)
          }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.unit {
  display: grid;
  gap: 12px;
  width: 100%;
}
.unit-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 26px;
}
.vi {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-ink-soft);
}
.act {
  min-width: 170px;
}
.name {
  font-size: 18px;
}
.k-stars {
  color: #e0a620;
}
</style>
