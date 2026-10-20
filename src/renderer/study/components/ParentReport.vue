<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { KIDS_DAILY_MINUTES } from '@shared/kids'
import type { ParentReport } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import ParentGate from '../kids/ParentGate.vue'

// Khu vực phụ huynh cho hồ sơ trẻ em: thời gian bé đã dùng và số thẻ ôn 7 ngày, tiến độ sticker/hoạt động,
// từ bé hay quên, giới hạn thời gian mỗi ngày, đổi PIN, cho dùng thêm giờ.
const { t } = useI18n()
const settingsStore = useSettingsStore()

const report = ref<ParentReport | null>(null)
const gate = ref<'set' | 'extend' | null>(null)
const message = ref('')

async function load(): Promise<void> {
  report.value = await invoke('parent:report')
}

const minutes = (seconds: number): number => Math.round(seconds / 60)
const maxMinutes = computed(() =>
  Math.max(10, ...(report.value?.days ?? []).map((d) => minutes(d.seconds)))
)
const todayMinutes = computed(() => minutes(report.value?.days.at(-1)?.seconds ?? 0))

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

onMounted(load)
</script>

<template>
  <section class="report">
    <h1>{{ t('kids.report.title') }}</h1>

    <template v-if="report">
      <PxPanel class="block">
        <h2>{{ t('kids.report.usage') }}</h2>
        <p class="muted">
          {{ t('kids.report.today', { n: todayMinutes }) }}
          <template v-if="report.dailyLimitMinutes">
            · {{ t('kids.report.limit', { n: report.dailyLimitMinutes }) }}
          </template>
        </p>
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
              :style="{ height: `${Math.max(2, (minutes(d.seconds) / maxMinutes) * 90)}px` }"
            />
            <div class="bar-day">{{ d.day.slice(8) }}</div>
          </div>
        </div>
        <p class="muted small">{{ t('kids.report.usageHint') }}</p>
      </PxPanel>

      <div class="two">
        <PxPanel class="block">
          <h2>{{ t('kids.report.stickers') }}</h2>
          <PxBar
            :value="report.stickersEarned"
            :max="Math.max(1, report.stickersTotal)"
            label="stickers"
          />
          <p class="muted">{{ report.stickersEarned }} / {{ report.stickersTotal }}</p>
        </PxPanel>
        <PxPanel class="block">
          <h2>{{ t('kids.report.activities') }}</h2>
          <PxBar
            :value="report.activitiesDone"
            :max="Math.max(1, report.activitiesTotal)"
            label="activities"
          />
          <p class="muted">{{ report.activitiesDone }} / {{ report.activitiesTotal }}</p>
        </PxPanel>
      </div>

      <PxPanel class="block">
        <h2>{{ t('kids.report.hardest') }}</h2>
        <p v-if="!report.hardest.length" class="muted">{{ t('kids.report.noHardest') }}</p>
        <ul v-else class="hard">
          <li v-for="h in report.hardest" :key="h.word">
            <strong>{{ h.word }}</strong> <span class="muted">{{ h.vi }}</span>
            <span class="muted small">{{ t('kids.report.forgot', { n: h.lapses }) }}</span>
          </li>
        </ul>
      </PxPanel>

      <PxPanel class="block">
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
        <div class="row">
          <button type="button" class="small" @click="gate = 'extend'">
            {{ t('kids.report.extend') }}
          </button>
          <button type="button" class="small" @click="gate = 'set'">
            {{ t('kids.report.changePin') }}
          </button>
        </div>
        <p v-if="message" class="ok">{{ message }}</p>
      </PxPanel>
    </template>

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
  font-size: 16px;
  color: var(--c-xp);
}
.block {
  padding: 14px 16px;
}
.muted {
  margin: 4px 0;
  color: var(--c-ink-soft);
}
.small {
  font-size: 12px;
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 130px;
}
.bar-col {
  display: grid;
  flex: 1;
  gap: 2px;
  justify-items: center;
  align-content: end;
  font-size: 11px;
}
.bar {
  width: 70%;
  background: var(--c-primary);
  border: 1px solid var(--c-border);
}
.hard {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 18px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}
select,
.small {
  padding: 4px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  cursor: pointer;
}
.ok {
  margin: 4px 0 0;
  color: var(--c-success);
  font-weight: 600;
}
</style>
