<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Stats, StatsDay } from '@shared/schemas/stats'
import { ACHIEVEMENT_GROUPS } from '@shared/achievements'
import { activityLevel, activityScore, weekdayIndex } from '@shared/stats'
import { invoke } from '@renderer/shared/ipc'
import PixelBadge from '@renderer/shared/components/PixelBadge.vue'
import PxBar from '@renderer/shared/components/PxBar.vue'
import {
  Award,
  CalendarDays,
  CircleCheck,
  Flame,
  Sprout,
  Target,
  Timer,
  TrendingUp
} from 'lucide-vue-next'

// Thống kê: streak, lịch hoạt động 16 tuần, 14 ngày gần nhất, thẻ theo trạng thái, từ theo level.
const emit = defineEmits<{ checkpoint: [] }>()
const { t } = useI18n()
const stats = ref<Stats | null>(null)
async function load(): Promise<void> {
  stats.value = await invoke('study:stats')
}

/** Ô lịch: bắt đầu từ Thứ Hai; chèn ô trống đầu tiên để cột đầu đúng thứ */
const cells = computed(() => {
  const days = stats.value?.days ?? []
  const lead = days.length ? weekdayIndex(days[0].day) : 0
  return [
    ...Array.from({ length: lead }, () => null),
    ...days.map((d) => ({ ...d, level: activityLevel(activityScore(d)) }))
  ]
})

const last14 = computed(() => (stats.value?.days ?? []).slice(-14))
const maxMinutes = computed(() => Math.max(10, ...last14.value.map((d) => d.minutes)))
const maxReviews = computed(() => Math.max(1, ...last14.value.map((d) => d.reviews)))

const cellTitle = (d: StatsDay): string =>
  t('study.stats.cellTitle', {
    day: d.day,
    reviews: d.reviews,
    saved: d.saved,
    practice: d.practice
  })

const pct = (a: { correct: number; total: number }): number =>
  a.total ? Math.round((a.correct / a.total) * 100) : 0
const hours = (minutes: number): string => (minutes / 60).toFixed(1)
const kindLabel = (group: string, kind: string): string =>
  t(group === 'review' ? `study.stats.reviewKind.${kind}` : `study.stats.kind.${kind}`)

const percent = (value: number | null): string =>
  value === null ? '—' : `${Math.round(value * 100)}%`

function delta(now: number, prev: number): string {
  const diff = now - prev
  return diff === 0 ? '=' : diff > 0 ? `▲ ${diff}` : `▼ ${-diff}`
}

const stateBars = computed(() => {
  const s = stats.value?.cardStates
  if (!s) return []
  const total = s.new + s.learning + s.review + s.relearning
  return (['new', 'learning', 'review', 'relearning'] as const).map((key) => ({
    key,
    count: s[key],
    width: total ? (s[key] / total) * 100 : 0
  }))
})
const maxLevelCount = computed(() =>
  Math.max(1, ...(stats.value?.levels ?? []).map((l) => l.count))
)

const achievementGroups = computed(() => {
  const list = stats.value?.achievements ?? []
  return ACHIEVEMENT_GROUPS.map((group) => ({
    group,
    items: list.filter((a) => a.group === group)
  })).filter((g) => g.items.length)
})
const unlockedCount = computed(
  () => stats.value?.achievements.filter((a) => a.unlocked).length ?? 0
)

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]
/** Số cột (tuần) của lịch, để các ô trải đủ chiều ngang thay vì cuộn */
const weekCount = computed(() => Math.max(1, Math.ceil(cells.value.length / 7)))

onMounted(load)
</script>

