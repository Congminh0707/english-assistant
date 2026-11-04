<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import GameHud from './GameHud.vue'
import GameStage from './GameStage.vue'
import SpriteLoop from './SpriteLoop.vue'
import { buildRounds, type GameConfig, type GameWord } from './gameLogic'
import { useStageScale } from './useStageScale'

// Câu cá: nghe một từ, chạm con cá đang mang hình đúng. Cá bơi chậm qua lại trong lòng ao, không biến mất, không tính giờ.
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const { px } = useStageScale()
const ROUNDS = props.cfg.rounds
const rounds = ref(buildRounds(props.pool, ROUNDS, props.cfg.choices))
const q = ref(0)
const wrong = ref<string[]>([])
const caught = ref<string | null>(null)
const firstTry = ref(0)
const caughtAt = ref({ x: 0, flip: false })
// Cảnh trên bờ chiếm ~28 % khung; cá bơi ở các làn trong nước bên dưới
const LANES = ['33%', '47%', '61%', '75%']
const FISH = ['orange', 'green', 'yellow']
const fx = ref<{ kind: 'splash' | 'ripple'; x: number; y: number; id: number } | null>(null)
let fxId = 0

const ask = (): void => speak(rounds.value[q.value].target.word, 'us', 0.8)

function showFx(kind: 'splash' | 'ripple', ev: MouseEvent): void {
  const stage = (ev.currentTarget as HTMLElement).closest('.pond')?.getBoundingClientRect()
  const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  if (!stage) return
  fx.value = {
    kind,
    x: rect.left - stage.left + rect.width / 2,
    y: kind === 'splash' ? stage.height * 0.3 : rect.top - stage.top + rect.height / 2,
    id: ++fxId
  }
}

function tap(w: GameWord, ev: MouseEvent): void {
  const round = rounds.value[q.value]
  if (caught.value || wrong.value.includes(w.pictureId)) return
  if (w.pictureId === round.target.pictureId) {
    // Giữ nguyên chỗ và hướng quay của con cá lúc chạm để nó bay lên từ đó, không nhảy về mép
    const el = ev.currentTarget as HTMLElement
    const stage = el.closest('.pond')?.getBoundingClientRect()
    const flipEl = el.querySelector('.flip')
    caughtAt.value = {
      x: stage ? el.getBoundingClientRect().left - stage.left : 0,
      flip: flipEl ? getComputedStyle(flipEl).transform.startsWith('matrix(-') : false
    }
    caught.value = w.pictureId
    showFx('splash', ev)
    if (wrong.value.length === 0) firstTry.value++
    speak(`${pick(PRAISE)} ${round.target.word}`, 'us', 0.9)
    window.setTimeout(() => {
      caught.value = null
      wrong.value = []
      fx.value = null
      if (q.value + 1 < ROUNDS) {
        q.value++
        ask()
      } else emit('done', firstTry.value, ROUNDS)
    }, 1300)
  } else {
    wrong.value.push(w.pictureId)
    showFx('ripple', ev)
    speak(pick(TRY_AGAIN), 'us', 0.9)
  }
}

onMounted(ask)
</script>

<template>
  <GameStage v-if="rounds[q]" game="fishing">
    <GameHud :step="`${q + 1} / ${ROUNDS}`" speaker @speak="ask" />
    <div class="pond">
      <span class="bubbles left" aria-hidden="true">
        <SpriteLoop game="fishing" name="bubbles" :width="px(100)" mode="loop" :fps="5" />
      </span>
      <span class="bubbles right" aria-hidden="true">
        <SpriteLoop game="fishing" name="bubbles" :width="px(76)" mode="loop" :fps="4" />
      </span>
      <button
        v-for="(w, i) in rounds[q].choices"
        :key="w.pictureId"
        type="button"
        class="fish"
        :class="{ up: caught === w.pictureId, shake: wrong.includes(w.pictureId) }"
        :style="{
          top: LANES[i % LANES.length],
          '--delay': `${i * -Math.round(24000 / rounds[q].choices.length)}ms`,
          '--i': i,
          ...(caught === w.pictureId
            ? { left: `${caughtAt.x}px`, '--f': caughtAt.flip ? -1 : 1 }
            : {})
        }"
        :disabled="!!caught"
        @click="tap(w, $event)"
      >
        <span class="flip">
          <SpriteLoop
            game="fishing"
            :name="`fish-${FISH[i % FISH.length]}`"
            :width="px(230)"
            mode="loop"
            :fps="7"
          />
        </span>
        <span class="badge"><PictureImage :id="w.pictureId" :size="px(66)" /></span>
        <span v-if="cfg.showText" class="chip">{{ w.word }}</span>
      </button>
      <span
        v-if="fx"
        :key="fx.id"
        class="fx"
        :style="{ left: `${fx.x}px`, top: `${fx.y}px` }"
        aria-hidden="true"
      >
        <SpriteLoop
          game="fishing"
          :name="fx.kind"
          :width="fx.kind === 'splash' ? px(220) : px(200)"
          mode="once"
          :fps="9"
        />
      </span>
    </div>
  </GameStage>
</template>

<style scoped>
/* phủ cả khung (kể cả 88px thanh Home mà GameStage chừa) để làn cá tính theo % khung */
.pond {
  position: absolute;
  inset: 0;
}
.fish {
  position: absolute;
  left: 2%;
  display: grid;
  justify-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  animation: swim 24s linear var(--delay) infinite;
}
/* quay đầu cùng nhịp với swim: nửa đầu bơi sang phải, nửa sau bơi về trái */
.flip {
  display: block;
  animation: turn 24s linear var(--delay) infinite;
}
.badge {
  position: absolute;
  top: calc(28px * var(--s));
  left: 54%;
  display: grid;
  place-items: center;
  width: calc(82px * var(--s));
  height: calc(82px * var(--s));
  border: 3px solid var(--c-ink);
  border-radius: var(--r-pill);
  background: var(--c-surface);
  transform: translateX(-50%);
}
.chip {
  margin-top: -4px;
  padding: 0 var(--sp-3);
  border: 3px solid var(--c-ink);
  border-radius: var(--r-pill);
  background: var(--c-surface);
  font-family: var(--font-kids);
  font-size: calc(22px * var(--s));
  font-weight: 800;
  line-height: 1.3;
  color: var(--c-ink);
}
.fish.up {
  animation: up 1200ms ease forwards;
}
.fish.up .flip {
  animation: none;
  transform: scaleX(var(--f, 1));
}
.fish.shake .badge {
  animation: shake 400ms ease;
}
.fish:disabled:not(.up) {
  opacity: 0.55;
}
.bubbles {
  position: absolute;
  bottom: calc(70px * var(--s));
  opacity: 0.9;
}
.bubbles.left {
  left: 6%;
}
.bubbles.right {
  right: 8%;
  bottom: calc(120px * var(--s));
}
.fx {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
@keyframes swim {
  0% {
    left: 2%;
    animation-timing-function: ease-in-out;
  }
  50% {
    left: calc(100% - 300px * var(--s));
    animation-timing-function: ease-in-out;
  }
  100% {
    left: 2%;
  }
}
@keyframes turn {
  0%,
  49.9% {
    transform: scaleX(1);
  }
  50%,
  99.9% {
    transform: scaleX(-1);
  }
  100% {
    transform: scaleX(1);
  }
}
@keyframes up {
  to {
    transform: translateY(-60vh);
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
    left: calc(4% + var(--i, 0) * 22%);
  }
  .flip,
  .fish.shake .badge {
    animation: none;
  }
}
</style>
