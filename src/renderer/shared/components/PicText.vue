<script setup lang="ts">
import { computed } from 'vue'
import { pictureFor, splitLeadingPicture } from '@shared/pictures'
import PixelPicture from './PixelPicture.vue'

// Hiển thị một chuỗi nội dung bài học: nếu là emoji có hình pixel (hoặc "emoji + chữ") thì vẽ hình pixel,
// ngược lại hiện chữ nguyên văn. Nhờ vậy nội dung cũ dùng emoji vẫn có hình rõ ràng, nhất quán giữa các máy.
const props = withDefaults(defineProps<{ text: string; size?: number; withLabel?: boolean }>(), {
  size: 64,
  withLabel: true
})

const parsed = computed(() => {
  const whole = pictureFor(props.text)
  if (whole) return { picture: whole, rest: '' }
  return splitLeadingPicture(props.text)
})
</script>

<template>
  <span v-if="parsed.picture" class="pic-text">
    <PixelPicture :id="parsed.picture" :size="size" />
    <span v-if="withLabel && parsed.rest" class="label">{{ parsed.rest }}</span>
  </span>
  <span v-else>{{ text }}</span>
</template>

<style scoped>
.pic-text {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.label {
  font-size: 0.85em;
}
</style>
