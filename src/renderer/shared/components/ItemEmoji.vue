<script setup lang="ts">
import { computed } from 'vue'

// Biểu tượng vật phẩm (đồ ăn, phụ kiện, nhân vật): SVG Twemoji (CC-BY 4.0) đóng gói sẵn trong assets/items
// (scripts/images/twemoji-items.mjs) để giống nhau trên mọi máy; thiếu ảnh thì hiện chính emoji.
const props = withDefaults(defineProps<{ emoji: string; size?: number }>(), { size: 48 })

const svgs = import.meta.glob('../assets/items/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const code = computed(() =>
  [...props.emoji]
    .map((c) => c.codePointAt(0) as number)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join('-')
)
const src = computed(() => svgs[`../assets/items/${code.value}.svg`])
</script>

<template>
  <img
    v-if="src"
    class="item-emoji"
    :src="src"
    :width="size"
    :height="size"
    alt=""
    aria-hidden="true"
    draggable="false"
  />
  <span v-else class="item-emoji-text" :style="{ fontSize: `${size * 0.85}px` }" aria-hidden="true">
    {{ emoji }}
  </span>
</template>

<style scoped>
.item-emoji {
  display: block;
  object-fit: contain;
}
.item-emoji-text {
  line-height: 1.1;
}
</style>
