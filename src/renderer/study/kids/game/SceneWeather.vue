<script setup lang="ts">
import { computed } from 'vue'
import type { Weather } from './sceneWeather'

// Lớp thời tiết phủ lên tranh cảnh địa điểm (docs/23-design-v2-spec.md §7): mưa, nắng, đêm. Chỉ là lớp CSS
// trong suốt nằm dưới biển chạm và thú cưng, không đổi tranh gốc, không bắt chuột.
const props = defineProps<{ placeId: string; weather: Weather }>()

const DROPS = 36
const STARS = 24

/** Số giả ngẫu nhiên cố định theo (nơi, chỉ số) để mỗi lần vào vẫn ra cùng một cảnh */
function rnd(i: number, salt: number): number {
  let h = 2166136261
  const s = `${props.placeId}:${i}:${salt}`
  for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

const drops = computed(() =>
  props.weather === 'rain'
    ? Array.from({ length: DROPS }, (_, i) => ({
        left: `${rnd(i, 1) * 100}%`,
        delay: `${-rnd(i, 2) * 1.2}s`,
        dur: `${0.7 + rnd(i, 3) * 0.5}s`
      }))
    : []
)
const stars = computed(() =>
  props.weather === 'night'
    ? Array.from({ length: STARS }, (_, i) => ({
        left: `${rnd(i, 4) * 100}%`,
        top: `${rnd(i, 5) * 45}%`,
        delay: `${-rnd(i, 6) * 3}s`
      }))
    : []
)
</script>

<template>
  <div v-if="weather !== 'clear'" class="weather" :class="weather" aria-hidden="true">
    <span
      v-for="(d, i) in drops"
      :key="`d${i}`"
      class="drop"
      :style="{ left: d.left, animationDelay: d.delay, animationDuration: d.dur }"
    />
    <span
      v-for="(s, i) in stars"
      :key="`s${i}`"
      class="star"
      :style="{ left: s.left, top: s.top, animationDelay: s.delay }"
    />
    <span v-if="weather === 'sun'" class="ray" />
  </div>
</template>

<style scoped>
.weather {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}
.rain {
  background: rgb(52 78 110 / 22%);
}
.drop {
  position: absolute;
  top: -8%;
  width: 3px;
  height: 34px;
  border-radius: 2px;
  background: rgb(220 238 255 / 75%);
  transform: rotate(12deg);
  animation: fall linear infinite;
}
.sun {
  background: linear-gradient(160deg, rgb(255 236 150 / 30%), rgb(255 236 150 / 0%) 55%);
}
.ray {
  position: absolute;
  top: -120px;
  right: -120px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 244 190 / 85%), rgb(255 244 190 / 0%) 68%);
  animation: glow 4s ease-in-out infinite;
}
.night {
  background: linear-gradient(180deg, rgb(18 28 70 / 58%), rgb(40 44 96 / 40%));
}
.star {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(255 250 210);
  animation: twinkle 3s ease-in-out infinite;
}
@keyframes fall {
  to {
    transform: translate(-90px, 120vh) rotate(12deg);
  }
}
@keyframes glow {
  50% {
    opacity: 0.65;
  }
}
@keyframes twinkle {
  50% {
    opacity: 0.25;
  }
}
@media (prefers-reduced-motion: reduce) {
  .drop,
  .ray,
  .star {
    animation: none;
  }
  .drop {
    display: none;
  }
}
</style>
