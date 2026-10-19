<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MissionsState } from '@shared/schemas/study'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

// Nhiệm vụ ngày: tiến độ + phần thưởng; chọn mục tiêu ôn mỗi ngày.
defineProps<{ state: MissionsState }>()
defineEmits<{ goal: [value: number] }>()

const { t } = useI18n()
const GOALS = [5, 10, 20, 30]
</script>

<template>
  <PxPanel class="missions">
    <header class="head">
      <h2>{{ t('study.missions.title') }}</h2>
      <label class="goal">
        {{ t('study.missions.goal') }}
        <select
          :value="state.goal"
          @change="$emit('goal', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="g in GOALS" :key="g" :value="g">
            {{ t('study.missions.goalCards', { n: g }) }}
          </option>
        </select>
      </label>
    </header>

    <ul class="list">
      <li v-for="m in state.missions" :key="m.id" class="row" :class="{ done: m.done }">
        <span class="check" aria-hidden="true">{{ m.done ? '✅' : '⬜' }}</span>
        <div class="main">
          <div class="name">{{ t(`study.missions.${m.id}`, { n: m.target }) }}</div>
          <PxBar
            :value="m.progress"
            :max="m.target"
            :color="m.done ? 'var(--c-success)' : 'var(--c-primary)'"
            :label="t(`study.missions.${m.id}`, { n: m.target })"
          />
        </div>
        <div class="side">
          <span class="count">{{ m.progress }}/{{ m.target }}</span>
          <span class="reward">
            {{
              m.done
                ? t('study.missions.done')
                : t('study.missions.reward', { xp: m.xp, coins: m.coins })
            }}
          </span>
        </div>
      </li>
    </ul>

    <footer class="bonus" :class="{ done: state.bonus.done }">
      🎁 {{ t('study.missions.bonus') }}:
      {{
        state.bonus.done
          ? t('study.missions.done')
          : t('study.missions.reward', { xp: state.bonus.xp, coins: state.bonus.coins })
      }}
    </footer>
  </PxPanel>
</template>

<style scoped>
.missions {
  margin-top: 20px;
  padding: 14px 16px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
h2 {
  margin: 0;
  font-size: 16px;
}
.goal {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--c-ink-soft);
}
select {
  padding: 2px 4px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
}
.list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.row.done .name {
  color: var(--c-ink-soft);
  text-decoration: line-through;
}
.main {
  flex: 1;
  display: grid;
  gap: 4px;
}
.name {
  font-weight: 600;
}
.side {
  display: grid;
  min-width: 96px;
  justify-items: end;
  font-size: 12px;
}
.count {
  font-weight: 700;
}
.reward {
  color: var(--c-ink-soft);
}
.bonus {
  margin-top: 12px;
  padding-top: 8px;
  font-size: 13px;
  border-top: 1px dashed var(--c-ink-soft);
}
.bonus.done {
  color: var(--c-success);
  font-weight: 600;
}
</style>
