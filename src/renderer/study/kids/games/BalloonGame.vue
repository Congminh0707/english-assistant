<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import { buildRounds, type GameWord } from './gameLogic'

// Bắn bóng bay: nghe một từ, chạm quả bóng có hình đúng. Bóng chỉ đung đưa tại chỗ (không bay mất, không tính giờ).
const props = defineProps<{ pool: GameWord[] }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const ROUNDS = 5
const rounds = ref(buildRounds(props.pool, ROUNDS, 3))
const q = ref(0)
const wrong = ref<string[]>([])
const popped = ref<string | null>(null)
const firstTry = ref(0)
const COLORS = ['var(--c-danger)', 'var(--c-coin)', 'var(--c-primary)']

const ask = (): void => speak(rounds.value[q.value].target.word, 'us', 0.8)

function tap(w: GameWord): void {
  const round = rounds.value[q.value]
  if (popped.value || wrong.value.includes(w.pictureId)) return
  if (w.pictureId === round.target.pictureId) {
    popped.value = w.pictureId
    if (wrong.value.length === 0) firstTry.value++
    speak(`${pick(PRAISE)} ${round.target.word}`, 'us', 0.9)
    window.setTimeout(() => {
      popped.value = null
      wrong.value = []
      if (q.value + 1 < ROUNDS) {
        q.value++
        ask()
      } else emit('done', firstTry.value, ROUNDS)
    }, 1200)
  } else {
    wrong.value.push(w.pictureId)
    speak(pick(TRY_AGAIN), 'us', 0.9)
  }
}

onMounted(ask)
</script>

<template>
  <div v-if="rounds[q]" class="balloons">
    <p class="k-sub">{{ q + 1 }} / {{ ROUNDS }}</p>
    <button type="button" class="k-round speaker" @click="ask">
      <UiIcon name="volume" :size="44" />
    </button>
    <div class="sky">
      <button
        v-for="(w, i) in rounds[q].choices"
        :key="w.pictureId"
        type="button"
        class="balloon"
        :class="{ pop: popped === w.pictureId, shake: wrong.includes(w.pictureId) }"
        :style="{ '--tint': COLORS[i % COLORS.length], '--delay': `${i * 300}ms` }"
        :disabled="!!popped"
        @click="tap(w)"
      >
        <span class="bubble"><PictureImage :id="w.pictureId" :size="110" /></span>
        <span class="string" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.balloons {
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
.sky {
  display: flex;
  gap: var(--sp-7);
  justify-content: center;
  min-height: 330px;
}
.balloon {
  display: grid;
  justify-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  animation: bob 2400ms ease-in-out var(--delay) infinite;
}
.bubble {
  display: grid;
  place-items: center;
  width: 180px;
  height: 220px;
  border: 4px solid var(--c-ink);
  border-radius: 50% 50% 48% 48%;
  background: color-mix(in srgb, var(--tint) 30%, var(--c-surface));
  box-shadow: 0 8px 0 var(--c-ink);
}
.string {
  width: 4px;
  height: 70px;
  background: var(--c-ink);
}
.balloon.pop {
  animation: pop 400ms ease forwards;
}
.balloon.shake {
  animation: shake 400ms ease;
}
.balloon:disabled:not(.pop) {
  opacity: 0.5;
}
@keyframes bob {
  50% {
    transform: translateY(-14px);
  }
}
@keyframes pop {
  60% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
@keyframes shake {
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .balloon,
  .balloon.shake {
    animation: none;
  }
}
</style>
