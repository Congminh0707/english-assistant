<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { KIDS_AGE_BANDS, KIDS_DAILY_MINUTES, KIDS_NEW_WORD_LIMITS } from '@shared/kids'
import type { ParentReport } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import PxBar from '@renderer/shared/components/PxBar.vue'
import ParentGate from '../kids/ParentGate.vue'

// Khu vực phụ huynh cho hồ sơ trẻ em: thời gian bé đã dùng và số thẻ ôn 7 ngày, tiến độ sticker/hoạt động,
// từ bé hay quên, giới hạn thời gian mỗi ngày, đổi PIN, cho dùng thêm giờ.
const { t } = useI18n()
const settingsStore = useSettingsStore()

const report = ref<ParentReport | null>(null)
const who = ref('')
const gate = ref<'set' | 'extend' | null>(null)
const message = ref('')

/** Từ bé đã biết (đã dán sticker): dùng cho số "bé đã biết N từ" và thẻ từ in được */
const known = ref<Array<{ pictureId: string; word: string; vi: string }>>([])
const printing = ref(false)

const loadFailed = ref(false)
async function load(): Promise<void> {
  loadFailed.value = false
  try {
    report.value = await invoke('parent:report')
    known.value = (await invoke('kids:stickers')).stickers.filter((s) => s.earned)
    const me = (await invoke('profile:list')).find((p) => p.active)
    who.value = me ? `${me.name} · ${t(`study.tracks.${me.track}`)}` : ''
  } catch {
    loadFailed.value = true
  }
}

const minutes = (seconds: number): number => Math.round(seconds / 60)
const maxMinutes = computed(() =>
  Math.max(10, ...(report.value?.days ?? []).map((d) => minutes(d.seconds)))
)
const todayMinutes = computed(() => minutes(report.value?.days.at(-1)?.seconds ?? 0))

async function setNewLimit(value: number): Promise<void> {
  await settingsStore.set('kids.newPerDay', value as never)
}

async function setAgeBand(value: string): Promise<void> {
  await settingsStore.set('kids.ageBand', value as never)
}

async function setLimit(value: number): Promise<void> {
  await settingsStore.set('kids.dailyMinutes', value as never)
  await load()
}

function gateDone(): void {
  const mode = gate.value
  gate.value = null
  message.value = mode === 'extend' ? t('kids.report.extended') : t('kids.report.pinSaved')
  void load()
}

async function printCards(): Promise<void> {
  if (!known.value.length) return
  printing.value = true
  document.body.classList.add('printing-cards')
  await nextTick()
  window.print()
}

function afterPrint(): void {
  printing.value = false
  document.body.classList.remove('printing-cards')
}

onMounted(() => {
  window.addEventListener('afterprint', afterPrint)
  void load()
})
onBeforeUnmount(() => {
  window.removeEventListener('afterprint', afterPrint)
  afterPrint()
})
</script>

