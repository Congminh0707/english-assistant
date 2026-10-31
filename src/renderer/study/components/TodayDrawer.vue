<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleCheck, Flame, Layers, Sprout } from 'lucide-vue-next'
import type { MissionsState, StudyOverview } from '@shared/schemas/study'
import MissionList from './MissionList.vue'

defineProps<{ overview: StudyOverview | null; missions: MissionsState | null }>()
defineEmits<{ start: []; goal: [value: number] }>()

const { t } = useI18n()
const SHORTCUT = 'Ctrl + Alt + T'
</script>

<template>
  <section class="home">
    <h1 class="page-title">{{ t('study.home.welcome') }}</h1>

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
  </section>
</template>

<style scoped>
.home {
  max-width: 880px;
}
.warn {
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-warning-soft);
  color: #7a5200;
}
.cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  min-height: 84px;
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-lg);
  background: linear-gradient(135deg, var(--c-primary) 0%, #7aa2ff 100%);
  box-shadow: var(--shadow-md);
  color: #fff;
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
  color: #e08a00;
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
