<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LandmarkPicture from '../LandmarkPicture.vue'
import { mountLandmark3D } from './landmark3d'

// Công trình voxel xoay được bằng three.js (docs/19-kids-world.md §5.2): dựng thẳng từ lưới voxel (greedy mesh),
// kéo để xoay, tự xoay chậm khi không chạm. three.js nạp lười (chunk riêng) chỉ khi mở thẻ nơi; không có WebGL
// hoặc lỗi → hiện hình 2D như cũ. Dừng vòng vẽ khi cửa sổ ẩn/rời đi và giải phóng GPU.
const props = withDefaults(defineProps<{ id: string; width?: number; height?: number }>(), {
  width: 560,
  height: 250
})

const { t } = useI18n()
const host = ref<HTMLDivElement | null>(null)
const failed = ref(false)
let dispose: (() => void) | null = null
let gone = false

const reduceMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(async () => {
  try {
    if (!host.value) return
    const stop = await mountLandmark3D(host.value, props.id, props.width, props.height, !reduceMotion())
    if (gone) stop()
    else dispose = stop
  } catch {
    failed.value = true
  }
})

onBeforeUnmount(() => {
  gone = true
  dispose?.()
})
</script>

<template>
  <div class="viewer" :style="{ width: `${width}px`, height: `${height}px` }">
    <div v-show="!failed" ref="host" class="gl" role="img" :aria-label="t('kids.game.landmark3d')" />
    <LandmarkPicture v-if="failed" :id="id" :width="Math.min(width, 300)" />
  </div>
</template>

<style scoped>
.viewer {
  display: grid;
  place-items: center;
  cursor: grab;
}
.viewer:active {
  cursor: grabbing;
}
.gl {
  width: 100%;
  height: 100%;
}
</style>
