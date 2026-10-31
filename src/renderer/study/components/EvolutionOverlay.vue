<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'

// Màn hình tiến hoá: giai đoạn cũ nhấp nháy rồi biến thành giai đoạn mới.
const props = defineProps<{
  character: string
  name: string
  from: string | null
  to: string
  accessories: string[]
}>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

/** 0 = giai đoạn cũ, 1 = nhấp nháy, 2 = giai đoạn mới */
const phase = ref(props.from ? 0 : 2)

onMounted(() => {
  if (!props.from) return
  window.setTimeout(() => (phase.value = 1), 900)
  window.setTimeout(() => (phase.value = 2), 2300)
})
</script>

<template>
  <div class="overlay" role="dialog" aria-modal="true" @keydown.esc="emit('close')">
    <div class="card" aria-live="polite" :class="{ flash: phase === 1 }">
      <h2>
        {{
          phase < 2
            ? t('study.pet.evolving', { name })
            : t('study.pet.evolved', { name, stage: t(`pet.stage.${to}`) })
        }}
      </h2>
      <div class="stage">
        <PetSprite
          v-if="phase === 0 && from"
          :character="character"
          :stage="from"
          :size="288"
          animate
        />
        <PetSprite
          v-else-if="phase === 1 && from"
          :character="character"
          :stage="from"
          :size="288"
          silhouette
        />
        <PetSprite
          v-else
          :character="character"
          :stage="to"
          :accessories="accessories"
          :size="288"
          animate
        />
      </div>
      <button
        v-if="phase === 2"
        type="button"
        class="btn btn--success btn--lg"
        autofocus
        @click="emit('close')"
      >
        {{ t('study.pet.great') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--c-bg) 25%, black 75%);
  backdrop-filter: blur(2px);
}
.card {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
  padding: var(--sp-5) var(--sp-7);
  text-align: center;
  background: var(--c-surface);
  border: 2px solid var(--c-coin);
  box-shadow: var(--shadow-md);
  border-radius: var(--r-lg);
}
.card.flash {
  animation: flash 0.5s ease-in-out infinite;
}
h2 {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 800;
}
.stage {
  padding: 8px;
}
@keyframes flash {
  50% {
    background: var(--c-warning-soft);
    filter: brightness(1.3);
  }
}
@media (prefers-reduced-motion: reduce) {
  .card.flash {
    animation: none;
  }
}
</style>
