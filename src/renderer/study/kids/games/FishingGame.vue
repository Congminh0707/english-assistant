<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import { buildRounds, type GameWord } from './gameLogic'

// Câu cá: nghe một từ, chạm con cá đang mang hình đúng. Cá bơi chậm qua lại, không biến mất, không tính giờ.
const props = defineProps<{ pool: GameWord[] }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const ROUNDS = 5
const rounds = ref(buildRounds(props.pool, ROUNDS, 3))
const q = ref(0)
const wrong = ref<string[]>([])
const caught = ref<string | null>(null)
const firstTry = ref(0)
const LANES = ['10%', '40%', '70%']

const ask = (): void => speak(rounds.value[q.value].target.word, 'us', 0.8)

function tap(w: GameWord): void {
  const round = rounds.value[q.value]
  if (caught.value || wrong.value.includes(w.pictureId)) return
  if (w.pictureId === round.target.pictureId) {
    caught.value = w.pictureId
    if (wrong.value.length === 0) firstTry.value++
    speak(`${pick(PRAISE)} ${round.target.word}`, 'us', 0.9)
    window.setTimeout(() => {
      caught.value = null
      wrong.value = []
      if (q.value + 1 < ROUNDS) {
        q.value++
        ask()
      } else emit('done', firstTry.value, ROUNDS)
    }, 1300)
  } else {
    wrong.value.push(w.pictureId)
    speak(pick(TRY_AGAIN), 'us', 0.9)
  }
}

onMounted(ask)
</script>

<template>
  <div v-if="rounds[q]" class="fishing">
    <p class="k-sub">{{ q + 1 }} / {{ ROUNDS }}</p>
    <button type="button" class="k-round speaker" @click="ask">
      <UiIcon name="volume" :size="44" />
    </button>
    <div class="pond">
      <button
        v-for="(w, i) in rounds[q].choices"
        :key="w.pictureId"
        type="button"
        class="fish"
        :class="{ up: caught === w.pictureId, shake: wrong.includes(w.pictureId) }"
        :style="{ top: LANES[i % LANES.length], '--delay': `${i * -1800}ms`, '--i': i }"
        :disabled="!!caught"
        @click="tap(w)"
      >
        <span class="body"><PictureImage :id="w.pictureId" :size="84" /></span>
        <span class="tail" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.fishing {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
}
.speaker {
  width: 96px;
  height: 96px;
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.pond {
  position: relative;
  width: min(760px, 100%);
  height: 340px;
  overflow: hidden;
  border: 4px solid var(--c-ink);
  border-radius: var(--r-lg);
  background: color-mix(in srgb, var(--c-primary) 22%, var(--c-surface));
  box-shadow: 0 8px 0 var(--c-ink);
}
.fish {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  animation: swim 9s ease-in-out var(--delay) infinite alternate;
}
.body {
  display: grid;
  place-items: center;
  width: 130px;
  height: 100px;
  border: 4px solid var(--c-ink);
  border-radius: 60% 40% 40% 60%;
  background: var(--c-surface);
}
.tail {
  width: 0;
  height: 0;
  border-top: 26px solid transparent;
  border-bottom: 26px solid transparent;
  border-left: 34px solid var(--c-ink);
  order: -1;
  transform: scaleX(-1);
}
.fish.up {
  animation: up 1200ms ease forwards;
}
.fish.shake .body {
  animation: shake 400ms ease;
}
.fish:disabled:not(.up) {
  opacity: 0.5;
}
@keyframes swim {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(560px);
  }
}
@keyframes up {
  to {
    transform: translateY(-340px);
    opacity: 0;
  }
}
@keyframes shake {
  25% {
    transform: translateX(-8px);
  }
  75% {
    transform: translateX(8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .fish {
    animation: none;
    left: calc(var(--i, 0) * 30%);
  }
  .fish.shake .body {
    animation: none;
  }
}
</style>