<template>
  <section class="stats">
    <h1 class="page-title">{{ t('study.stats.title') }}</h1>

    <template v-if="stats">
      <div class="cards">
        <div class="card kpi">
          <span class="kpi-icon warm"><Flame :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ stats.totals.streak }}</div>
            <div class="label">{{ t('study.stats.streak') }}</div>
          </div>
        </div>
        <div class="card kpi">
          <span class="kpi-icon warm"><Award :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ stats.totals.longestStreak }}</div>
            <div class="label">{{ t('study.stats.longest') }}</div>
          </div>
        </div>
        <div class="card kpi">
          <span class="kpi-icon cool"><Target :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ stats.totals.reviews }}</div>
            <div class="label">{{ t('study.stats.reviews') }}</div>
          </div>
        </div>
        <div class="card kpi">
          <span class="kpi-icon ok"><CircleCheck :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ percent(stats.totals.retention) }}</div>
            <div class="label">{{ t('study.stats.retention') }}</div>
          </div>
        </div>
        <div class="card kpi">
          <span class="kpi-icon ok"><Sprout :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ stats.totals.savedWords }}</div>
            <div class="label">{{ t('study.stats.savedWords') }}</div>
          </div>
        </div>
        <div class="card kpi">
          <span class="kpi-icon violet"><TrendingUp :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ stats.totals.xp }}</div>
            <div class="label">XP</div>
          </div>
        </div>
        <div class="card kpi">
          <span class="kpi-icon cool"><CalendarDays :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ stats.totals.activeDays }}</div>
            <div class="label">{{ t('study.stats.activeDays') }}</div>
          </div>
        </div>
        <div class="card kpi">
          <span class="kpi-icon violet"><Timer :size="18" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ stats.totals.practiceSessions }}</div>
            <div class="label">{{ t('study.stats.practice') }}</div>
          </div>
        </div>
      </div>

      <section class="card block">
        <h2>{{ t('study.stats.week') }}</h2>
        <div class="week">
          <div>
            <strong>{{ stats.week.reviews }}</strong> {{ t('study.stats.reviewsUnit') }}
            <span class="delta">{{ delta(stats.week.reviews, stats.week.prevReviews) }}</span>
          </div>
          <div>
            <strong>{{ stats.week.saved }}</strong> {{ t('study.stats.savedUnit') }}
            <span class="delta">{{ delta(stats.week.saved, stats.week.prevSaved) }}</span>
          </div>
          <div>
            <strong>{{ stats.week.xp }}</strong> XP
            <span class="delta">{{ delta(stats.week.xp, stats.week.prevXp) }}</span>
          </div>
        </div>
        <p class="muted small">{{ t('study.stats.vsLastWeek') }}</p>
      </section>

      <section class="card block">
        <h2>{{ t('study.stats.calendar') }}</h2>
        <div class="calendar">
          <div class="weekdays" aria-hidden="true">
            <span v-for="w in WEEKDAYS" :key="w">{{
              w % 2 === 0 ? t(`study.stats.weekday.${w}`) : ''
            }}</span>
          </div>
          <div
            class="grid"
            :style="{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }"
          >
            <template v-for="(cell, i) in cells" :key="i">
              <span v-if="cell === null" class="cell empty" />
              <span v-else class="cell" :class="`l${cell.level}`" :title="cellTitle(cell)" />
            </template>
          </div>
        </div>
        <div class="legend">
          {{ t('study.stats.less') }}
          <span v-for="l in 5" :key="l" class="cell lg" :class="`l${l - 1}`" />
          {{ t('study.stats.more') }}
        </div>
      </section>

      <section class="card block">
        <h2>{{ t('study.stats.last14') }}</h2>
        <div class="bars">
          <div v-for="d in last14" :key="d.day" class="bar-col" :title="cellTitle(d)">
            <div class="bar-value">{{ d.reviews || '' }}</div>
            <div
              class="bar"
              :style="{ height: `${Math.max(2, (d.reviews / maxReviews) * 90)}px` }"
            />
            <div class="bar-day">{{ d.day.slice(8) }}</div>
          </div>
        </div>
      </section>

      <div class="two">
        <section class="card block">
          <h2>{{ t('study.stats.cardStates') }}</h2>
          <div v-if="stateBars.some((s) => s.count)" class="stack">
            <span
              v-for="s in stateBars"
              :key="s.key"
              class="seg"
              :class="s.key"
              :style="{ width: `${s.width}%` }"
              :title="`${t(`study.stats.state.${s.key}`)}: ${s.count}`"
            />
          </div>
          <ul class="legend-list">
            <li v-for="s in stateBars" :key="s.key">
              <span class="dot" :class="s.key" /> {{ t(`study.stats.state.${s.key}`) }}:
              <strong>{{ s.count }}</strong>
            </li>
          </ul>
        </section>

        <section class="card block">
          <h2>{{ t('study.stats.levels') }}</h2>
          <p v-if="!stats.levels.length" class="muted">{{ t('study.stats.noWords') }}</p>
          <div v-for="l in stats.levels" :key="l.level" class="level-row">
            <span class="level-name">{{ l.level.replace('_', '.') }}</span>
            <span class="level-bar" :style="{ width: `${(l.count / maxLevelCount) * 100}%` }" />
            <span class="level-count">{{ l.count }}</span>
          </div>
        </section>
      </div>

      <section class="card block">
        <h2>{{ t('study.stats.skills') }}</h2>
        <ul class="skill-levels">
          <li v-for="s in stats.skills" :key="s.skill" class="skill">
            <strong>{{ t(`study.stats.skill.${s.skill}`) }}</strong>
            <span class="chip chip--primary">{{ s.level.replace('_', '.') }}</span>
            <span class="muted small"
              >{{ s.rating }} · {{ t('study.stats.games', { n: s.games }) }}</span
            >
            <button
              v-if="s.reliable && s.ahead >= 1"
              type="button"
              class="btn btn--sm up"
              :title="t('study.stats.readyHint')"
              @click="emit('checkpoint')"
            >
              ▲ {{ t('study.stats.ready') }}
            </button>
          </li>
        </ul>
        <p class="muted small">{{ t('study.stats.skillsHint') }}</p>
      </section>

      <section class="card block">
        <h2>{{ t('study.stats.accuracy') }}</h2>
        <p v-if="!stats.accuracy.length" class="muted">{{ t('study.stats.noAccuracy') }}</p>
        <div v-for="a in stats.accuracy" :key="`${a.group}-${a.kind}-${a.skill}`" class="acc-row">
          <span class="acc-name">{{ kindLabel(a.group, a.kind) }}</span>
          <span class="acc-bar"
            ><span
              :style="{ width: `${pct(a)}%` }"
              :class="{ low: pct(a) < 60, mid: pct(a) >= 60 && pct(a) < 80 }"
          /></span>
          <span class="acc-num"
            >{{ pct(a) }}% <small class="muted">({{ a.correct }}/{{ a.total }})</small></span
          >
        </div>
        <p class="muted small">{{ t('study.stats.accuracyHint') }}</p>
      </section>

      <section class="card block">
        <h2>{{ t('study.stats.time') }}</h2>
        <div class="week">
          <div>
            <strong>{{ stats.time.todayMinutes }}</strong> {{ t('study.stats.minToday') }}
          </div>
          <div>
            <strong>{{ stats.time.weekMinutes }}</strong> {{ t('study.stats.minWeek') }}
          </div>
          <div>
            <strong>{{ hours(stats.time.totalMinutes) }}</strong> {{ t('study.stats.hoursTotal') }}
          </div>
        </div>
        <div class="bars">
          <div
            v-for="d in last14"
            :key="d.day"
            class="bar-col"
            :title="`${d.day}: ${d.minutes} ${t('study.stats.min')}`"
          >
            <div class="bar-value">{{ d.minutes || '' }}</div>
            <div
              class="bar time"
              :style="{ height: `${Math.max(2, (d.minutes / maxMinutes) * 90)}px` }"
            />
            <div class="bar-day">{{ d.day.slice(8) }}</div>
          </div>
        </div>
        <p class="muted small">{{ t('study.stats.timeHint') }}</p>
      </section>

      <section class="card block">
        <h2>{{ t('study.stats.achievements') }}</h2>
        <p class="muted small">
          {{
            t('study.stats.achProgress', { done: unlockedCount, total: stats.achievements.length })
          }}
        </p>
        <section v-for="g in achievementGroups" :key="g.group" class="ach-group">
          <h3>{{ t(`study.stats.achGroup.${g.group}`) }}</h3>
          <div class="ach-grid">
            <div
              v-for="a in g.items"
              :key="a.id"
              class="ach"
              :class="{ locked: !a.unlocked }"
              :title="t(`study.stats.achDesc.${a.group}`, { n: a.target })"
            >
              <PixelBadge :glyph="a.glyph" :tier="a.tier" :locked="!a.unlocked" />
              <strong>{{ a.unlocked ? t(`study.stats.ach.${a.id}`) : '???' }}</strong>
              <span class="ach-desc muted small">{{
                t(`study.stats.achDesc.${a.group}`, { n: a.target })
              }}</span>
              <PxBar
                v-if="!a.unlocked"
                class="ach-bar"
                :value="a.current"
                :max="a.target"
                color="var(--c-primary)"
              />
              <span class="muted small">{{ a.current }}/{{ a.target }}</span>
            </div>
          </div>
        </section>
      </section>

      <section class="card block">
        <h2>{{ t('study.stats.hardest') }}</h2>
        <p v-if="!stats.hardest.length" class="muted">{{ t('study.stats.noHardest') }}</p>
        <ol v-else class="hardest">
          <li v-for="w in stats.hardest" :key="w.contentId">
            <strong>{{ w.text }}</strong>
            <span class="muted small">{{
              t('study.stats.lapses', { n: w.lapses, reps: w.reps })
            }}</span>
          </li>
        </ol>
      </section>
    </template>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  gap: var(--sp-3);
  max-width: 880px;
}
.stats .page-title {
  margin-bottom: var(--sp-1);
}
h2 {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-lg);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
}
.small {
  font-size: var(--fs-xs);
}
.block {
  padding: var(--sp-4) var(--sp-5);
}

