<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import { PET_STAGES } from '@shared/pet'

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
    <div class="rays" aria-hidden="true" :class="{ flash: phase === 1 }" />
    <div class="body" aria-live="polite">
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
      <ul class="stages">
        <li
          v-for="s in PET_STAGES"
          :key="s.stage"
          class="pill"
          :class="{ on: s.stage === (phase < 2 && from ? from : to) }"
        >
          {{ t(`pet.stage.${s.stage}`) }}
        </li>
      </ul>
      <button
        v-if="phase === 2"
        type="button"
        class="btn btn--primary btn--lg"
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
  overflow: hidden;
  background: color-mix(in srgb, var(--c-ink) 88%, var(--c-primary));
  color: var(--c-bg);
}
.rays {
  border-radius: var(--r-pill);
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(
      circle at 50% 46%,
      color-mix(in srgb, var(--c-coin) 45%, transparent),
      transparent 38%
    ),
    repeating-conic-gradient(
      from 0deg at 50% 46%,
      color-mix(in srgb, var(--c-bg) 4%, transparent) 0deg 9deg,
      transparent 9deg 18deg
    );
}
.rays.flash {
  animation: pulse 0.5s ease-in-out infinite;
}
.body {
  position: relative;
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
  text-align: center;
}
h2 {
  margin: 0;
  color: var(--c-bg);
  font-size: var(--fs-3xl);
  font-weight: 800;
}
.stage {
  padding: var(--sp-2);
}
.stages {
  display: flex;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 var(--sp-3);
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--c-bg) 14%, transparent);
  color: color-mix(in srgb, var(--c-bg) 80%, transparent);
  font-size: var(--fs-xs);
  font-weight: 700;
}
.pill.on {
  background: var(--c-coin);
  color: var(--c-ink);
}
@keyframes pulse {
  50% {
    filter: brightness(1.8);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rays.flash {
    animation: none;
  }
}
</style>
