<script setup lang="ts">
import { computed } from 'vue'
import { pictureFor, splitLeadingPicture } from '@shared/pictures'
import PixelPicture from './PixelPicture.vue'

// Hiển thị một chuỗi nội dung bài học: nếu là emoji có hình pixel (hoặc "emoji + chữ") thì vẽ hình pixel,
// ngược lại hiện chữ nguyên văn. Nhờ vậy nội dung cũ dùng emoji vẫn có hình rõ ràng, nhất quán giữa các máy.
// Chữ ASCII thường ("pig", "hat") là từ cần học nên luôn giữ nguyên chữ; chỉ khi `ids` (bài chọn hình) mới coi là id hình.
const props = withDefaults(
  defineProps<{ text: string; size?: number; withLabel?: boolean; ids?: boolean }>(),
  { size: 64, withLabel: true, ids: false }
)

const parsed = computed(() => {
  const isPlainWord = /^[\x20-\x7e]+$/.test(props.text)
  if (isPlainWord && !props.ids) return { picture: undefined, rest: props.text }
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