/* ---- KPI ---- */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: var(--sp-3);
}
.kpi {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
}
.kpi-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
}
.kpi-icon.warm {
  background: var(--c-warning-soft);
  color: #e08a00;
}
.kpi-icon.ok {
  background: var(--c-success-soft);
  color: var(--c-success);
}
.kpi-icon.cool {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.kpi-icon.violet {
  background: var(--c-xp-soft);
  color: var(--c-xp);
}
.num {
  font-size: var(--fs-xl);
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.label {
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
}
.week {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) 32px;
  margin-bottom: var(--sp-2);
}
.week strong {
  font-size: var(--fs-xl);
}
.delta {
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--c-ink-soft);
}

/* ---- Lịch hoạt động: ô vuông trải đủ chiều ngang, không thanh cuộn ---- */
.calendar {
  display: flex;
  gap: var(--sp-2);
}
.weekdays {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: 4px;
  flex: none;
  font-size: 10px;
  color: var(--c-ink-soft);
}
.weekdays span {
  display: flex;
  align-items: center;
}
.grid {
  display: grid;
  flex: 1;
  grid-template-rows: repeat(7, auto);
  grid-auto-flow: column;
  gap: 4px;
  min-width: 0;
}
.cell {
  display: block;
  aspect-ratio: 1;
  min-width: 0;
  border-radius: 4px;
  background: var(--c-surface-2);
}
.cell.empty {
  background: transparent;
}
.cell.l1 {
  background: color-mix(in srgb, var(--c-success) 28%, var(--c-surface-2));
}
.cell.l2 {
  background: color-mix(in srgb, var(--c-success) 52%, var(--c-surface-2));
}
.cell.l3 {
  background: color-mix(in srgb, var(--c-success) 78%, var(--c-surface-2));
}
.cell.l4 {
  background: var(--c-success);
}
.cell:not(.empty):hover {
  outline: 2px solid var(--c-ink);
  outline-offset: 1px;
}
.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: var(--sp-3);
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
}
.cell.lg {
  display: inline-block;
  width: 14px;
  height: 14px;
  aspect-ratio: auto;
}

