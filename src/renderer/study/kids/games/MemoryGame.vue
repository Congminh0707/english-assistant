<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import { PRAISE, pick } from '../kidsText'
import GameStage from './GameStage.vue'
import SpriteLoop from './SpriteLoop.vue'
import { artUrl } from './gameArt'
import { useStageScale } from './useStageScale'
import { buildMemoryDeck, type GameConfig, type GameWord } from './gameLogic'

// Lật thẻ ghép cặp: lật hai lá, trùng hình thì giữ lại. Nghe tên từ mỗi khi lật; không tính giờ, lật nhầm không bị phạt.
const props = defineProps<{ pool: GameWord[]; cfg: GameConfig }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const { px } = useStageScale()
const PAIRS = props.cfg.pairs
const deck = ref(buildMemoryDeck(props.pool, PAIRS))
const open = ref<string[]>([])
const matched = ref<string[]>([])
const misses = ref(0)
const busy = ref(false)

const byKey = computed(() => new Map(deck.value.map((c) => [c.key, c])))
const isUp = (key: string): boolean =>
  open.value.includes(key) || matched.value.includes(byKey.value.get(key)?.pictureId ?? '')
const back = artUrl('memory', 'card-back-0')
const front = artUrl('memory', 'card-front-0')

function flip(key: string): void {
  if (busy.value || isUp(key)) return
  const card = byKey.value.get(key)
  if (!card) return
  speak(card.word, 'us', 0.8)
  open.value.push(key)
  if (open.value.length < 2) return
  busy.value = true
  const [a, b] = open.value.map((k) => byKey.value.get(k))
  if (a?.pictureId === b?.pictureId) {
    matched.value.push(a?.pictureId ?? '')
    window.setTimeout(() => {
      speak(pick(PRAISE), 'us', 0.9)
      open.value = []
      busy.value = false
      if (matched.value.length === PAIRS) {
        window.setTimeout(() => emit('done', Math.max(0, PAIRS - misses.value), PAIRS), 900)
      }
    }, 700)
  } else {
    misses.value++
    window.setTimeout(() => {
      open.value = []
      busy.value = false
    }, 1100)
  }
}
</script>

<template>
  <GameStage game="memory">
    <div class="memory" :style="{ '--cols': deck.length === 6 ? 3 : 4 }">
      <button
        v-for="c in deck"
        :key="c.key"
        type="button"
        class="card"
        :class="{ up: isUp(c.key), done: matched.includes(c.pictureId) }"
        :disabled="busy && !isUp(c.key)"
        :aria-label="isUp(c.key) ? c.word : '?'"
        @click="flip(c.key)"
      >
        <img class="face" :src="isUp(c.key) ? front : back" alt="" draggable="false" />
        <span v-if="isUp(c.key)" class="pic">
          <PictureImage :id="c.pictureId" :size="px(112)" />
          <span v-if="cfg.showText" class="label">{{ c.word }}</span>
        </span>
        <span v-if="matched.includes(c.pictureId)" class="spark">
          <SpriteLoop game="memory" name="sparkle" :width="px(120)" mode="once" :fps="10" />
        </span>
      </button>
    </div>
  </GameStage>
</template>

<style scoped>
.memory {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--cols, 4), calc(190px * var(--s)));
  gap: calc(18px * var(--s));
  justify-content: center;
  align-content: center;
  padding: var(--sp-4);
}
.card {
  position: relative;
  display: grid;
  width: calc(190px * var(--s));
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 120ms ease;
}
.card:hover:not(:disabled) {
  transform: translateY(-4px) rotate(-1.5deg);
}
.card:disabled {
  cursor: default;
}
.face {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 0 rgb(0 0 0 / 25%));
}
.pic {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
  padding-top: 4px;
}
.label {
  font-family: var(--font-kids);
  font-size: var(--fs-xl);
  font-weight: 800;
  color: var(--c-ink);
}
.spark {
  position: absolute;
  top: calc(-30px * var(--s));
  right: calc(-30px * var(--s));
}
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
</style>
