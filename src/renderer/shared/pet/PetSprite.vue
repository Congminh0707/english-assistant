<script setup lang="ts">
import { computed } from 'vue'
import { ACCESSORIES, isAccessoryId, type AccessorySlot } from '@shared/shop'
import ItemEmoji from '../components/ItemEmoji.vue'
import PetFigure from './PetFigure.vue'

// Thú cưng chibi vector (thiết kế v2 "Làng chữ", docs/23 §2), có thể đeo phụ kiện, đứng yên hoặc đi bộ.
// `size` là cạnh vùng hiển thị. Hình vẽ ở PetFigure; phụ kiện hiện là biểu tượng đặt theo vị trí đeo (chưa có hình riêng
// cho từng con).
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

// Vị trí biểu tượng theo vị trí đeo: [trái %, trên %, tỉ lệ cỡ, lớp sau lưng]
const SLOT_POS: Record<AccessorySlot, [number, number, number, boolean]> = {
  head: [50, 0, 0.34, false],
  face: [50, 38, 0.3, false],
  neck: [50, 62, 0.26, false],
  back: [14, 40, 0.34, true]
}
const worn = computed(() =>
  props.accessories.flatMap((id) => {
    if (!isAccessoryId(id)) return []
    const def = ACCESSORIES[id]
    const [x, y, k, back] = SLOT_POS[def.slot]
    return [
      {
        id,
        emoji: def.emoji,
        back,
        style: {
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translateX(-50%)',
          zIndex: back ? '0' : '2'
        },
        px: Math.round(props.size * k)
      }
    ]
  })
)
</script>

<template>
  <div
    class="pet-sprite"
    :class="{ silhouette, flip }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    aria-hidden="true"
  >
    <PetFigure class="fig" :character="character" :stage="stage" :pose="state" :animate="live" />
    <span v-for="w in worn" :key="w.id" class="acc" :style="w.style">
      <ItemEmoji :id="w.id" :emoji="w.emoji" :size="w.px" />
    </span>
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
.acc {
  position: absolute;
  pointer-events: none;
}
.flip {
  transform: scaleX(-1);
}
.silhouette {
  filter: brightness(0) opacity(0.35);
}
</style>
