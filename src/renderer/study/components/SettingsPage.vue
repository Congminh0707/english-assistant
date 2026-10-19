<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LEVEL_CODES, TRACKS, type Track } from '@shared/schemas/content/level'
import { cefrLabel } from '@shared/placement'
import type { ProfileInfo } from '@shared/schemas/profile'
import type { Settings } from '@shared/schemas/settings'
import { invoke } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

// Cài đặt: hồ sơ, học tập, chế độ yên lặng, giao diện. Đổi là lưu ngay (main đẩy lại cho mọi cửa sổ).
const emit = defineEmits<{ retest: []; changed: [] }>()

const { t } = useI18n()
const settingsStore = useSettingsStore()

const profiles = ref<ProfileInfo[]>([])
const newName = ref('')
const newTrack = ref<Track>('general')

async function loadProfiles(): Promise<void> {
  profiles.value = await invoke('profile:list')
}

async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await settingsStore.set(key, value)
  emit('changed')
}

async function switchTo(id: string): Promise<void> {
  await invoke('profile:switch', { id })
  await Promise.all([settingsStore.load(), loadProfiles()])
  emit('changed')
}

async function createProfile(): Promise<void> {
  const name = newName.value.trim()
  if (!name) return
  await invoke('profile:create', { name, track: newTrack.value })
  newName.value = ''
  await loadProfiles()
}

const levelLabel = (code: string): string =>
  `${cefrLabel(code as never)} · ${code.replace('_', '.')}`

onMounted(loadProfiles)
</script>

<template>
  <section class="settings">
    <h1>{{ t('study.settings.title') }}</h1>

    <PxPanel class="block">
      <h2>{{ t('study.settings.profiles') }}</h2>
      <ul class="profiles">
        <li v-for="p in profiles" :key="p.id" class="profile" :class="{ active: p.active }">
          <div>
            <strong>{{ p.name }}</strong>
            <span class="muted"> · {{ t(`study.tracks.${p.track}`) }} · 🐾 {{ p.petName }}</span>
            <span v-if="p.isChild" class="tag">{{ t('study.settings.child') }}</span>
          </div>
          <span v-if="p.active" class="muted">✓ {{ t('study.settings.active') }}</span>
          <button v-else type="button" class="small" @click="switchTo(p.id)">
            {{ t('study.settings.switch') }}
          </button>
        </li>
      </ul>
      <form class="add" @submit.prevent="createProfile">
        <input
          v-model="newName"
          type="text"
          maxlength="40"
          :placeholder="t('study.settings.addProfile')"
        />
        <select v-model="newTrack">
          <option v-for="tr in TRACKS" :key="tr" :value="tr">{{ t(`study.tracks.${tr}`) }}</option>
        </select>
        <button type="submit" class="small" :disabled="!newName.trim()">
          {{ t('study.settings.create') }}
        </button>
      </form>
    </PxPanel>

    <PxPanel class="block">
      <h2>{{ t('study.settings.learning') }}</h2>
      <label class="row">
        {{ t('study.settings.level') }}
        <span class="controls">
          <select
            :value="settingsStore.settings['learning.level']"
            @change="
              setSetting('learning.level', ($event.target as HTMLSelectElement).value as never)
            "
          >
            <option v-for="l in LEVEL_CODES" :key="l" :value="l">{{ levelLabel(l) }}</option>
          </select>
          <button type="button" class="small" @click="emit('retest')">
            {{ t('study.settings.retest') }}
          </button>
        </span>
      </label>
      <label class="row">
        {{ t('study.settings.dailyGoal') }}
        <select
          :value="settingsStore.settings['learning.dailyGoal']"
          @change="
            setSetting(
              'learning.dailyGoal',
              Number(($event.target as HTMLSelectElement).value) as never
            )
          "
        >
          <option v-for="g in [5, 10, 20, 30]" :key="g" :value="g">
            {{ t('study.missions.goalCards', { n: g }) }}
          </option>
        </select>
      </label>
      <label class="row">
        {{ t('study.settings.quizInterval') }}
        <select
          :value="settingsStore.settings['mascot.quizMinutes']"
          @change="
            setSetting(
              'mascot.quizMinutes',
              Number(($event.target as HTMLSelectElement).value) as never
            )
          "
        >
          <option :value="0">{{ t('study.settings.quizOff') }}</option>
          <option v-for="m in [15, 25, 45]" :key="m" :value="m">
            {{ t('study.settings.quizEvery', { n: m }) }}
          </option>
        </select>
      </label>
    </PxPanel>

    <PxPanel class="block">
      <h2>{{ t('study.settings.quiet') }}</h2>
      <label class="row">
        {{ t('study.settings.meetings') }}
        <input
          type="checkbox"
          :checked="settingsStore.settings['quiet.meetings']"
          @change="setSetting('quiet.meetings', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <div class="row">
        <label class="inline">
          <input
            type="checkbox"
            :checked="settingsStore.settings['quiet.dnd.enabled']"
            @change="setSetting('quiet.dnd.enabled', ($event.target as HTMLInputElement).checked)"
          />
          {{ t('study.settings.dnd') }}
        </label>
        <span class="controls">
          {{ t('study.settings.dndFrom') }}
          <input
            type="time"
            :value="settingsStore.settings['quiet.dnd.from']"
            @change="setSetting('quiet.dnd.from', ($event.target as HTMLInputElement).value)"
          />
          {{ t('study.settings.dndTo') }}
          <input
            type="time"
            :value="settingsStore.settings['quiet.dnd.to']"
            @change="setSetting('quiet.dnd.to', ($event.target as HTMLInputElement).value)"
          />
        </span>
      </div>
    </PxPanel>

    <PxPanel class="block">
      <h2>{{ t('study.settings.appearance') }}</h2>
      <label class="row">
        {{ t('study.settings.language') }}
        <select
          :value="settingsStore.settings['ui.language']"
          @change="setSetting('ui.language', ($event.target as HTMLSelectElement).value as never)"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </label>
      <label class="row">
        {{ t('study.settings.size') }}
        <select
          :value="settingsStore.settings['mascot.scale']"
          @change="
            setSetting('mascot.scale', Number(($event.target as HTMLSelectElement).value) as never)
          "
        >
          <option :value="1">{{ t('menu.sizeSmall') }}</option>
          <option :value="2">{{ t('menu.sizeMedium') }}</option>
          <option :value="3">{{ t('menu.sizeLarge') }}</option>
        </select>
      </label>
      <label class="row">
        {{ t('study.settings.launchAtLogin') }}
        <input
          type="checkbox"
          :checked="settingsStore.settings['app.launchAtLogin']"
          @change="setSetting('app.launchAtLogin', ($event.target as HTMLInputElement).checked)"
        />
      </label>
    </PxPanel>
  </section>
</template>

<style scoped>
.settings {
  display: grid;
  gap: 16px;
  max-width: 680px;
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
.block {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.inline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.muted {
  color: var(--c-ink-soft);
  font-size: 12px;
}
select,
input[type='text'],
input[type='time'] {
  padding: 4px 6px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
}
.profiles {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.profile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--c-border);
  background: var(--c-bg);
}
.profile.active {
  border-width: var(--px);
  background: #eef3ff;
}
.tag {
  margin-left: 6px;
  padding: 0 5px;
  font-size: 11px;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-border);
}
.add {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.add input {
  flex: 1;
  min-width: 120px;
}
.small {
  padding: 4px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  cursor: pointer;
}
.small:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
