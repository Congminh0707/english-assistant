<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import { groupById, type PictureGroupId } from '@shared/pictureGroups'
import { PRAISE, TRY_AGAIN, pick } from '../kidsText'
import GameHud from './GameHud.vue'
import GameStage from './GameStage.vue'
import { buildSortRounds, type GameConfig, type GameWord } from './gameLogic'
import { useStageScale } from './useStageScale'

// Phân loại: một hình hiện ra, bé chạm đúng ô nhóm (con vật / đồ ăn / xe cộ...). Sai thì thử lại, không tính giờ.
const props = defineProps<{ pool: GameWord[]; all: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const { px } = useStageScale()
const built = buildSortRounds(props.pool, props.all, props.cfg.sortGroups, props.cfg.rounds)
const groups = built.groups.map(groupById)
const rounds = built.rounds
const total = rounds.length
const q = ref(0)
const wrong = ref<PictureGroupId[]>([])
const solved = ref(false)
const firstTry = ref(0)

const ask = (): void => speak(rounds[q.value].word.word, 'us', 0.8)

function tap(id: PictureGroupId): void {
  const round = rounds[q.value]
  if (solved.value || wrong.value.includes(id)) return
  if (id === round.group) {
    solved.value = true
    if (wrong.value.length === 0) firstTry.value++
    speak(`${pick(PRAISE)} ${round.word.word}, ${groupById(id).en}`, 'us', 0.9)
    window.setTimeout(() => {
      solved.value = false
      wrong.value = []
      if (q.value + 1 < total) {
        q.value++
        ask()
      } else emit('done', firstTry.value, total)
    }, 1400)
  } else {
    wrong.value.push(id)
    speak(pick(TRY_AGAIN), 'us', 0.9)
  }
}

onMounted(() => {
  if (total === 0) emit('done', 1, 1)
  else ask()
})
</script>

<template>
  <GameStage v-if="rounds[q]" game="sort">
    <GameHud :step="`${q + 1} / ${total}`" speaker @speak="ask" />
    <div class="sort">
      <button type="button" class="item" @click="ask">
        <PictureImage :id="rounds[q].word.pictureId" :size="px(200)" />
        <span v-if="cfg.showText" class="k-bubble">{{ rounds[q].word.word }}</span>
      </button>
      <div class="bins">
        <button
          v-for="g in groups"
          :key="g.id"
          type="button"
          class="k-big bin"
          :class="{ wrong: wrong.includes(g.id), right: solved && g.id === rounds[q].group }"
          :disabled="solved || wrong.includes(g.id)"
          @click="tap(g.id)"
        >
          <PictureImage :id="g.pictureId" :size="px(100)" />
          <span v-if="cfg.showText">{{ g.en }}</span>
          <span v-if="cfg.showText" class="vi">{{ g.vi }}</span>
        </button>
      </div>
    </div>
  </GameStage>
</template>

<style scoped>
.sort {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: var(--sp-4);
  justify-items: center;
  padding: var(--sp-3) var(--sp-4) var(--sp-5);
}
.item {
  display: grid;
  gap: var(--sp-2);
  justify-items: center;
  align-self: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  animation: hop 500ms ease-out;
}
.bins {
  display: flex;
  flex-wrap: wrap;
  gap: calc(24px * var(--s));
  justify-content: center;
}
.bin {
  min-width: calc(220px * var(--s));
  font-size: calc(28px * var(--s));
  cursor: pointer;
}
.vi {
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-ink-soft);
}
.bin.wrong {
  opacity: 0.5;
  animation: shake 400ms ease;
}
.bin.right {
  border-color: var(--c-success);
  background: var(--c-success-soft);
}
@keyframes hop {
  from {
    transform: translateY(-24px) scale(0.9);
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
  .item,
  .bin.wrong {
    animation: none;
  }
}
</style>
