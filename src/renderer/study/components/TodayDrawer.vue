<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleCheck, Flame, Layers, Sprout, X } from 'lucide-vue-next'
import type { MissionsState, StudyOverview } from '@shared/schemas/study'
import MissionList from './MissionList.vue'

defineProps<{ overview: StudyOverview | null; missions: MissionsState | null }>()
defineEmits<{ start: []; goal: [value: number]; close: [] }>()

const { t } = useI18n()
const SHORTCUT = 'Ctrl + Alt + T'
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

      <div class="cta" :class="{ idle: overview.dueCount === 0 }">
        <template v-if="overview.dueCount > 0">
          <div class="cta-text">
            <span class="cta-label">{{ t('study.home.due') }}</span>
            <strong class="cta-num">{{ overview.dueCount }}</strong>
          </div>
          <button type="button" class="btn btn--success" @click="$emit('start')">
            {{ t('study.home.start', { count: overview.dueCount }) }}
          </button>
        </template>
        <span v-else-if="overview.totalCards === 0">
          {{ t('study.home.noCards', { shortcut: SHORTCUT }) }}
        </span>
        <span v-else>{{ t('study.home.nothingDue') }}</span>
      </div>

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
.cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  min-height: 72px;
  margin-top: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--c-primary);
  box-shadow: var(--shadow-md);
  color: var(--c-on-primary);
  font-size: var(--fs-lg);
  font-weight: 600;
}
.cta.idle {
  background: var(--c-surface);
  border: 1px solid var(--c-line);
  box-shadow: var(--shadow-sm);
  color: var(--c-ink-soft);
}
.cta-text {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
}
.cta-label {
  opacity: 0.9;
}
.cta-num {
  font-size: 34px;
  line-height: 1;
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
