<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { PRAISE, pick } from '../kidsText'
import { buildMemoryDeck, type GameWord } from './gameLogic'

// Lật thẻ ghép cặp: lật hai lá, trùng hình thì giữ lại. Nghe tên từ mỗi khi lật; không tính giờ, lật nhầm không bị phạt.
const props = defineProps<{ pool: GameWord[] }>()
const emit = defineEmits<{ done: [correct: number, total: number] }>()

const { speak } = useTts()
const PAIRS = 4
const deck = ref(buildMemoryDeck(props.pool, PAIRS))
const open = ref<string[]>([])
const matched = ref<string[]>([])
const misses = ref(0)
const busy = ref(false)

const byKey = computed(() => new Map(deck.value.map((c) => [c.key, c])))
const isUp = (key: string): boolean =>
  open.value.includes(key) || matched.value.includes(byKey.value.get(key)?.pictureId ?? '')

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
  <div class="memory">
    <button
      v-for="c in deck"
      :key="c.key"
      type="button"
      class="k-big card"
      :class="{ up: isUp(c.key), done: matched.includes(c.pictureId) }"
      :disabled="busy && !isUp(c.key)"
      :aria-label="isUp(c.key) ? c.word : '?'"
      @click="flip(c.key)"
    >
      <PictureImage v-if="isUp(c.key)" :id="c.pictureId" :size="120" />
      <UiIcon v-else name="star" :size="64" class="back" />
    </button>
  </div>
</template>

<style scoped>
.memory {
  display: grid;
  grid-template-columns: repeat(4, 160px);
  gap: var(--sp-5);
  justify-content: center;
}
.card {
  min-width: 0;
  min-height: 180px;
}
.card .back {
  color: var(--c-coin);
  fill: currentcolor;
}
.card.up {
  background: var(--c-warning-soft);
}
.card.done {
  background: var(--c-surface-2);
  border-color: var(--c-warning);
}
</style>
