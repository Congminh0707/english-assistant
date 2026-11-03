<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import { buildSpellRounds, type GameConfig, type GameWord } from './gameLogic'

// Điền chữ thiếu (7–8 tuổi): thấy hình và từ thiếu một chữ, nghe từ, chạm chữ còn thiếu. Sai thì thử lại, không tính giờ.
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const rounds = ref(buildSpellRounds(props.pool, props.cfg.rounds, props.cfg.choices))
const ROUNDS = rounds.value.length
const q = ref(0)
const wrong = ref<string[]>([])
const filled = ref(false)
const firstTry = ref(0)

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
  <div v-if="rounds[q]" class="spell">
    <p class="k-sub">{{ q + 1 }} / {{ ROUNDS }}</p>
    <PictureImage :id="rounds[q].target.pictureId" :size="170" />
    <button type="button" class="k-big word" @click="ask">
      <UiIcon name="volume" :size="28" class="say" />
      <span class="letters">
        <template v-for="(ch, i) in rounds[q].pattern" :key="i">
          <span v-if="ch === '_'" class="hole" :class="{ filled }">
            {{ filled ? rounds[q].missing : '' }}
          </span>
          <span v-else>{{ ch }}</span>
        </template>
      </span>
    </button>
    <div class="k-row">
      <button
        v-for="c in rounds[q].choices"
        :key="c"
        type="button"
        class="k-big letter"
        :class="{ wrong: wrong.includes(c) }"
        :disabled="filled || wrong.includes(c)"
        @click="tap(c)"
      >
        {{ c }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.spell {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
}
.word {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-6);
}
.say {
  color: var(--c-warning);
}
.letters {
  display: inline-flex;
  gap: var(--sp-1);
  font-size: 72px;
  line-height: 1.1;
}
.hole {
  display: inline-block;
  min-width: 56px;
  border-bottom: 6px solid var(--c-ink);
  text-align: center;
  color: var(--c-warning);
}
.hole.filled {
  border-bottom-color: transparent;
}
.letter {
  min-width: 100px;
  min-height: 100px;
  font-size: 56px;
}
</style>
