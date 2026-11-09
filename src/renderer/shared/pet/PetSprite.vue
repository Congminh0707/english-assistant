<script setup lang="ts">
import { computed } from 'vue'
import { isAccessoryId } from '@shared/shop'
import PetFigure from './PetFigure.vue'

// Thú cưng chibi vector (mascot v3, docs/05), có thể đeo phụ kiện, đứng yên hoặc đi bộ.
// `size` là cạnh vùng hiển thị. Hình vẽ và phụ kiện (vẽ riêng theo từng con) đều ở PetFigure.
const props = withDefaults(
  defineProps<{
    character: string
    stage: string
    accessories?: string[]
    /** Kích thước hiển thị (px) */
    size?: number
    /** Chạy hoạt ảnh của trạng thái */
    animate?: boolean
    /** Đang di chuyển: dáng đi bộ thay cho đứng */
    walking?: boolean
    /** Quay sang trái */
    flip?: boolean
    /** Bóng đen (giai đoạn chưa mở khoá) */
    silhouette?: boolean
    /** Trạng thái khác (idle, walk, run, jump, sit, sleep, eat, drink, read, listen, say, hello, happy, sad, surprised, levelup, car, boat, plane) */
    pose?: string
  }>(),
  {
    accessories: () => [],
    size: 144,
    animate: false,
    walking: false,
    flip: false,
    silhouette: false,
    pose: ''
  }
)

const state = computed(() => props.pose || (props.walking ? 'walk' : 'idle'))
const live = computed(() => props.animate || props.walking || !!props.pose)

const worn = computed(() => props.accessories.filter(isAccessoryId))
</script>

<template>
  <div
    class="pet-sprite"
    :class="{ silhouette, flip }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    aria-hidden="true"
  >
    <PetFigure
      class="fig"
      :character="character"
      :stage="stage"
      :pose="state"
      :animate="live"
      :accessories="worn"
    />
  </div>
</template>

<style scoped>
.pet-sprite {
  position: relative;
  flex: none;
  /* Vẽ lại một sprite không kéo theo cả trang */
  contain: layout style;
}
.fig {
  position: relative;
  z-index: 1;
}
.flip {
  transform: scaleX(-1);
}
.silhouette {
  filter: brightness(0) opacity(0.35);
}
</style>
