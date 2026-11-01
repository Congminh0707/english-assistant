<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeCharacterId } from '@shared/characters'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import ArtScene from '@renderer/shared/components/ArtScene.vue'
import { useTts } from '@renderer/shared/composables/useTts'
import { usePetStore } from '@renderer/shared/stores/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import { PLACE_ART } from './placeArt.generated'
import { playSfx } from './sfx'

// Cảnh trong một địa điểm (docs/23-design-v2-spec.md §3): tranh 1280×720 phủ sân khấu, 5 biển chạm là nút HTML đặt theo
// toạ độ trên bảng thiết kế. Biển đầu tiên chưa xong có màu đỏ để bé biết chạm vào đâu; biển đã xong có chấm xanh.
const props = defineProps<{
  place: KidsWorldView['tiers'][number]['places'][number]
  width: number
  height: number
}>()
const emit = defineEmits<{ learn: [step: number] }>()

const { t } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()

const SPOTS = 5
/** Thú cưng trong cảnh, đơn vị sân khấu 1600×900 */
const PET_SIZE = 90
/** Chỗ đứng chỉnh tay khi bảng đặt thú cưng lên bậc thang (toạ độ tranh) */
const PET_SPOT: Readonly<Record<string, { x: number; y: number }>> = {
  hoian: { x: 1130, y: 462 }
}
const art = computed(() => PLACE_ART[props.place.id])
const petAt = computed(() => PET_SPOT[props.place.id] ?? art.value?.pet ?? { x: 0, y: 0 })
const sx = computed(() => props.width / 1280)
const sy = computed(() => props.height / 720)
/** Số biển đã xong theo tỉ lệ từ đã học của nơi này */
const doneSpots = computed(() => {
  const words = props.place.words
  return Math.floor((words.filter((w) => w.done).length / Math.max(1, words.length)) * SPOTS)
})
const busy = ref(false)

/** Đổi toạ độ tranh sang sân khấu, giữ biển trong khung và tránh hàng nút trên cùng */
const SIDE = 120
const TOP_BAR = 138
function spotStyle(s: { x: number; y: number }): { left: string; top: string } {
  const x = Math.min(props.width - SIDE, Math.max(SIDE, s.x * sx.value))
  let y = Math.min(props.height - 56, Math.max(36, s.y * sy.value))
  if (y < TOP_BAR && (x < 480 || x > props.width - 200)) y = TOP_BAR
  return { left: `${x}px`, top: `${y}px` }
}

const key = (i: number): string => `kids.game.spots.${props.place.id}[${i}]`

function tap(i: number): void {
  if (busy.value) return
  busy.value = true
  playSfx('tap')
  speak(t(key(i), {}, { locale: 'en' }), 'us', 0.85)
  window.setTimeout(() => emit('learn', i), 500)
}
</script>

<template>
  <div class="place-scene">
    <ArtScene v-if="art" class="art" :name="art.art" />
    <div
      v-if="art && petStore.pet"
      class="pet"
      :style="{ left: `${petAt.x * sx}px`, top: `${petAt.y * sy}px` }"
    >
      <PetSprite
        :character="normalizeCharacterId(petStore.pet.characterId)"
        :stage="petStore.pet.stage"
        :accessories="petStore.pet.equipped"
        :size="PET_SIZE"
        animate
      />
    </div>
    <template v-if="art">
      <button
        v-for="(s, i) in art.spots"
        :key="i"
        type="button"
        class="spot"
        :class="{ done: i < doneSpots, next: i === doneSpots }"
        :style="spotStyle(s)"
        @click="tap(i)"
      >
        <span class="face">{{ t(key(i)) }}</span>
        <span class="dot" />
      </button>
    </template>
  </div>
</template>

<style scoped>
.place-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #fbefd8;
}
.art {
  position: absolute;
  inset: 0;
}
.pet {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -100%);
}
.spot {
  --edge: #d9a24a;
  --fill: #fff9ea;
  --ink: #6b3e1e;
  --dot: #0b7a52;
  position: absolute;
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  font-family: var(--font-kids);
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  transform: translate(-50%, -50%);
  animation: spot-bob 3s ease-in-out infinite;
}
.spot.next {
  --edge: #f7b91a;
  --fill: #d32f2f;
  --ink: #fff;
  --dot: #d32f2f;
}
.spot:nth-of-type(2n) {
  animation-delay: -1.1s;
}
.spot:focus-visible {
  outline: 4px solid #16bfc8;
  outline-offset: 4px;
  border-radius: 12px;
}
.face {
  position: relative;
  padding: 7px 30px;
  line-height: 1.2;
  white-space: nowrap;
  isolation: isolate;
}
.face::before,
.face::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  clip-path: polygon(
    16px 0,
    calc(100% - 16px) 0,
    100% 50%,
    calc(100% - 16px) 100%,
    16px 100%,
    0 50%
  );
  background: var(--edge);
}
.face::after {
  inset: 3px;
  clip-path: polygon(
    15px 0,
    calc(100% - 15px) 0,
    100% 50%,
    calc(100% - 15px) 100%,
    15px 100%,
    0 50%
  );
  background: var(--fill);
}
.dot {
  width: 16px;
  height: 16px;
  border: 3px solid #fff9ea;
  border-radius: 50%;
  background: var(--dot);
}
.spot:not(.done, .next) .dot {
  background: #d9a24a;
}
@keyframes spot-bob {
  50% {
    transform: translate(-50%, calc(-50% - 5px));
  }
}
@media (prefers-reduced-motion: reduce) {
  .spot {
    animation: none;
  }
}
</style>
