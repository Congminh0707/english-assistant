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
import { PLACE_ART_PHOTO } from './placeArtPhoto'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import PlaceProgress from './PlaceProgress.vue'
import SceneWeather from './SceneWeather.vue'
import SceneAnim from './SceneAnim.vue'
import type { Weather } from './sceneWeather'
import { playSfx } from './sfx'

// Cảnh trong một địa điểm (docs/23-design-v2-spec.md §3): tranh 1280×720 phủ sân khấu, 5 biển chạm là nút HTML đặt theo
// toạ độ trên bảng thiết kế. Biển đầu tiên chưa xong có màu đỏ để bé biết chạm vào đâu; biển đã xong có chấm xanh.
const props = defineProps<{
  place: KidsWorldView['tiers'][number]['places'][number]
  width: number
  height: number
  /** Chọn ở KidsGame khi vào nơi này từ bản đồ; không đổi trong lúc ở cảnh */
  weather: Weather
}>()
const emit = defineEmits<{ learn: [step: number]; about: [] }>()

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
const art = computed(() => PLACE_ART_PHOTO[props.place.id] ?? PLACE_ART[props.place.id])
const weather = computed(() => props.weather)
const petAt = computed(() => PET_SPOT[props.place.id] ?? art.value?.pet ?? { x: 0, y: 0 })
// Tranh phủ khung kiểu `xMidYMid slice` (giữ tỉ lệ, cắt mép) nên biển/thú cưng cũng đổi toạ độ y như vậy,
// không co giãn x, y riêng (khung khác 16:9 thì chấm lệch khỏi công trình)
const scale = computed(() => Math.max(props.width / 1280, props.height / 720))
const ox = computed(() => (props.width - 1280 * scale.value) / 2)
const oy = computed(() => (props.height - 720 * scale.value) / 2)
const toX = (x: number): number => ox.value + x * scale.value
const toY = (y: number): number => oy.value + y * scale.value
/** Số biển đã xong theo tỉ lệ từ đã học của nơi này */
const doneSpots = computed(() => {
  const words = props.place.words
  return Math.floor((words.filter((w) => w.done).length / Math.max(1, words.length)) * SPOTS)
})
const busy = ref(false)
const showProgress = ref(false)
const learned = computed(() => props.place.words.filter((w) => w.done).length)

/** Đổi toạ độ tranh sang sân khấu, giữ biển trong khung và tránh hàng nút trên cùng */
const SIDE = 120
const TOP_BAR = 138
function spotStyle(s: { x: number; y: number }): { left: string; top: string } {
  const x = Math.min(props.width - SIDE, Math.max(SIDE, toX(s.x)))
  let y = Math.min(props.height - 56, Math.max(36, toY(s.y)))
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
    <SceneAnim v-if="art" :place-id="place.id" :width="width" :height="height" :weather="weather" />
    <SceneWeather v-if="art" :place-id="place.id" :weather="weather" />
    <div
      v-if="art && petStore.pet"
      class="pet"
      :style="{ left: `${toX(petAt.x)}px`, top: `${toY(petAt.y)}px` }"
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
    <div class="dock">
      <div v-if="showProgress" class="panel">
        <PlaceProgress :place="place" />
      </div>
      <div class="dock-row">
        <button v-if="place.about" type="button" class="dock-btn" @click="emit('about')">
          <UiIcon name="hint" :size="28" />{{ t('kids.game.about.title') }}
        </button>
        <button
          type="button"
          class="dock-btn"
          :aria-expanded="showProgress"
          @click="showProgress = !showProgress"
        >
          <span class="stars">
            <UiIcon
              v-for="n in 3"
              :key="n"
              name="star"
              :size="20"
              :class="{ lit: n <= place.stars }"
            />
          </span>
          {{ learned }}/{{ place.words.length }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.place-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--g-cream);
}
.art {
  position: absolute;
  inset: 0;
}
.dock {
  position: absolute;
  bottom: 44px;
  left: 24px;
  z-index: 4;
  display: grid;
  gap: 10px;
  justify-items: start;
}
.dock-row {
  display: flex;
  gap: 10px;
}
.panel {
  zoom: var(--hz, 1);
  width: 440px;
  padding: 16px 20px;
  border: 4px solid var(--g-coin);
  border-radius: 26px;
  background: var(--g-paper);
}
.dock-btn {
  zoom: var(--hz, 1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 58px;
  padding: 0 22px;
  border: 3px solid var(--g-coin);
  border-radius: 29px;
  background: var(--g-paper);
  color: var(--g-brown);
  font-family: var(--font-kids);
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
}
.stars {
  display: inline-flex;
  color: var(--g-sand);
}
.stars .lit {
  color: var(--g-coin);
  fill: currentcolor;
}
.dock-btn:focus-visible {
  outline: 4px solid var(--g-teal);
  outline-offset: 3px;
}
.pet {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -100%);
}
.spot {
  --edge: var(--g-gold);
  --fill: var(--g-paper);
  --ink: var(--g-brown);
  --dot: var(--g-green);
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
  --edge: var(--g-coin);
  --fill: var(--g-red);
  --ink: #fff;
  --dot: var(--g-red);
}
.spot:nth-of-type(2n) {
  animation-delay: -1.1s;
}
.spot:focus-visible {
  outline: 4px solid var(--g-teal);
  outline-offset: 4px;
  border-radius: 12px;
}
.face {
  position: relative;
  zoom: var(--hz, 1);
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
  border: 3px solid var(--g-paper);
  border-radius: 50%;
  background: var(--dot);
}
.spot:not(.done, .next) .dot {
  background: var(--g-gold);
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
