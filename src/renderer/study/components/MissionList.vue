<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Circle, CircleCheck, Gift } from 'lucide-vue-next'
import type { MissionsState } from '@shared/schemas/study'
import PxBar from '@renderer/shared/components/PxBar.vue'

// Nhiệm vụ ngày: tiến độ + phần thưởng; chọn mục tiêu ôn mỗi ngày.
defineProps<{ state: MissionsState }>()
defineEmits<{ goal: [value: number] }>()

const { t } = useI18n()
const GOALS = [5, 10, 20, 30]
</script>

<template>
  <section class="card missions">
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
        <CircleCheck v-if="m.done" class="check ok" :size="22" :stroke-width="2.2" />
        <Circle v-else class="check" :size="22" :stroke-width="2" />
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
          <span class="chip" :class="m.done ? 'chip--success' : 'chip--warning'">
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
      <Gift :size="16" :stroke-width="2.2" />
      <span>
        {{ t('study.missions.bonus') }}:
        {{
          state.bonus.done
            ? t('study.missions.done')
            : t('study.missions.reward', { xp: state.bonus.xp, coins: state.bonus.coins })
        }}
      </span>
    </footer>
  </section>
</template>

<style scoped>
.missions {
  margin-top: var(--sp-4);
  padding: var(--sp-4) var(--sp-5);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}
h2 {
  margin: 0;
  font-size: var(--fs-lg);
}
.goal {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
}
.list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: grid;
  grid-template-columns: 22px 1fr 150px;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) 0;
  border-top: 1px solid var(--c-line);
}
.row:first-child {
  border-top: 0;
}
.check {
  color: var(--c-line);
}
.check.ok {
  color: var(--c-success);
}
.main {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.name {
  font-weight: 600;
}
.side {
  display: grid;
  justify-items: end;
  gap: 4px;
}
.count {
  font-size: var(--fs-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.row.done .name {
  color: var(--c-ink-soft);
}
.bonus {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-xp-soft);
  color: #5b36b8;
  font-size: var(--fs-sm);
  font-weight: 600;
}
.bonus.done {
  background: var(--c-success-soft);
  color: #25693a;
}
</style>
