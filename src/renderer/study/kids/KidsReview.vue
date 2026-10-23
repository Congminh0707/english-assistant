<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { KIDS_REWARD_EVERY } from '@shared/kids'
import type { KidsCard } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
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
    <p v-if="loading" class="k-sub">…</p>

    <template v-else-if="card">
      <button
        type="button"
        class="k-round big-speaker"
        :title="card.word"
        @click="speak(card.word, 'us', 0.8)"
      >
        <UiIcon name="volume" />
      </button>
      <p class="k-sub">{{ t('kids.review.hint') }}</p>
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
          <PixelPicture :id="id" :size="160" />
        </button>
      </div>
      <p v-if="solved" class="answer">{{ card.word }}</p>

      <div v-if="newSticker" class="pop">
        <PixelPicture :id="newSticker" :size="110" />
        <strong>{{ t('kids.review.newSticker') }}</strong>
      </div>
      <div v-if="prize" class="pop">
        <PixelPicture :id="FOOD_PICTURE[prize] ?? 'cake'" :size="110" />
        <strong>{{ t('kids.review.present') }}</strong>
      </div>
    </template>

    <template v-else>
      <PixelPicture :id="played ? 'star' : 'moon'" :size="170" />
      <h1 class="k-title">{{ played ? 'All done!' : 'See you later!' }}</h1>
      <p class="k-sub">{{ played ? t('kids.review.allDone') : t('kids.review.nothingNow') }}</p>
      <button type="button" class="k-primary" @click="emit('done')"><UiIcon name="home" /></button>
    </template>
  </section>
</template>

<style scoped>
.big-speaker {
  width: 96px;
  height: 96px;
  font-size: 46px;
  background: #fff3a0;
}
.choices {
  gap: 24px;
}
.choice {
  padding: 14px;
}
.answer {
  margin: 0;
  font-size: 38px;
  font-weight: 800;
  color: var(--c-primary);
}
.pop {
  position: fixed;
  inset: auto 0 36px;
  display: grid;
  gap: 6px;
  justify-items: center;
  margin: 0 auto;
  width: fit-content;
  padding: 14px 28px;
  border: 2px solid var(--c-line);
  border-radius: 18px;
  background: var(--c-warning-soft);
  box-shadow: 0 8px 0 0 #d3d9e8;
  font-size: 24px;
  animation: k-pop 420ms ease;
}
</style>