/* ---- Cột ---- */
.bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 150px;
  padding-bottom: 1px;
  border-bottom: 1px solid var(--c-line);
}
.bar-col {
  flex: 1;
  display: grid;
  justify-items: center;
  align-content: end;
  gap: 2px;
}
.bar {
  width: 100%;
  max-width: 30px;
  border-radius: 6px 6px 0 0;
  background: var(--c-primary);
  transition: filter 120ms ease;
}
.bar-col:hover .bar {
  filter: brightness(1.1);
}
.bar.time {
  background: var(--c-warning);
}
.bar-value {
  min-height: 14px;
  font-size: var(--fs-xs);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.bar-day {
  margin-top: 4px;
  font-size: 10px;
  color: var(--c-ink-soft);
}
.bars + .bars,
.week + .bars {
  margin-top: var(--sp-2);
}
/* ---- Hai cột ---- */
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.stack {
  display: flex;
  height: 14px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
}
.seg.new,
.dot.new {
  background: var(--c-surface-2);
}
.seg.learning,
.dot.learning {
  background: var(--c-warning);
}
.seg.review,
.dot.review {
  background: var(--c-success);
}
.seg.relearning,
.dot.relearning {
  background: var(--c-danger);
}
.legend-list {
  display: grid;
  gap: 6px;
  margin: var(--sp-3) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--fs-sm);
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  border-radius: 3px;
}
.level-row {
  display: grid;
  grid-template-columns: 44px 1fr 34px;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: 6px;
  font-size: var(--fs-xs);
}
.level-name {
  font-weight: 700;
}
.level-bar {
  height: 10px;
  border-radius: var(--r-pill);
  background: var(--c-xp);
}
.level-count {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ---- Kỹ năng, độ chính xác ---- */
.skill-levels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-5);
  margin: 0 0 var(--sp-2);
  padding: 0;
  list-style: none;
}
.skill {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.acc-row {
  display: grid;
  grid-template-columns: 160px 1fr 112px;
  align-items: center;
  gap: var(--sp-3);
  margin: 6px 0;
  font-size: var(--fs-sm);
}
.acc-bar {
  height: 8px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
}
.acc-bar span {
  display: block;
  height: 100%;
  border-radius: var(--r-pill);
  background: var(--c-success);
}
.acc-bar span.mid {
  background: var(--c-warning);
}
.acc-bar span.low {
  background: var(--c-danger);
}
.acc-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ---- Thành tựu ---- */
.ach-group + .ach-group {
  margin-top: var(--sp-4);
}
.ach-group h3 {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--c-ink-soft);
}
.ach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--sp-2);
}
.ach {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--sp-3) var(--sp-2);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
  background: var(--c-surface);
  text-align: center;
  font-size: var(--fs-sm);
}
.ach.locked {
  background: var(--c-surface-2);
}
.ach.locked strong {
  color: var(--c-ink-soft);
}
.ach-desc {
  min-height: 2.6em;
}
.ach-bar {
  width: 80%;
}
.hardest {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 22px;
}
.hardest .small {
  margin-left: var(--sp-2);
}
@media (max-width: 760px) {
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
