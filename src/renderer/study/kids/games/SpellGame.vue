<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import GameHud from './GameHud.vue'
import GameStage from './GameStage.vue'
import SpriteLoop from './SpriteLoop.vue'
import { artUrl } from './gameArt'
import { buildSpellRounds, type GameConfig, type GameWord } from './gameLogic'
import { useStageScale } from './useStageScale'

// Điền chữ thiếu (7–8 tuổi): thấy hình và từ thiếu một chữ, nghe từ, chạm chữ còn thiếu. Sai thì thử lại, không tính giờ.
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const { px } = useStageScale()
const rounds = ref(buildSpellRounds(props.pool, props.cfg.rounds, props.cfg.choices))
const ROUNDS = rounds.value.length
const q = ref(0)
const wrong = ref<string[]>([])
const filled = ref(false)
const firstTry = ref(0)
const tile = artUrl('spell', 'tile-0')

const ask = (): void => {
  if (rounds.value[q.value]) speak(rounds.value[q.value].target.word, 'us', 0.7)
}

function tap(letter: string): void {
  const round = rounds.value[q.value]
  if (filled.value || wrong.value.includes(letter)) return
  if (letter === round.missing) {
    filled.value = true
    if (wrong.value.length === 0) firstTry.value++
    speak(`${pick(PRAISE)} ${round.target.word}`, 'us', 0.9)
    window.setTimeout(() => {
      filled.value = false
      wrong.value = []
      if (q.value + 1 < ROUNDS) {
        q.value++
        ask()
      } else emit('done', firstTry.value, ROUNDS)
    }, 1400)
  } else {
    wrong.value.push(letter)
    speak(pick(TRY_AGAIN), 'us', 0.9)
  }
}

onMounted(() => {
  // Chưa đủ từ ghép được (pool quá ít): kết thúc ngay, bé vẫn được ít nhất 1 sao
  if (!ROUNDS) emit('done', 0, 1)
  else ask()
})
</script>

<template>
  <GameStage v-if="rounds[q]" game="spell">
    <GameHud :step="`${q + 1} / ${ROUNDS}`" />
    <div class="porch">
      <PictureImage :id="rounds[q].target.pictureId" :size="px(200)" class="pic" />
      <button type="button" class="word" @click="ask">
        <UiIcon name="volume" :size="px(36)" class="say" />
        <span class="letters">
          <template v-for="(ch, i) in rounds[q].pattern" :key="i">
            <span v-if="ch === '_'" class="cell hole" :class="{ filled }">
              <SpriteLoop
                v-if="!filled"
                game="spell"
                name="slot"
                :width="px(110)"
                mode="pingpong"
                :fps="3"
              />
              <template v-else>
                <img class="tile" :src="tile" alt="" draggable="false" />
                <span class="ch">{{ rounds[q].missing }}</span>
              </template>
            </span>
            <span v-else class="cell">
              <img class="tile" :src="tile" alt="" draggable="false" />
              <span class="ch">{{ ch }}</span>
            </span>
          </template>
        </span>
      </button>
      <div class="choices">
        <button
          v-for="c in rounds[q].choices"
          :key="c"
          type="button"
          class="pick"
          :class="{ wrong: wrong.includes(c) }"
          :disabled="filled || wrong.includes(c)"
          @click="tap(c)"
        >
          <img class="tile" :src="tile" alt="" draggable="false" />
          <span class="ch big">{{ c }}</span>
        </button>
      </div>
      <span class="pencil" aria-hidden="true">
        <SpriteLoop
          game="spell"
          name="pencil"
          :width="px(130)"
          :mode="filled ? 'loop' : 'still'"
          :fps="8"
        />
      </span>
    </div>
  </GameStage>
</template>

<style scoped>
.porch {
  position: relative;
  display: grid;
  gap: calc(14px * var(--s));
  justify-items: center;
  align-content: center;
  padding: var(--sp-4);
}
.pic {
  filter: drop-shadow(0 4px 0 rgb(0 0 0 / 22%));
}
.word {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-4);
  border: 0;
  background: none;
  cursor: pointer;
}
.say {
  color: var(--c-surface);
  filter: drop-shadow(0 2px 0 var(--c-ink));
}
.letters {
  display: inline-flex;
  gap: var(--sp-1);
}
.cell {
  position: relative;
  display: grid;
  place-items: center;
  width: calc(110px * var(--s));
}
.tile {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 3px 0 rgb(0 0 0 / 25%));
}
.ch {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-kids);
  font-size: calc(62px * var(--s));
  font-weight: 800;
  line-height: 1;
  color: var(--c-ink);
}
.ch.big {
  font-size: calc(72px * var(--s));
}
.hole.filled .ch {
  color: var(--c-success);
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: calc(16px * var(--s));
  justify-content: center;
}
.pick {
  position: relative;
  display: grid;
  width: calc(128px * var(--s));
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 100ms ease;
}
.pick:hover:not(:disabled) {
  transform: translateY(-4px) rotate(-2deg);
}
.pick:disabled:not(.wrong) {
  cursor: default;
}
.pick.wrong {
  opacity: 0.45;
  animation: shake 400ms ease;
}
.pencil {
  position: absolute;
  right: calc(36px * var(--s));
  bottom: calc(28px * var(--s));
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
  .pick,
  .pick.wrong {
    animation: none;
    transition: none;
  }
}
</style>