<template>
  <section class="report">
    <header class="head">
      <h1 class="page-title">{{ t('kids.report.title') }}</h1>
      <span v-if="who" class="chip chip--primary">{{ who }}</span>
    </header>

    <div v-if="loadFailed" class="card state state--error" role="alert">
      <p>{{ t('study.state.error') }}</p>
      <button type="button" class="btn btn--sm" @click="load">{{ t('study.state.retry') }}</button>
    </div>
    <div
      v-else-if="!report"
      class="card skeleton"
      aria-busy="true"
      :aria-label="t('study.state.loading')"
    />

    <div v-if="report" class="cols">
      <div class="col">
        <section class="card block known">
          <div>
            <h2>{{ t('kids.report.known', { n: known.length }) }}</h2>
            <p class="muted small">{{ t('kids.report.knownHint') }}</p>
          </div>
          <div class="print-box">
            <button type="button" class="btn btn--sm" :disabled="!known.length" @click="printCards">
              {{ t('kids.report.print') }}
            </button>
            <p class="muted small">
              {{ known.length ? t('kids.report.printHint') : t('kids.report.printEmpty') }}
            </p>
          </div>
        </section>

        <section class="card block">
          <div class="block-head">
            <h2>{{ t('kids.report.usage') }}</h2>
            <span class="muted">
              {{ t('kids.report.today', { n: todayMinutes }) }}
              <template v-if="report.dailyLimitMinutes">
                · {{ t('kids.report.limit', { n: report.dailyLimitMinutes }) }}
              </template>
            </span>
          </div>
          <div class="bars">
            <div
              v-for="d in report.days"
              :key="d.day"
              class="bar-col"
              :title="`${d.day}: ${minutes(d.seconds)} / ${d.reviews}`"
            >
              <div class="bar-value">{{ minutes(d.seconds) || '' }}</div>
              <div
                class="bar"
                :style="{ height: `${Math.max(2, (minutes(d.seconds) / maxMinutes) * 180)}px` }"
              />
              <div class="bar-day">{{ d.day.slice(8) }}</div>
            </div>
          </div>
          <p class="muted small">{{ t('kids.report.usageHint') }}</p>
        </section>

        <div class="two">
          <section class="card block">
            <h2>{{ t('kids.report.stickers') }}</h2>
            <PxBar
              :value="report.stickersEarned"
              :max="Math.max(1, report.stickersTotal)"
              label="stickers"
            />
            <p class="muted">{{ report.stickersEarned }} / {{ report.stickersTotal }}</p>
          </section>
          <section class="card block">
            <h2>{{ t('kids.report.activities') }}</h2>
            <PxBar
              :value="report.activitiesDone"
              :max="Math.max(1, report.activitiesTotal)"
              label="activities"
            />
            <p class="muted">{{ report.activitiesDone }} / {{ report.activitiesTotal }}</p>
          </section>
        </div>
      </div>

      <div class="col">
        <section class="card block">
          <h2>{{ t('kids.report.weekWord') }}</h2>
          <p class="week">
            <PictureImage :id="report.weekWord.pictureId" :size="72" />
            <span>
              <strong>{{ report.weekWord.word }}</strong>
              <span class="muted"> · {{ report.weekWord.vi }}</span>
            </span>
          </p>
          <h3 class="ask-title">{{ t('kids.report.askTitle') }}</h3>
          <ul class="ask">
            <li v-for="k in 3" :key="k">
              {{ t(`kids.report.ask${k}`, { word: report.weekWord.word, vi: report.weekWord.vi }) }}
            </li>
          </ul>
        </section>

        <section class="card block">
          <h2>{{ t('kids.report.hardest') }}</h2>
          <p v-if="!report.hardest.length" class="muted">{{ t('kids.report.noHardest') }}</p>
          <ul v-else class="hard">
            <li v-for="h in report.hardest" :key="h.word">
              <strong>{{ h.word }}</strong> <span class="muted">{{ h.vi }}</span>
              <span class="muted small">{{ t('kids.report.forgot', { n: h.lapses }) }}</span>
            </li>
          </ul>
        </section>

        <section class="card block">
          <h2>{{ t('kids.report.controls') }}</h2>
          <label class="row">
            {{ t('kids.report.dailyLimit') }}
            <select
              :value="settingsStore.settings['kids.dailyMinutes']"
              @change="setLimit(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="m in KIDS_DAILY_MINUTES" :key="m" :value="m">
                {{ m ? t('kids.report.limitMinutes', { n: m }) : t('kids.report.limitOff') }}
              </option>
            </select>
          </label>
          <label class="row">
            {{ t('kids.report.ageBand') }}
            <select
              :value="settingsStore.settings['kids.ageBand']"
              @change="setAgeBand(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="b in KIDS_AGE_BANDS" :key="b" :value="b">
                {{ t('kids.report.age', { range: b }) }}
              </option>
            </select>
          </label>
          <p class="muted small">
            {{ t(`kids.report.ageHint.${settingsStore.settings['kids.ageBand']}`) }}
          </p>
          <label class="row">
            {{ t('kids.report.newPerDay') }}
            <select
              :value="settingsStore.settings['kids.newPerDay']"
              @change="setNewLimit(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="n in KIDS_NEW_WORD_LIMITS" :key="n" :value="n">
                {{ n ? t('kids.report.newWords', { n }) : t('kids.report.limitOff') }}
              </option>
            </select>
          </label>
          <div class="stack-btns">
            <button type="button" class="btn btn--primary btn--block" @click="gate = 'extend'">
              {{ t('kids.report.extend') }}
            </button>
            <button type="button" class="btn btn--block" @click="gate = 'set'">
              {{ t('kids.report.changePin') }}
            </button>
          </div>
          <p v-if="message" class="ok">{{ message }}</p>
        </section>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="printing" class="print-sheet">
        <div v-for="w in known" :key="w.pictureId" class="print-card">
          <PictureImage :id="w.pictureId" :size="160" />
          <strong>{{ w.word }}</strong>
          <span>{{ w.vi }}</span>
        </div>
      </div>
    </Teleport>

    <ParentGate
      v-if="gate"
      :mode="gate"
      :changing="gate === 'set'"
      @ok="gateDone"
      @close="gate = null"
    />
  </section>
