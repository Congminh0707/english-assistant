<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useTts } from '@renderer/shared/composables/useTts'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { normalizeCharacterId } from '@shared/characters'
import { TRY_AGAIN, pick } from '../kidsText'
import { buildRounds, type GameConfig, type GameWord } from './gameLogic'

// Thú cưng đói: thú cưng đòi một món ("I want an apple!"), bé chạm đúng hình để cho ăn. Sai thì thú cưng nói nhẹ nhàng.
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
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
  <div v-if="rounds[q]" class="feed">
    <p class="k-sub">{{ q + 1 }} / {{ ROUNDS }}</p>
    <div class="who">
      <button type="button" class="k-bubble want" @click="ask">
        <UiIcon name="volume" :size="28" />
        <template v-if="cfg.showText">{{ line(rounds[q].target) }}</template>
      </button>
      <PetSprite
        v-if="petStore.pet"
        :character="normalizeCharacterId(petStore.pet.characterId)"
        :stage="petStore.pet.stage"
        :accessories="petStore.pet.equipped"
        :pose="happy ? 'happy' : 'idle'"
        :size="220"
        animate
      />
    </div>
    <div class="k-row">
      <button
        v-for="w in rounds[q].choices"
        :key="w.pictureId"
        type="button"
        class="k-big choice"
        :class="{ wrong: wrong.includes(w.pictureId) }"
        :disabled="happy || wrong.includes(w.pictureId)"
        @click="feed(w)"
      >
        <PictureImage :id="w.pictureId" :size="130" />
        <span v-if="cfg.showText">{{ w.word }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.feed {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
}
.who {
  display: grid;
  gap: var(--sp-3);
  justify-items: center;
}
.want {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: 30px;
  cursor: pointer;
}
.choice {
  min-width: 190px;
  min-height: 190px;
}
</style>
