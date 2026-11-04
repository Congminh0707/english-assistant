<script setup lang="ts">
import { computed } from 'vue'
import { bgUrl, type GameKey } from './gameArt'
import { useStageScale } from './useStageScale'

// Sân khấu toàn màn hình của một mini-game: tranh nền ChatGPT (docs/27) phủ kín cửa sổ, nằm dưới thanh Home/sao/khoá
// của KidsApp. `--s` là hệ số cỡ theo cửa sổ (useStageScale); nội dung game nằm trong slot.
const props = defineProps<{ game: GameKey }>()
const { scale } = useStageScale()

const style = computed(() => ({
  backgroundImage: `url("${bgUrl(props.game)}")`,
  '--s': String(scale.value)
}))
</script>

<template>
  <div class="stage" :style="style">
    <slot />
  </div>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  overflow: hidden;
  padding-top: 88px;
  background-color: var(--c-surface-2);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}
</style>
