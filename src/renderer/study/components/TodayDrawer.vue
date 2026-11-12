<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleCheck, Flame, Layers, Sprout, X } from 'lucide-vue-next'
import type { DailyPlan, DailyPlanItem, MissionsState, StudyOverview } from '@shared/schemas/study'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import MissionList from './MissionList.vue'
import { planItemIcon, planItemSubtitle, planItemTitle } from '../planItem'

defineProps<{
  overview: StudyOverview | null
  missions: MissionsState | null
  /** Lộ trình hôm nay (docs/07 §13) */
  plan: DailyPlan | null
}>()
defineEmits<{
  goal: [value: number]
  minutes: [value: number]
  open: [item: DailyPlanItem]
  close: []
}>()

const { t } = useI18n()
const SHORTCUT = 'Ctrl + Alt + T'
const TARGETS = [10, 20, 30, 60]
const itemTitle = (item: DailyPlanItem): string => planItemTitle(item, t)
const itemSubtitle = (item: DailyPlanItem): string | undefined => planItemSubtitle(item, t)
</script>

<template>
  <aside class="home" role="dialog" :aria-label="t('study.home.todayPanel')">
    <header class="top">
      <h1 class="page-title">{{ t('study.home.welcome') }}</h1>
      <button
        type="button"
        class="btn btn--ghost btn--sm"
        :aria-label="t('study.home.close')"
        @click="$emit('close')"
      >
        <X :size="16" />
      </button>
    </header>

    <template v-if="overview">
      <p v-if="overview.packMissing" class="warn">{{ t('study.home.packMissing') }}</p>

      <section v-if="plan" class="card plan">
        <header class="plan-head">
          <h2>{{ t('study.plan.title') }}</h2>
          <span class="chip" :class="plan.doneCount === plan.items.length ? 'chip--success' : ''">
            {{ plan.doneCount }}/{{ plan.items.length }}
          </span>
          <select
            class="target"
            :value="plan.targetMinutes"
            :aria-label="t('study.plan.target', { n: plan.targetMinutes })"
            @change="$emit('minutes', Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="m in TARGETS" :key="m" :value="m">
              {{ t('study.plan.target', { n: m }) }}
            </option>
          </select>
        </header>

        <p v-if="plan.items.length === 0" class="plan-note">{{ t('study.plan.empty') }}</p>
        <ul v-else class="plan-list">
          <li
            v-for="(item, i) in plan.items"
            :key="`${item.kind}:${item.lessonId ?? i}`"
            class="plan-row"
            :class="{ done: item.done }"
          >
            <span class="plan-icon" :class="{ ok: item.done }">
              <UiIcon :name="item.done ? 'check' : planItemIcon(item)" :size="18" />
            </span>
            <div class="plan-main">
              <div class="plan-name">{{ itemTitle(item) }}</div>
              <div v-if="itemSubtitle(item)" class="plan-sub">{{ itemSubtitle(item) }}</div>
            </div>
            <span class="chip">{{ t('study.plan.minutes', { n: item.minutes }) }}</span>
            <!-- Ôn thẻ đã xong mà không còn thẻ đến hạn: không có gì để làm lại, chỉ giữ dấu hoàn thành -->
            <button
              v-if="!(item.kind === 'review' && item.done && item.count === 0)"
              type="button"
              class="btn btn--sm"
              :class="item.done ? 'btn--ghost' : 'btn--primary'"
              :aria-label="`${item.done ? t('study.plan.redo') : t('study.plan.do')}: ${itemTitle(item)}`"
              @click="$emit('open', item)"
            >
              {{ item.done ? t('study.plan.redo') : t('study.plan.do') }}
            </button>
          </li>
        </ul>
        <p v-if="plan.items.length > 0 && plan.doneCount === plan.items.length" class="plan-note">
          {{ t('study.plan.allDone') }}
        </p>
      </section>

      <p v-if="overview.totalCards === 0" class="hint">
        {{ t('study.home.noCards', { shortcut: SHORTCUT }) }}
      </p>

      <div class="stats">
        <div class="card stat">
          <span class="stat-icon warm"><Flame :size="20" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ t('study.home.streakDays', { n: overview.streakDays }) }}</div>
            <div class="label">{{ t('study.home.streak') }}</div>
          </div>
        </div>
        <div class="card stat">
          <span class="stat-icon ok"><CircleCheck :size="20" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ overview.reviewedToday }}</div>
            <div class="label">{{ t('study.home.today') }}</div>
          </div>
        </div>
        <div class="card stat">
          <span class="stat-icon cool"><Layers :size="20" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ overview.totalCards }}</div>
            <div class="label">{{ t('study.home.total') }}</div>
          </div>
        </div>
        <div class="card stat">
          <span class="stat-icon violet"><Sprout :size="20" :stroke-width="2.2" /></span>
          <div>
            <div class="num">{{ overview.learnedCards }}</div>
            <div class="label">{{ t('study.home.learned') }}</div>
          </div>
        </div>
      </div>

      <MissionList v-if="missions" :state="missions" @goal="$emit('goal', $event)" />
    </template>
  </aside>
</template>

<style scoped>
.home {
  position: absolute;
  top: 56px;
  right: var(--sp-4);
  bottom: var(--sp-4);
  z-index: 5;
  width: min(440px, calc(100% - 2 * var(--sp-4)));
  overflow-y: auto;
  padding: var(--sp-4);
  border: 2px solid var(--c-line);
  border-radius: var(--r-lg);
  background: var(--c-bg);
  box-shadow: var(--shadow-md);
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.top .page-title {
  margin: 0;
  font-size: var(--fs-xl);
}
.warn {
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.plan {
  margin-top: var(--sp-3);
}
.plan-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}
.plan-head h2 {
  margin: 0;
  font-size: var(--fs-lg);
}
.target {
  margin-left: auto;
  font-size: var(--fs-xs);
}
.plan-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
.plan-row {
  display: grid;
  grid-template-columns: 32px 1fr auto auto;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
  border-top: 1px solid var(--c-line);
}
.plan-row:first-child {
  border-top: 0;
}
.plan-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.plan-icon.ok {
  background: var(--c-success-soft);
  color: var(--c-success);
}
.plan-main {
  min-width: 0;
}
.plan-name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plan-sub {
  overflow: hidden;
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plan-row.done .plan-name {
  color: var(--c-ink-soft);
}
.plan-note {
  margin: var(--sp-2) 0 0;
  font-size: var(--fs-sm);
  color: var(--c-success);
  font-weight: 600;
}
.hint {
  margin: var(--sp-3) 0 0;
  font-size: var(--fs-sm);
  color: var(--c-ink-soft);
}
.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-3);
  margin-top: var(--sp-4);
}
.stat {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.stat-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
}
.stat-icon.warm {
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.stat-icon.ok {
  background: var(--c-success-soft);
  color: var(--c-success);
}
.stat-icon.cool {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.stat-icon.violet {
  background: var(--c-xp-soft);
  color: var(--c-xp);
}
.num {
  font-size: var(--fs-xl);
  font-weight: 700;
  line-height: 1.2;
}
.label {
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
}
</style>
