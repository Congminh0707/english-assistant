<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { KIDS_REWARD_EVERY } from '@shared/kids'
import type { KidsCard } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import { FOOD_NAME, FOOD_PICTURE, PRAISE, pick, TRY_AGAIN } from './kidsText'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Chơi thẻ "nghe → chạm hình" (thẻ SRS hướng audio_picture): nghe từ, chạm vào hình đúng. Không có chữ để đọc, không gõ.
// Đúng ngay → thẻ lên lịch xa; đúng lần hai → ngắn hơn; hai lần sai thì chỉ hình đúng rồi ôn lại sớm.
const emit = defineEmits<{ done: []; changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

const card = ref<KidsCard | null>(null)
const loading = ref(true)
const wrong = ref<string[]>([])
const solved = ref(false)
const correctRun = ref(0)
const played = ref(0)
const newSticker = ref<string | null>(null)
const prize = ref<string | null>(null)
let shownAt = 0
let busy = false

async function load(): Promise<void> {
  const next = await invoke('kids:next')
  card.value = next.card
  wrong.value = []
  solved.value = false
  loading.value = false
  shownAt = performance.now()
  if (next.card) speak(next.card.word, 'us', 0.8)
}

async function finish(tries: 0 | 1 | 2): Promise<void> {
  const c = card.value
  if (!c) return
  const res = await invoke('kids:rate', {
    cardId: c.cardId,
    tries,
    elapsedMs: Math.round(performance.now() - shownAt)
  })
  played.value++
  emit('changed')
  if (tries > 0) {
    correctRun.value++
    if (res.stickerNew) newSticker.value = c.pictureId
    if (correctRun.value % KIDS_REWARD_EVERY === 0) {
      const reward = await invoke('kids:reward')
      prize.value = reward.foodId
      if (reward.foodId) speak(`A present! ${FOOD_NAME[reward.foodId] ?? 'food'}!`, 'us', 0.9)
    }
  }
}

async function choose(pictureId: string): Promise<void> {
  const c = card.value
  if (!c || solved.value || busy || wrong.value.includes(pictureId)) return
  busy = true
  try {
    if (pictureId === c.pictureId) {
      solved.value = true
      speak(`${pick(PRAISE)} ${c.word}`, 'us', 0.9)
      await finish(wrong.value.length === 0 ? 1 : 2)
      window.setTimeout(next, newSticker.value || prize.value ? 2600 : 1300)
    } else {
      wrong.value.push(pictureId)
      if (wrong.value.length >= 2) {
        solved.value = true
        speak(`It is ${c.word}`, 'us', 0.85)
        await finish(0)
        window.setTimeout(next, 2200)
      } else {
        speak(pick(TRY_AGAIN), 'us', 0.9)
      }
    }
  } finally {
    busy = false
  }
}

function next(): void {
  newSticker.value = null
  prize.value = null
  void load()
}

onMounted(load)
</script>

<template>
  <section class="k-screen">
    <p v-if="loading" class="k-sub">{{ t('kids.loading') }}</p>

    <template v-else-if="card">
      <div class="k-row ask">
        <button
          type="button"
          class="k-round big-speaker"
          :title="card.word"
          :aria-label="card.word"
          @click="speak(card.word, 'us', 0.8)"
        >
          <UiIcon name="volume" :size="48" />
        </button>
        <p class="k-sub">{{ t('kids.review.hint') }}</p>
      </div>
      <div class="k-row choices">
        <button
          v-for="id in card.choices"
          :key="id"
          type="button"
          class="k-big choice"
          :class="{
            right: solved && id === card.pictureId,
            wrong: wrong.includes(id)
          }"
          :disabled="solved || wrong.includes(id)"
          @click="choose(id)"
        >
          <PictureImage :id="id" :size="150" />
        </button>
      </div>
      <p v-if="solved" class="k-bubble answer">{{ card.word }}</p>

      <div v-if="newSticker" class="k-big soft pop">
        <PictureImage :id="newSticker" :size="110" />
        <strong>{{ t('kids.review.newSticker') }}</strong>
      </div>
      <div v-if="prize" class="k-big soft pop">
        <PictureImage :id="FOOD_PICTURE[prize] ?? 'cake'" :size="110" />
        <strong>{{ t('kids.review.present') }}</strong>
      </div>
    </template>

    <template v-else>
      <UiIcon
        :name="played ? 'star' : 'moon'"
        :size="140"
        class="end-icon"
        :class="{ fill: played }"
      />
      <h1 class="k-title">{{ played ? 'All done!' : 'See you later!' }}</h1>
      <p class="k-sub">{{ played ? t('kids.review.allDone') : t('kids.review.nothingNow') }}</p>
      <button type="button" class="k-primary" :aria-label="t('kids.home')" @click="emit('done')">
        <UiIcon name="home" :size="36" />
      </button>
    </template>
  </section>
</template>

<style scoped>
.ask {
  gap: var(--sp-4);
}
.big-speaker {
  width: 112px;
  height: 112px;
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.choices {
  gap: var(--sp-6);
}
.choice {
  min-width: 260px;
  min-height: 260px;
  padding: var(--sp-5);
}
.answer {
  margin: 0;
  font-size: 40px;
  color: var(--c-primary);
}
.end-icon {
  color: var(--c-warning);
}
.end-icon.fill {
  color: var(--c-coin);
  fill: currentcolor;
}
.pop {
  position: fixed;
  inset: auto 0 var(--sp-6);
  z-index: 5;
  margin: 0 auto;
  width: fit-content;
  min-width: 0;
  padding: var(--sp-3) var(--sp-6);
  font-size: 24px;
  animation: k-pop 420ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .pop {
    animation: none;
  }
}
</style>
