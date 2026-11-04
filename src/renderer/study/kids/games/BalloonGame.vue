<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import GameStage from './GameStage.vue'
import SpriteLoop from './SpriteLoop.vue'
import GameHud from './GameHud.vue'
import { buildRounds, type GameConfig, type GameWord } from './gameLogic'
import { useStageScale } from './useStageScale'

// Bắn bóng bay: nghe một từ, chạm quả bóng có hình đúng. Bóng chỉ đung đưa tại chỗ (không bay mất, không tính giờ).
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const { px } = useStageScale()
const ROUNDS = props.cfg.rounds
const rounds = ref(buildRounds(props.pool, ROUNDS, props.cfg.choices))
const q = ref(0)
const wrong = ref<string[]>([])
const popped = ref<string | null>(null)
const firstTry = ref(0)
const COLORS = ['red', 'yellow', 'blue']

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
  <GameStage v-if="rounds[q]" game="balloon">
    <GameHud :step="`${q + 1} / ${ROUNDS}`" speaker @speak="ask" />
    <div class="sky">
      <button
        v-for="(w, i) in rounds[q].choices"
        :key="w.pictureId"
        type="button"
        class="balloon"
        :class="{ pop: popped === w.pictureId, shake: wrong.includes(w.pictureId) }"
        :style="{ '--delay': `${i * 300}ms`, '--drop': `${(i % 2) * 40}px` }"
        :disabled="!!popped"
        @click="tap(w)"
      >
        <template v-if="popped === w.pictureId">
          <SpriteLoop
            game="balloon"
            :name="`pop-${COLORS[i % COLORS.length]}`"
            fill
            mode="once"
            :fps="10"
          />
        </template>
        <template v-else>
          <SpriteLoop
            game="balloon"
            :name="`balloon-${COLORS[i % COLORS.length]}`"
            fill
            mode="pingpong"
            :fps="3"
          />
          <span class="pic">
            <PictureImage :id="w.pictureId" :size="px(112)" />
            <span v-if="cfg.showText" class="label">{{ w.word }}</span>
          </span>
        </template>
      </button>
    </div>
  </GameStage>
</template>

<style scoped>
.sky {
  --bw: min(calc(270px * var(--s)), calc((100vw - 260px) / 4.3));
  position: relative;
  display: flex;
  gap: calc(var(--bw) * 0.1);
  justify-content: center;
  align-items: flex-start;
  padding: calc(20px * var(--s)) 0 0 100px;
}
.balloon {
  position: relative;
  display: grid;
  place-items: start center;
  width: var(--bw);
  margin-top: var(--drop);
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  animation: bob 2400ms ease-in-out var(--delay) infinite;
}
.pic {
  position: absolute;
  top: calc(var(--bw) * 0.17);
  left: 50%;
  display: grid;
  width: calc(var(--bw) * 0.5);
  justify-items: center;
  transform: translateX(-50%);
}
.pic :deep(img),
.pic :deep(svg) {
  width: 100%;
  height: auto;
}
.label {
  font-family: var(--font-kids);
  font-size: calc(var(--bw) * 0.1);
  font-weight: 800;
  color: var(--c-ink);
}
.balloon.pop {
  animation: none;
}
.balloon.shake {
  animation: shake 400ms ease;
}
.balloon:disabled:not(.pop) {
  opacity: 0.55;
}
@keyframes bob {
  50% {
    transform: translateY(-14px);
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
