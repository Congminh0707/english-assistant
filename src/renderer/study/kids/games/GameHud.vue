<script setup lang="ts">
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Góc trên trái của màn game: số lượt (3 / 5) và nút nghe lại từ. Nằm dưới thanh Home của KidsApp.
defineProps<{ step: string; speaker?: boolean }>()
defineEmits<{ speak: [] }>()
</script>

<template>
  <div class="hud">
    <button v-if="speaker" type="button" class="k-round speaker" @click="$emit('speak')">
      <UiIcon name="volume" :size="44" />
    </button>
    <p class="k-sub">{{ step }}</p>
  </div>
</template>

<style scoped>
.hud {
  position: absolute;
  top: calc(88px + var(--sp-3));
  left: var(--sp-5);
  z-index: 2;
  display: grid;
  gap: var(--sp-3);
  justify-items: start;
}
.speaker {
  width: 96px;
  height: 96px;
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
</style>
