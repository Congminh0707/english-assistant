<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Stats, StatsDay } from '@shared/schemas/stats'
import { ACHIEVEMENT_GROUPS } from '@shared/achievements'
import { activityLevel, activityScore, weekdayIndex } from '@shared/stats'
import { invoke } from '@renderer/shared/ipc'
import { cefrLabel } from '@shared/placement'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import PixelBadge from '@renderer/shared/components/PixelBadge.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

// Thống kê: streak, lịch hoạt động 16 tuần, 14 ngày gần nhất, thẻ theo trạng thái, từ theo level.
const { t } = useI18n()
const stats = ref<Stats | null>(null)
const settingsStore = useSettingsStore()
/** Trình độ theo kỹ năng (cập nhật sau mỗi lần làm bài kiểm tra đầu vào) */
const skillLevels = computed(() =>
  (
    [
      ['vocab', settingsStore.settings['learning.levelVocab']],
      ['grammar', settingsStore.settings['learning.levelGrammar']],
      ['reading', settingsStore.settings['learning.levelReading']]
    ] as const
  ).map(([skill, level]) => ({ skill, cefr: cefrLabel(level), level: level.replace('_', '.') }))
)

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
const maxReviews = computed(() => Math.max(1, ...last14.value.map((d) => d.reviews)))

const cellTitle = (d: StatsDay): string =>
  t('study.stats.cellTitle', {
    day: d.day,
    reviews: d.reviews,
    saved: d.saved,
    practice: d.practice
  })

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

onMounted(load)
</script>

