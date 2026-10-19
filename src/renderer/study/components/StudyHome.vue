<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MissionsState, StudyOverview } from '@shared/schemas/study'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import MissionList from './MissionList.vue'

defineProps<{ overview: StudyOverview | null; missions: MissionsState | null }>()
defineEmits<{ start: []; goal: [value: number] }>()

const { t } = useI18n()
const SHORTCUT = 'Ctrl + Alt + T'
</script>

<template>
  <section class="home">
    <h1>{{ t('study.home.welcome') }}</h1>

    <template v-if="overview">
      <p v-if="overview.packMissing" class="warn">{{ t('study.home.packMissing') }}</p>

      <PxPanel class="cta" tone="primary">
        <template v-if="overview.dueCount > 0">
          <strong>{{ t('study.home.due') }}: {{ overview.dueCount }}</strong>
          <button type="button" class="start" @click="$emit('start')">
            {{ t('study.home.start', { count: overview.dueCount }) }}
          </button>
        </template>
        <span v-else-if="overview.totalCards === 0">
          {{ t('study.home.noCards', { shortcut: SHORTCUT }) }}
        </span>
        <span v-else>{{ t('study.home.nothingDue') }}</span>
      </PxPanel>

      <div class="stats">
        <PxPanel class="stat">
          <div class="num">🔥 {{ t('study.home.streakDays', { n: overview.streakDays }) }}</div>
          <div class="label">{{ t('study.home.streak') }}</div>
        </PxPanel>
        <PxPanel class="stat">
          <div class="num">{{ overview.reviewedToday }}</div>
          <div class="label">{{ t('study.home.today') }}</div>
        </PxPanel>
        <PxPanel class="stat">
          <div class="num">{{ overview.totalCards }}</div>
          <div class="label">{{ t('study.home.total') }}</div>
        </PxPanel>
        <PxPanel class="stat">
          <div class="num">{{ overview.learnedCards }}</div>
          <div class="label">{{ t('study.home.learned') }}</div>
        </PxPanel>
      </div>

      <MissionList v-if="missions" :state="missions" @goal="$emit('goal', $event)" />
    </template>
  </section>
</template>

<style scoped>
h1 {
  margin: 0 0 16px;
  font-size: 22px;
}
.warn {
  padding: 8px 10px;
  background: var(--c-warning);
  border: var(--px) solid var(--c-border);
}
.cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  font-size: 16px;
}
.start {
  padding: 10px 18px;
  border: var(--px) solid var(--c-border);
  background: var(--c-success);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.start:hover {
  filter: brightness(1.08);
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.stat {
  padding: 14px 8px;
  text-align: center;
}
.num {
  font-size: 22px;
  font-weight: 700;
}
.label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--c-ink-soft);
}
</style>
