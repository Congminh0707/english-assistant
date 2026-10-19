<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { StudyCard, StudyRating } from '@shared/schemas/study'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import { formatInterval } from '../format'

// Phiên ôn thẻ SRS: hiện từ → lật xem nghĩa → tự chấm Quên/Khó/Được/Dễ (phím 1–4).
const emit = defineEmits<{ exit: []; changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

const card = ref<StudyCard | null>(null)
const dueCount = ref(0)
const reviewed = ref(0)
const revealed = ref(false)
const loading = ref(true)
const busy = ref(false)
let shownAt = 0

const total = computed(() => reviewed.value + dueCount.value)
const finished = computed(() => !loading.value && !card.value)

const ratings = computed(() => [
  { value: 1 as StudyRating, label: t('study.review.again'), tone: 'again' },
  { value: 2 as StudyRating, label: t('study.review.hard'), tone: 'hard' },
  { value: 3 as StudyRating, label: t('study.review.good'), tone: 'good' },
  { value: 4 as StudyRating, label: t('study.review.easy'), tone: 'easy' }
])

async function loadNext(): Promise<void> {
  try {
    const next = await invoke('study:next')
    card.value = next.card
    dueCount.value = next.dueCount
    revealed.value = false
    shownAt = performance.now()
  } catch (err) {
    console.warn('[study] next failed', err)
    card.value = null
  } finally {
    loading.value = false
  }
}

function reveal(): void {
  if (card.value && !revealed.value) revealed.value = true
}

async function rate(rating: StudyRating): Promise<void> {
  const current = card.value
  if (!current || !revealed.value || busy.value) return
  busy.value = true
  try {
    await invoke('study:rate', {
      cardId: current.cardId,
      rating,
      elapsedMs: Math.round(performance.now() - shownAt)
    })
    reviewed.value++
    emit('changed')
    await loadNext()
  } catch (err) {
    console.warn('[study] rate failed', err)
  } finally {
    busy.value = false
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.altKey || e.metaKey) return
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (revealed.value) void rate(3)
    else reveal()
  } else if (['1', '2', '3', '4'].includes(e.key)) {
    void rate(Number(e.key) as StudyRating)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  void loadNext()
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <section class="review">
    <p v-if="loading" class="muted">…</p>

    <PxPanel v-else-if="finished" class="done">
      <h2>{{ t('study.review.doneTitle') }}</h2>
      <p>{{ t('study.review.doneBody', { n: reviewed }) }}</p>
      <button type="button" class="primary" @click="emit('exit')">
        {{ t('study.review.backHome') }}
      </button>
    </PxPanel>

    <template v-else-if="card">
      <div class="progress">
        <PxBar :value="reviewed" :max="Math.max(total, 1)" label="progress" />
        <span class="muted">{{ t('study.review.remaining', { count: dueCount }) }}</span>
      </div>

      <PxPanel class="card">
        <div class="face">
          <span v-if="card.isNew" class="tag new">{{ t('study.review.new') }}</span>
          <span class="tag level">{{ card.level.replace('_', '.') }}</span>
          <div class="lemma">{{ card.lemma }}</div>
          <div class="pron">
            <button type="button" class="say" @click="speak(card.lemma, 'us')">
              🔊 US <span v-if="card.ipaUs">{{ card.ipaUs }}</span>
            </button>
            <button type="button" class="say" @click="speak(card.lemma, 'uk')">
              🔊 UK <span v-if="card.ipaUk">{{ card.ipaUk }}</span>
            </button>
            <span class="muted pos">{{ card.pos.join(', ') }}</span>
          </div>
        </div>

        <div v-if="revealed" class="back">
          <p class="vi">
            <template v-if="card.vi.length">{{ card.vi.join('; ') }}</template>
            <span v-else class="muted">{{ t('study.review.noAnswer') }}</span>
          </p>
          <ol v-if="card.senses.length" class="senses">
            <li v-for="(s, i) in card.senses.slice(0, 3)" :key="i">
              <em>{{ s.pos }}</em> {{ s.en }}
            </li>
          </ol>
          <div v-if="card.context" class="context">
            <span class="muted">{{ t('study.review.context') }}:</span> {{ card.context }}
          </div>
          <div v-for="(ex, i) in card.examples" :key="i" class="example">
            <button type="button" class="say mini" @click="speak(ex.en, 'us')">🔊</button>
            <div>
              <div>{{ ex.en }}</div>
              <div v-if="ex.vi" class="muted">{{ ex.vi }}</div>
            </div>
          </div>
        </div>
      </PxPanel>

      <div class="actions">
        <button v-if="!revealed" type="button" class="primary big" @click="reveal">
          {{ t('study.review.show') }}
        </button>
        <div v-else class="rates">
          <button
            v-for="(r, i) in ratings"
            :key="r.value"
            type="button"
            class="rate"
            :class="r.tone"
            :disabled="busy"
            @click="rate(r.value)"
          >
            <span class="rate-label">{{ r.value }} · {{ r.label }}</span>
            <span class="rate-interval">{{ formatInterval(card.intervals[i], t) }}</span>
          </button>
        </div>
        <p class="muted hint">{{ t('study.review.hint') }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.review {
  display: grid;
  gap: 16px;
  max-width: 640px;
  margin: 0 auto;
}
.muted {
  color: var(--c-ink-soft);
}
.progress {
  display: grid;
  gap: 4px;
  font-size: 12px;
}
.card {
  display: grid;
  gap: 14px;
  padding: 22px 24px;
}
.face {
  text-align: center;
}
.tag {
  display: inline-block;
  margin: 0 3px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  border: 1px solid var(--c-border);
}
.tag.new {
  background: var(--c-success);
}
.tag.level {
  background: var(--c-xp);
}
.lemma {
  margin: 8px 0;
  font-size: 40px;
  font-weight: 700;
}
.pron {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pos {
  font-style: italic;
}
.say {
  padding: 2px 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.say:hover {
  background: #eef3ff;
}
.say.mini {
  padding: 0 4px;
  align-self: flex-start;
}
.back {
  display: grid;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px dashed var(--c-ink-soft);
}
.vi {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
}
.senses {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--c-ink-soft);
}
.senses em {
  color: var(--c-ink);
}
.context {
  padding: 6px 8px;
  font-size: 13px;
  background: #fff8dc;
  border-left: 3px solid var(--c-warning);
}
.example {
  display: flex;
  gap: 6px;
  font-size: 13px;
}
.actions {
  display: grid;
  gap: 8px;
  justify-items: center;
}
.primary {
  padding: 8px 18px;
  border: var(--px) solid var(--c-border);
  background: var(--c-primary);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.primary.big {
  min-width: 220px;
  padding: 12px 24px;
  font-size: 16px;
}
.rates {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}
.rate {
  display: grid;
  gap: 2px;
  padding: 8px 4px;
  border: var(--px) solid var(--c-border);
  color: #fff;
  font: inherit;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.rate:disabled {
  opacity: 0.6;
  cursor: default;
}
.rate:hover:not(:disabled) {
  filter: brightness(1.08);
}
.rate-label {
  font-weight: 700;
}
.rate-interval {
  font-size: 12px;
  opacity: 0.9;
}
.rate.again {
  background: var(--c-danger);
}
.rate.hard {
  background: var(--c-warning);
  color: var(--c-ink);
}
.rate.good {
  background: var(--c-success);
}
.rate.easy {
  background: var(--c-primary);
}
.hint {
  margin: 0;
  font-size: 12px;
}
.done {
  padding: 24px;
  text-align: center;
}
.done h2 {
  margin: 0 0 8px;
}
</style>
