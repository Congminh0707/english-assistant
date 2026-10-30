<script setup lang="ts">
// Xe chở thú cưng trên bản đồ (docs/19-kids-world.md §5.4): ô tô trên đất liền, thuyền trên biển, máy bay khi đi xa.
// Vẽ hai lớp kẹp thú cưng ở giữa — `back` (sau lưng: tựa ghế, buồm, đuôi) và `front` (thân xe che nửa dưới) — để
// trông như thú cưng ngồi trong xe. Gốc toạ độ: điểm chạm đất/mặt nước, hình quay mặt sang phải.
export type VehicleKind = 'car' | 'boat' | 'plane'

defineProps<{ kind: VehicleKind; layer: 'back' | 'front' }>()
</script>

<template>
  <!-- Ô tô mui trần -->
  <svg
    v-if="kind === 'car'"
    class="veh car"
    :class="layer"
    width="180"
    height="80"
    viewBox="0 0 180 80"
    aria-hidden="true"
  >
    <template v-if="layer === 'back'">
      <rect
        x="24"
        y="6"
        width="34"
        height="34"
        rx="10"
        fill="#c23b3b"
        stroke="#3b2a3a"
        stroke-width="4"
      />
      <path d="M116 34 L128 6 L138 8 L128 34 Z" fill="#bfe6ff" stroke="#3b2a3a" stroke-width="4" />
    </template>
    <template v-else>
      <path
        d="M8 40 Q8 32 18 32 L150 32 Q168 34 172 48 L172 58 Q172 64 166 64 L14 64 Q8 64 8 58 Z"
        fill="#ff5a5a"
        stroke="#3b2a3a"
        stroke-width="4"
      />
      <rect x="16" y="44" width="148" height="5" rx="2" fill="#ffffff" opacity="0.75" />
      <circle cx="164" cy="42" r="5" fill="#ffe07a" stroke="#3b2a3a" stroke-width="2" />
      <rect x="9" y="37" width="6" height="8" rx="2" fill="#ffd34d" />
      <g
        v-for="cx in [44, 136]"
        :key="cx"
        class="wheel"
        :style="{ transformOrigin: `${cx}px 64px` }"
      >
        <circle :cx="cx" cy="64" r="14" fill="#3b2a3a" />
        <circle :cx="cx" cy="64" r="6" fill="#d9d9d9" />
        <rect :x="cx - 1.5" y="52" width="3" height="24" fill="#d9d9d9" />
      </g>
    </template>
  </svg>

  <!-- Thuyền buồm -->
  <svg
    v-else-if="kind === 'boat'"
    class="veh boat"
    :class="layer"
    width="200"
    height="100"
    viewBox="0 0 200 100"
    aria-hidden="true"
  >
    <template v-if="layer === 'back'">
      <rect x="56" y="0" width="6" height="66" fill="#6b4a32" stroke="#3b2a3a" stroke-width="2" />
      <path
        d="M54 6 L54 58 L14 56 Z"
        fill="#ffffff"
        stroke="#3b2a3a"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path d="M54 30 L54 40 L32 39 Z" fill="#ff5a5a" />
      <path d="M62 2 L84 8 L62 14 Z" fill="#ffd34d" stroke="#3b2a3a" stroke-width="2" />
    </template>
    <template v-else>
      <path
        d="M8 62 L192 62 Q184 90 152 94 L48 94 Q18 90 8 62 Z"
        fill="#a86a43"
        stroke="#3b2a3a"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <rect
        x="10"
        y="60"
        width="180"
        height="8"
        rx="4"
        fill="#d79b6b"
        stroke="#3b2a3a"
        stroke-width="3"
      />
      <circle
        v-for="cx in [60, 100, 140]"
        :key="cx"
        :cx="cx"
        cy="80"
        r="5"
        fill="#bfe6ff"
        stroke="#3b2a3a"
        stroke-width="2"
      />
      <path
        class="foam"
        d="M0 92 Q25 84 50 92 T100 92 T150 92 T200 92 L200 100 L0 100 Z"
        fill="rgb(255 255 255 / 70%)"
      />
    </template>
  </svg>

  <!-- Máy bay cánh quạt -->
  <svg
    v-else
    class="veh plane"
    :class="layer"
    width="240"
    height="96"
    viewBox="0 0 240 96"
    aria-hidden="true"
  >
    <template v-if="layer === 'back'">
      <path
        d="M18 8 L40 8 L60 42 L22 42 Z"
        fill="#4aa8d8"
        stroke="#3b2a3a"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M100 40 L150 40 L136 14 L116 14 Z"
        fill="#3a8fbd"
        stroke="#3b2a3a"
        stroke-width="4"
        stroke-linejoin="round"
      />
    </template>
    <template v-else>
      <path
        d="M14 46 Q14 36 30 36 L172 36 Q214 38 222 58 Q214 76 172 76 L30 76 Q14 76 14 62 Z"
        fill="#ffffff"
        stroke="#3b2a3a"
        stroke-width="4"
      />
      <rect x="20" y="54" width="196" height="6" fill="#ff5a5a" />
      <circle
        v-for="cx in [44, 70, 160, 186]"
        :key="cx"
        :cx="cx"
        cy="47"
        r="5"
        fill="#bfe6ff"
        stroke="#3b2a3a"
        stroke-width="2"
      />
      <path
        d="M92 60 L150 60 L122 92 L100 92 Z"
        fill="#4aa8d8"
        stroke="#3b2a3a"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <circle cx="224" cy="58" r="6" fill="#3b2a3a" />
      <ellipse class="prop" cx="228" cy="58" rx="4" ry="26" fill="rgb(59 42 58 / 45%)" />
    </template>
  </svg>
</template>

<style scoped>
.veh {
  position: absolute;
  pointer-events: none;
}
/* Gốc (0, 0) của lớp chứa = điểm chạm đất; đặt hình cân giữa theo chiều ngang */
.car {
  left: -90px;
  top: -80px;
}
.boat {
  left: -100px;
  top: -88px;
}
.plane {
  left: -120px;
  top: -96px;
}
.wheel {
  animation: spin 0.45s linear infinite;
}
.foam {
  animation: foam 1.2s ease-in-out infinite alternate;
}
.prop {
  transform-origin: 228px 58px;
  animation: prop 0.12s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes foam {
  to {
    transform: translateX(-12px);
  }
}
@keyframes prop {
  50% {
    transform: scaleY(0.2);
  }
}
@media (prefers-reduced-motion: reduce) {
  .wheel,
  .foam,
  .prop {
    animation: none;
  }
}
</style>
