<script setup lang="ts">
// Biển tên hình lục giác của bản đồ Làng chữ. `hot`: nơi đang chọn (đỏ viền vàng), thường là giấy viền vàng nhạt.
defineProps<{ text: string; hot?: boolean }>()
</script>

<template>
  <span class="hex" :class="{ hot }">
    <span class="text">{{ text }}</span>
  </span>
</template>

<style scoped>
.hex {
  --edge: var(--g-gold);
  --fill: var(--g-paper);
  position: relative;
  display: inline-block;
  padding: 6px 30px;
  color: var(--g-brown);
  font-family: var(--font-kids);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  isolation: isolate;
  zoom: var(--hz, 1);
}
.hex.hot {
  --edge: var(--g-coin);
  --fill: var(--g-red);
  color: #fff;
}
.hex::before,
.hex::after {
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
.hex::after {
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
</style>