</template>

<style scoped>
.report {
  display: grid;
  gap: var(--sp-4);
  max-width: 100%;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: var(--sp-4);
  align-items: start;
}
.col {
  display: grid;
  gap: var(--sp-4);
  min-width: 0;
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}
.block-head h2 {
  margin: 0 0 var(--sp-2);
}
.stack-btns {
  display: grid;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}
.hard {
  list-style: none;
  padding-left: 0;
}
.hard li {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
  border-top: 1px solid var(--c-line);
}
.hard li .small {
  margin-left: auto;
}
@media (max-width: 900px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
.report .page-title {
  margin: 0;
}
h2 {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-lg);
  color: var(--c-ink);
}
.block {
  padding: var(--sp-4);
}
.muted {
  margin: var(--sp-1) 0;
  color: var(--c-ink-soft);
}
.small {
  font-size: var(--fs-xs);
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: var(--sp-2);
  height: 230px;
  border-bottom: 1px solid var(--c-line);
}
.bar-col {
  display: grid;
  flex: 1;
  gap: 2px;
  justify-items: center;
  align-content: end;
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
}
.bar {
  width: 70%;
  max-width: 30px;
  border-radius: var(--r-sm) var(--r-sm) 0 0;
  background: var(--c-primary);
}
.bar-day {
  color: var(--c-ink-soft);
}
.hard {
  display: grid;
  gap: var(--sp-1);
  margin: 0;
  padding-left: var(--sp-5);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-1) 0;
}
.ok {
  margin: var(--sp-1) 0 0;
  color: var(--c-success);
  font-weight: 600;
}
.state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.state p {
  margin: 0;
}
.state--error {
  border-color: var(--c-danger);
  border-radius: var(--r-lg);
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.skeleton {
  min-height: 160px;
  border-radius: var(--r-lg);
  background: linear-gradient(90deg, var(--c-surface-2), var(--c-surface), var(--c-surface-2));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
.known {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
}
.print-box {
  display: grid;
  gap: var(--sp-1);
  justify-items: end;
  text-align: right;
}
.week {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-lg);
}
.ask-title {
  margin: 0 0 var(--sp-1);
  font-size: var(--fs-md);
}
.ask {
  display: grid;
  gap: var(--sp-1);
  margin: 0;
  padding-left: var(--sp-5);
}
</style>

<!-- Thẻ in: chỉ hiện khi in; ẩn toàn bộ giao diện app -->
<style>
.print-sheet {
  display: none;
}
@media print {
  body.printing-cards #app {
    display: none;
  }
  body.printing-cards .print-sheet {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 12px;
  }
  .print-card {
    display: grid;
    gap: 4px;
    justify-items: center;
    padding: 16px;
    border: 2px dashed gray;
    border-radius: 12px;
    color: black;
    text-align: center;
    break-inside: avoid;
  }
  .print-card strong {
    font-size: 28px;
  }
}
</style>
