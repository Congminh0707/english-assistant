<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useTts } from '@renderer/shared/composables/useTts'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { normalizeCharacterId } from '@shared/characters'
import { TRY_AGAIN, pick } from '../kidsText'
import GameHud from './GameHud.vue'
import GameStage from './GameStage.vue'
import SpriteLoop from './SpriteLoop.vue'
import { buildRounds, type GameConfig, type GameWord } from './gameLogic'
import { useStageScale } from './useStageScale'

// Thú cưng đói: thú cưng đòi một món ("I want an apple!"), bé chạm đúng hình để cho ăn. Sai thì thú cưng nói nhẹ nhàng.
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const { px } = useStageScale()
const petStore = usePetStore()
const ROUNDS = props.cfg.rounds
const rounds = ref(buildRounds(props.pool, ROUNDS, props.cfg.choices))
const q = ref(0)
const wrong = ref<string[]>([])
const happy = ref(false)
const firstTry = ref(0)

const line = (w: GameWord): string => `I want ${/^[aeiou]/i.test(w.word) ? 'an' : 'a'} ${w.word}!`
const ask = (): void => speak(line(rounds.value[q.value].target), 'us', 0.8)

function feed(w: GameWord): void {
  const round = rounds.value[q.value]
  if (happy.value || wrong.value.includes(w.pictureId)) return
  if (w.pictureId === round.target.pictureId) {
    happy.value = true
    if (wrong.value.length === 0) firstTry.value++
    speak(`Yum! ${round.target.word}!`, 'us', 0.9)
    window.setTimeout(() => {
      happy.value = false
      wrong.value = []
      if (q.value + 1 < ROUNDS) {
        q.value++
        ask()
      } else emit('done', firstTry.value, ROUNDS)
    }, 1400)
  } else {
    wrong.value.push(w.pictureId)
    speak(`No thanks! ${pick(TRY_AGAIN)}`, 'us', 0.9)
  }
}

onMounted(async () => {
  await petStore.load()
  ask()
})
</script>

<template>
  <GameStage v-if="rounds[q]" game="pet">
    <GameHud :step="`${q + 1} / ${ROUNDS}`" />
    <div class="yard">
      <span class="butterfly" aria-hidden="true">
        <SpriteLoop game="pet" name="butterfly" :width="px(120)" mode="loop" :fps="9" />
      </span>
      <button type="button" class="k-bubble want" @click="ask">
        <UiIcon name="volume" :size="px(32)" />
        <template v-if="cfg.showText">{{ line(rounds[q].target) }}</template>
      </button>
      <div class="pet-row">
        <PetSprite
          v-if="petStore.pet"
          :character="normalizeCharacterId(petStore.pet.characterId)"
          :stage="petStore.pet.stage"
          :accessories="petStore.pet.equipped"
          :pose="happy ? 'happy' : 'idle'"
          :size="px(290)"
          animate
        />
        <span class="bowl">
          <SpriteLoop game="pet" name="bowl" :width="px(190)" mode="still" />
          <span v-if="happy" class="treat">
            <PictureImage :id="rounds[q].target.pictureId" :size="px(80)" />
          </span>
        </span>
      </div>
      <div class="plates">
        <button
          v-for="w in rounds[q].choices"
          :key="w.pictureId"
          type="button"
          class="plate"
          :class="{ wrong: wrong.includes(w.pictureId) }"
          :disabled="happy || wrong.includes(w.pictureId)"
          @click="feed(w)"
        >
          <SpriteLoop game="pet" name="plate" :width="px(230)" mode="still" />
          <span class="pic"><PictureImage :id="w.pictureId" :size="px(116)" /></span>
          <span v-if="cfg.showText" class="chip">{{ w.word }}</span>
        </button>
      </div>
    </div>
  </GameStage>
</template>

<style scoped>
.yard {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--sp-2);
  justify-items: center;
  padding: var(--sp-3) var(--sp-4) var(--sp-4);
}
.pet-row {
  display: flex;
  align-items: flex-end;
  align-self: end;
  gap: calc(16px * var(--s));
  margin-bottom: var(--sp-3);
}
.want {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: calc(36px * var(--s));
  cursor: pointer;
}
.bowl {
  position: relative;
  display: grid;
}
.treat {
  position: absolute;
  top: calc(-44px * var(--s));
  left: 50%;
  transform: translateX(-50%);
  animation: hop 500ms ease-out;
}
.plates {
  display: flex;
  flex-wrap: wrap;
  gap: calc(20px * var(--s));
  justify-content: center;
}
.plate {
  position: relative;
  display: grid;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 120ms ease;
}
.plate:hover:not(:disabled) {
  transform: translateY(-4px);
}
.plate:disabled:not(.wrong) {
  cursor: default;
}
.plate.wrong {
  opacity: 0.5;
  animation: shake 400ms ease;
}
.pic {
  position: absolute;
  top: calc(28px * var(--s));
  left: 50%;
  transform: translateX(-50%);
}
.chip {
  position: absolute;
  bottom: calc(-8px * var(--s));
  left: 50%;
  padding: 0 var(--sp-3);
  border: 3px solid var(--c-ink);
  border-radius: var(--r-pill);
  background: var(--c-surface);
  font-family: var(--font-kids);
  font-size: calc(22px * var(--s));
  font-weight: 800;
  line-height: 1.3;
  color: var(--c-ink);
  transform: translateX(-50%);
  white-space: nowrap;
}
.butterfly {
  position: absolute;
  top: calc(90px * var(--s));
  right: calc(80px * var(--s));
  animation: drift 9s ease-in-out infinite alternate;
}
@keyframes drift {
  to {
    transform: translate(-110px, 50px) rotate(-8deg);
  }
}
@keyframes hop {
  from {
    transform: translate(-50%, 20px);
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
  .butterfly,
  .treat,
  .plate.wrong {
    animation: none;
  }
  .plate {
    transition: none;
  }
}
</style>