<template>
  <section class="stats">
    <h1>{{ t('study.stats.title') }}</h1>

    <template v-if="stats">
      <div class="cards">
        <PxPanel class="card">
          <div class="num">🔥 {{ stats.totals.streak }}</div>
          <div class="label">{{ t('study.stats.streak') }}</div>
        </PxPanel>
        <PxPanel class="card">
          <div class="num">🏆 {{ stats.totals.longestStreak }}</div>
          <div class="label">{{ t('study.stats.longest') }}</div>
        </PxPanel>
        <PxPanel class="card">
          <div class="num">{{ stats.totals.reviews }}</div>
          <div class="label">{{ t('study.stats.reviews') }}</div>
        </PxPanel>
        <PxPanel class="card">
          <div class="num">{{ percent(stats.totals.retention) }}</div>
          <div class="label">{{ t('study.stats.retention') }}</div>
        </PxPanel>
        <PxPanel class="card">
          <div class="num">{{ stats.totals.savedWords }}</div>
          <div class="label">{{ t('study.stats.savedWords') }}</div>
        </PxPanel>
        <PxPanel class="card">
          <div class="num">{{ stats.totals.xp }}</div>
          <div class="label">XP</div>
        </PxPanel>
        <PxPanel class="card">
          <div class="num">{{ stats.totals.activeDays }}</div>
          <div class="label">{{ t('study.stats.activeDays') }}</div>
        </PxPanel>
        <PxPanel class="card">
          <div class="num">{{ stats.totals.practiceSessions }}</div>
          <div class="label">{{ t('study.stats.practice') }}</div>
        </PxPanel>
      </div>

      <PxPanel class="block">
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
      </PxPanel>

      <PxPanel class="block">
        <h2>{{ t('study.stats.calendar') }}</h2>
        <div class="calendar">
          <div class="weekdays" aria-hidden="true">
            <span v-for="w in WEEKDAYS" :key="w">{{
              w % 2 === 0 ? t(`study.stats.weekday.${w}`) : ''
            }}</span>
          </div>
          <div class="grid">
            <template v-for="(cell, i) in cells" :key="i">
              <span v-if="cell === null" class="cell empty" />
              <span v-else class="cell" :class="`l${cell.level}`" :title="cellTitle(cell)" />
            </template>
          </div>
        </div>
        <div class="legend">
          {{ t('study.stats.less') }}
          <span v-for="l in 5" :key="l" class="cell" :class="`l${l - 1}`" />
          {{ t('study.stats.more') }}
        </div>
      </PxPanel>

      <PxPanel class="block">
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
      </PxPanel>

      <div class="two">
        <PxPanel class="block">
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
        </PxPanel>

        <PxPanel class="block">
          <h2>{{ t('study.stats.levels') }}</h2>
          <p v-if="!stats.levels.length" class="muted">{{ t('study.stats.noWords') }}</p>
          <div v-for="l in stats.levels" :key="l.level" class="level-row">
            <span class="level-name">{{ l.level.replace('_', '.') }}</span>
            <span class="level-bar" :style="{ width: `${(l.count / maxLevelCount) * 100}%` }" />
            <span class="level-count">{{ l.count }}</span>
          </div>
        </PxPanel>
      </div>

      <PxPanel class="block">
        <h2>{{ t('study.stats.skills') }}</h2>
        <ul class="skill-levels">
          <li v-for="s in skillLevels" :key="s.skill">
            <strong>{{ t(`study.placement.skill.${s.skill}`) }}</strong>
            <span class="skill-tag">{{ s.level }}</span>
          </li>
        </ul>
        <p class="muted small">{{ t('study.stats.skillsHint') }}</p>
      </PxPanel>

      <PxPanel class="block">
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
              <progress v-if="!a.unlocked" class="ach-bar" :value="a.current" :max="a.target" />
              <span class="muted small">{{ a.current }}/{{ a.target }}</span>
            </div>
          </div>
        </section>
      </PxPanel>

      <PxPanel class="block">
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
      </PxPanel>
    </template>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  gap: 14px;
  max-width: 760px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: 22px;
}
h2 {
  margin: 0 0 8px;
  font-size: 15px;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
}
.small {
  font-size: 12px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.card {
  padding: 12px 8px;
  text-align: center;
}
.num {
  font-size: 22px;
  font-weight: 700;
}
.label {
  font-size: 12px;
  color: var(--c-ink-soft);
}
.block {
  padding: 14px 16px;
}
.week {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
}
.delta {
  margin-left: 6px;
  font-size: 12px;
  color: var(--c-ink-soft);
}
.calendar {
  display: flex;
  gap: 6px;
}
.weekdays {
  display: grid;
  grid-template-rows: repeat(7, 14px);
  gap: 3px;
  font-size: 10px;
  line-height: 14px;
  color: var(--c-ink-soft);
}
.grid {
  display: grid;
  grid-template-rows: repeat(7, 14px);
  grid-auto-flow: column;
  grid-auto-columns: 14px;
  gap: 3px;
  overflow-x: auto;
}
.cell {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(43, 43, 58, 0.15);
  background: #ebe6d3;
}
.cell.empty {
  border-color: transparent;
  background: transparent;
}
.cell.l1 {
  background: color-mix(in srgb, var(--c-success) 30%, #ebe6d3);
}
.cell.l2 {
  background: color-mix(in srgb, var(--c-success) 55%, #ebe6d3);
}
.cell.l3 {
  background: color-mix(in srgb, var(--c-success) 80%, #ebe6d3);
}
.cell.l4 {
  background: var(--c-success);
  border-color: var(--c-border);
}
.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--c-ink-soft);
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 130px;
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
  max-width: 28px;
  background: var(--c-primary);
  border: 1px solid var(--c-border);
}
.bar-value {
  font-size: 11px;
  font-weight: 700;
  min-height: 14px;
}
.bar-day {
  font-size: 10px;
  color: var(--c-ink-soft);
}
.skill-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0 0 6px;
  padding: 0;
  list-style: none;
}
.skill-tag {
  margin-left: 8px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-border);
}
.ach-group + .ach-group {
  margin-top: 10px;
}
.ach-group h3 {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--c-ink-soft);
}
.ach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.ach {
  display: grid;
  gap: 3px;
  justify-items: center;
  padding: 8px 6px;
  text-align: center;
  font-size: 13px;
  background: var(--c-surface);
  border: var(--px) solid var(--c-border);
}
.ach.locked strong {
  color: var(--c-ink-soft);
}
.ach-desc {
  min-height: 2.6em;
}
.ach-bar {
  width: 80%;
  height: 6px;
}
.hardest {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 22px;
}
.hardest li {
  display: list-item;
}
.hardest .small {
  margin-left: 8px;
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.stack {
  display: flex;
  height: 18px;
  border: var(--px) solid var(--c-border);
  overflow: hidden;
}
.seg.new,
.dot.new {
  background: #c9c2a8;
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
  gap: 4px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1px solid var(--c-border);
}
.level-row {
  display: grid;
  grid-template-columns: 44px 1fr 30px;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
}
.level-name {
  font-weight: 700;
}
.level-bar {
  height: 12px;
  background: var(--c-xp);
  border: 1px solid var(--c-border);
}
.level-count {
  text-align: right;
}
</style>
