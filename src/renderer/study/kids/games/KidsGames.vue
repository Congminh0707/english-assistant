<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { useLeaveGuard } from '../../leaveGuard'
import { FOOD_NAME, FOOD_PICTURE } from '../kidsText'
import BalloonGame from './BalloonGame.vue'
import FishingGame from './FishingGame.vue'
import MemoryGame from './MemoryGame.vue'
import PetFeedGame from './PetFeedGame.vue'
import { gamePool, starsFor, type GameWord } from './gameLogic'

// Mini-game của bé: dùng chính các từ bé đã dán sticker (thiếu thì bù từ đầu album). Mỗi game ~1–2 phút, không tính giờ.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

type GameId = 'memory' | 'balloon' | 'pet' | 'fishing'
const GAMES: ReadonlyArray<{ id: GameId; picture: string; say: string; viKey: string }> = [
  { id: 'memory', picture: 'star', say: 'Match!', viKey: 'kids.games.memory' },
  { id: 'balloon', picture: 'ball', say: 'Pop!', viKey: 'kids.games.balloon' },
  { id: 'pet', picture: 'cat', say: 'Feed me!', viKey: 'kids.games.pet' },
  { id: 'fishing', picture: 'fish', say: 'Fishing!', viKey: 'kids.games.fishing' }
]

const pool = ref<GameWord[]>([])
const loaded = ref(false)
const current = ref<GameId | null>(null)
const stars = ref(0)
const foodId = ref<string | null>(null)
const finished = ref(false)

const playing = computed(() => current.value !== null && !finished.value)
useLeaveGuard(() => playing.value)

async function start(id: GameId): Promise<void> {
  speak(GAMES.find((g) => g.id === id)?.say ?? '', 'us', 0.85)
  finished.value = false
  foodId.value = null
  current.value = id
}

async function onDone(correct: number, total: number): Promise<void> {
  stars.value = starsFor(correct, total)
  finished.value = true
  // Quà đồ ăn có hạn mức mỗi ngày (do dịch vụ quyết định)
  if (stars.value >= 2) foodId.value = (await invoke('kids:reward')).foodId
  emit('changed')
  speak(stars.value >= 3 ? 'Perfect!' : stars.value >= 2 ? 'Great job!' : 'Good try!', 'us', 0.9)
}

function again(): void {
  const id = current.value
  current.value = null
  finished.value = false
  if (id) window.setTimeout(() => void start(id), 0)
}

onMounted(async () => {
  pool.value = gamePool((await invoke('kids:stickers')).stickers)
  loaded.value = true
})
</script>

<template>
  <section class="k-screen">
    <!-- Chọn game -->
    <template v-if="!current">
      <h1 class="k-title">{{ t('kids.games.title') }}</h1>
      <p v-if="!loaded" class="k-sub">{{ t('kids.loading') }}</p>
      <div v-else class="menu">
        <button
          v-for="g in GAMES"
          :key="g.id"
          type="button"
          class="k-big game"
          @click="start(g.id)"
        >
          <PictureImage :id="g.picture" :size="96" />
          <span>{{ g.say }}</span>
          <span class="vi">{{ t(g.viKey) }}</span>
        </button>
      </div>
    </template>

    <!-- Đang chơi -->
    <template v-else-if="!finished">
      <MemoryGame v-if="current === 'memory'" :pool="pool" @done="onDone" />
      <BalloonGame v-else-if="current === 'balloon'" :pool="pool" @done="onDone" />
      <PetFeedGame v-else-if="current === 'pet'" :pool="pool" @done="onDone" />
      <FishingGame v-else :pool="pool" @done="onDone" />
    </template>

    <!-- Kết quả -->
    <template v-else>
      <h1 class="k-title">
        {{ stars >= 3 ? 'Perfect!' : stars >= 2 ? 'Great job!' : 'Good try!' }}
      </h1>
      <p class="k-stars" role="img" :aria-label="t('kids.units.stars', { n: stars })">
        <UiIcon v-for="n in 3" :key="n" name="star" :size="72" :class="n <= stars ? 'on' : 'off'" />
      </p>
      <div v-if="foodId" class="gift">
        <PictureImage :id="FOOD_PICTURE[foodId] ?? 'cake'" :size="120" />
        <strong>{{ FOOD_NAME[foodId] ?? t('kids.review.present') }}</strong>
      </div>
      <div class="k-row">
        <button type="button" class="k-round" :title="t('kids.activity.again')" @click="again">
          <UiIcon name="reset" :size="30" />
        </button>
        <button type="button" class="k-primary" @click="current = null">
          <UiIcon name="play" :size="36" />
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.menu {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-6) var(--sp-5);
  width: 100%;
}
.game {
  min-height: 200px;
  font-size: 30px;
}
.vi {
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-ink-soft);
}
.k-stars .on {
  fill: currentcolor;
}
.gift {
  display: grid;
  gap: var(--sp-2);
  justify-items: center;
  padding: var(--sp-4) var(--sp-6);
  border: 4px solid var(--c-warning);
  border-radius: var(--r-lg);
  background: var(--c-warning-soft);
  box-shadow: 0 8px 0 var(--c-warning);
  font-size: 24px;
}
</style>
