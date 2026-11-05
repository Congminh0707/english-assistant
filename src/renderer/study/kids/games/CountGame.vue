<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import GameHud from './GameHud.vue'
import GameStage from './GameStage.vue'
import { NUMBER_WORDS, buildCountRounds, type GameConfig, type GameWord } from './gameLogic'
import { useStageScale } from './useStageScale'

// Đếm số: có n hình giống nhau, bé chạm con số đúng. Sai thì thử lại (không tính giờ). Hình đếm lấy từ bộ từ của bé.
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const { px } = useStageScale()
const ROUNDS = props.cfg.rounds
const rounds = ref(buildCountRounds(props.pool, ROUNDS, props.cfg.countMax, props.cfg.choices))
const q = ref(0)
const wrong = ref<number[]>([])
const solved = ref(false)
const firstTry = ref(0)

const ask = (): void => speak('How many?', 'us', 0.8)

function tap(n: number): void {
  const round = rounds.value[q.value]
  if (solved.value || wrong.value.includes(n)) return
  if (n === round.n) {
    solved.value = true
    if (wrong.value.length === 0) firstTry.value++
    speak(`${pick(PRAISE)} ${NUMBER_WORDS[n]} ${round.target.word}`, 'us', 0.9)
    window.setTimeout(() => {
      solved.value = false
      wrong.value = []
      if (q.value + 1 < ROUNDS) {
        q.value++
        ask()
      } else emit('done', firstTry.value, ROUNDS)
    }, 1400)
  } else {
    wrong.value.push(n)
    speak(pick(TRY_AGAIN), 'us', 0.9)
  }
}

onMounted(ask)
</script>

<template>
  <GameStage v-if="rounds[q]" game="count">
    <GameHud :step="`${q + 1} / ${ROUNDS}`" speaker @speak="ask" />
    <div class="count">
      <div class="things" role="img" :aria-label="`${rounds[q].n} ${rounds[q].target.word}`">
        <PictureImage
          v-for="i in rounds[q].n"
          :id="rounds[q].target.pictureId"
          :key="`${q}-${i}`"
          :size="px(rounds[q].n > 6 ? 110 : 140)"
        />
      </div>
      <div class="answers">
        <button
          v-for="n in rounds[q].choices"
          :key="n"
          type="button"
          class="k-big num"
          :class="{ wrong: wrong.includes(n), right: solved && n === rounds[q].n }"
          :disabled="solved || wrong.includes(n)"
          @click="tap(n)"
        >
          <span class="digit">{{ n }}</span>
          <span v-if="cfg.showText" class="word">{{ NUMBER_WORDS[n] }}</span>
        </button>
      </div>
    </div>
  </GameStage>
</template>

<style scoped>
.count {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: var(--sp-4);
  justify-items: center;
  padding: var(--sp-3) var(--sp-4) var(--sp-5);
}
.things {
  display: flex;
  flex-wrap: wrap;
  gap: calc(12px * var(--s));
  align-content: center;
  justify-content: center;
  max-width: 900px;
}
.answers {
  display: flex;
  flex-wrap: wrap;
  gap: calc(20px * var(--s));
  justify-content: center;
}
.num {
  min-width: calc(150px * var(--s));
  min-height: calc(150px * var(--s));
  cursor: pointer;
}
.digit {
  font-size: calc(72px * var(--s));
  font-weight: 800;
  line-height: 1;
}
.word {
  font-size: calc(24px * var(--s));
}
.num.wrong {
  opacity: 0.5;
  animation: shake 400ms ease;
}
.num.right {
  border-color: var(--c-success);
  background: var(--c-success-soft);
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
  .num.wrong {
    animation: none;
  }
}
</style>
