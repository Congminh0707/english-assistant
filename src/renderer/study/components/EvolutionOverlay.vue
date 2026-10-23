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
    <div class="card" :class="{ flash: phase === 1 }">
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
  background: rgba(20, 20, 40, 0.7);
}
.card {
  display: grid;
  gap: 16px;
  justify-items: center;
  padding: 28px 40px;
  text-align: center;
  background: var(--c-surface);
  border: 1px solid var(--c-line);
  box-shadow: var(--shadow-sm);
  border-radius: var(--r-md);
}
.card.flash {
  animation: flash 0.35s steps(2) infinite;
}
h2 {
  margin: 0;
  font-size: 20px;
}
.stage {
  padding: 8px;
}
@keyframes flash {
  50% {
    background: #fff;
    filter: brightness(1.6);
  }
}
@media (prefers-reduced-motion: reduce) {
  .card.flash {
    animation: none;
  }
}
</style>
