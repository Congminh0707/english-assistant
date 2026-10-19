<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LEVEL_CODES, TRACKS, type Track } from '@shared/schemas/content/level'
import { cefrLabel } from '@shared/placement'
import type { ProfileInfo } from '@shared/schemas/profile'
import type { Settings } from '@shared/schemas/settings'
import { UK_VOICES, US_VOICES } from '@shared/tts'
import { invoke } from '@renderer/shared/ipc'
import { useTts, useTtsModel } from '@renderer/shared/composables/useTts'
import { useTranslateModels } from '@renderer/shared/composables/useTranslateModels'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

// Cài đặt: hồ sơ, học tập, chế độ yên lặng, giao diện. Đổi là lưu ngay (main đẩy lại cho mọi cửa sổ).
const emit = defineEmits<{ retest: []; changed: [] }>()

const { t } = useI18n()
const settingsStore = useSettingsStore()

const { speak, naturalVoice } = useTts()
const ttsModel = useTtsModel()
const trModels = useTranslateModels()
const TR_DIRECTIONS = ['en-vi', 'vi-en'] as const
const MB = 1024 * 1024
const toMb = (bytes: number | undefined): number => Math.round((bytes ?? 0) / MB)
const ttsSizeMb = computed(() => Math.round((ttsModel.status.value?.sizeBytes ?? 0) / MB))
const ttsDoneMb = computed(() => Math.round((ttsModel.status.value?.receivedBytes ?? 0) / MB))
const wantsNatural = computed(() => settingsStore.settings['tts.engine'] === 'kokoro')

const CREDIT_KEYS = ['kokoro', 'kokoroData', 'espeak', 'opusmt', 'tatoeba'] as const

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

/** Các tuỳ chọn bật/tắt của phần ôn thẻ */
const REVIEW_TOGGLES = [
  { key: 'review.dirViEn', label: 'dirViEn' },
  { key: 'review.dirAudio', label: 'dirAudio' },
  { key: 'review.dirCloze', label: 'dirCloze' },
  { key: 'review.typing', label: 'typing' },
  { key: 'review.autoPlay', label: 'autoPlay' }
] as const

const backfilling = ref(false)
const backfillMessage = ref('')

/** Tạo thẻ phụ cho các từ đã thuộc từ trước (sau khi bật thêm hướng thẻ) */
async function backfill(): Promise<void> {
  backfilling.value = true
  try {
    const { created } = await invoke('study:backfill')
    backfillMessage.value = t('study.settings.backfillDone', { n: created })
    emit('changed')
  } finally {
    backfilling.value = false
  }
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
      <h2>{{ t('translate.modelsTitle') }}</h2>
      <p class="muted">{{ t('translate.modelsHint') }}</p>
      <div v-for="dir in TR_DIRECTIONS" :key="dir" class="model">
        <strong>{{ t(`translate.dir.${dir}`) }}</strong>
        <template v-if="trModels.statuses[dir].value">
          <span v-if="trModels.statuses[dir].value?.state === 'ready'" class="muted"
            >✓ {{ t('tts.ready') }} ({{ toMb(trModels.statuses[dir].value?.sizeBytes) }} MB)</span
          >
          <span v-else-if="trModels.statuses[dir].value?.state === 'downloading'" class="muted">{{
            t('translate.downloading', {
              done: toMb(trModels.statuses[dir].value?.receivedBytes),
              total: toMb(trModels.statuses[dir].value?.sizeBytes)
            })
          }}</span>
          <span v-else class="muted">{{
            t('translate.notInstalled', { size: toMb(trModels.statuses[dir].value?.sizeBytes) })
          }}</span>
          <span v-if="trModels.statuses[dir].value?.errorKey" class="error">{{
            t(trModels.statuses[dir].value?.errorKey as string)
          }}</span>
          <progress
            v-if="trModels.statuses[dir].value?.state === 'downloading'"
            :value="trModels.statuses[dir].value?.receivedBytes"
            :max="trModels.statuses[dir].value?.sizeBytes"
          />
          <span class="controls">
            <button
              v-if="trModels.statuses[dir].value?.state === 'downloading'"
              type="button"
              class="small"
              @click="trModels.cancel(dir)"
            >
              {{ t('translate.cancel') }}
            </button>
            <button
              v-else-if="trModels.statuses[dir].value?.state === 'ready'"
              type="button"
              class="small"
              @click="trModels.remove(dir)"
            >
              {{ t('translate.remove') }}
            </button>
            <button v-else type="button" class="small" @click="trModels.install(dir)">
              {{
                trModels.statuses[dir].value?.errorKey
                  ? t('translate.retry')
                  : t('translate.download')
              }}
            </button>
          </span>
        </template>
      </div>
    </PxPanel>

    <PxPanel class="block">
      <h2>{{ t('study.settings.review') }}</h2>
      <label class="row">
        {{ t('study.settings.newPerDay') }}
        <select
          :value="settingsStore.settings['review.newPerDay']"
          @change="
            setSetting(
              'review.newPerDay',
              Number(($event.target as HTMLSelectElement).value) as never
            )
          "
        >
          <option :value="0">{{ t('study.settings.unlimited') }}</option>
          <option v-for="n in [5, 10, 20, 50]" :key="n" :value="n">
            {{ t('study.settings.newWords', { n }) }}
          </option>
        </select>
      </label>
      <label class="row">
        {{ t('study.settings.reviewOrder') }}
        <select
          :value="settingsStore.settings['review.order']"
          @change="setSetting('review.order', ($event.target as HTMLSelectElement).value as never)"
        >
          <option v-for="o in ['mixed', 'new-first', 'review-first']" :key="o" :value="o">
            {{ t(`study.settings.order.${o}`) }}
          </option>
        </select>
      </label>
      <p class="muted">{{ t('study.settings.directionsHint') }}</p>
      <label v-for="d in REVIEW_TOGGLES" :key="d.key" class="row">
        {{ t(`study.settings.${d.label}`) }}
        <input
          type="checkbox"
          :checked="settingsStore.settings[d.key]"
          @change="setSetting(d.key, ($event.target as HTMLInputElement).checked as never)"
        />
      </label>
      <div class="row">
        <span class="muted">{{ backfillMessage || t('study.settings.backfillHint') }}</span>
        <button type="button" class="small" :disabled="backfilling" @click="backfill">
          {{ t('study.settings.backfill') }}
        </button>
      </div>
    </PxPanel>

    <PxPanel class="block">
      <h2>{{ t('tts.title') }}</h2>
      <label class="row">
        {{ t('tts.accent') }}
        <select
          :value="settingsStore.settings['tts.accent']"
          @change="setSetting('tts.accent', ($event.target as HTMLSelectElement).value as never)"
        >
          <option value="us">{{ t('tts.accentUs') }}</option>
          <option value="uk">{{ t('tts.accentUk') }}</option>
        </select>
      </label>
      <label class="row">
        <span class="inline">
          <input
            type="radio"
            name="tts-engine"
            value="system"
            :checked="!wantsNatural"
            @change="setSetting('tts.engine', 'system')"
          />
          {{ t('tts.system') }}
        </span>
      </label>
      <label class="row">
        <span class="inline">
          <input
            type="radio"
            name="tts-engine"
            value="kokoro"
            :checked="wantsNatural"
            @change="setSetting('tts.engine', 'kokoro')"
          />
          {{ t('tts.kokoro') }}
        </span>
        <span v-if="ttsModel.status.value?.state === 'ready'" class="muted"
          >✓ {{ t('tts.ready') }}</span
        >
      </label>

      <template v-if="wantsNatural">
        <div v-if="ttsModel.status.value?.state === 'downloading'" class="download">
          <span class="muted">{{
            t('tts.downloading', { done: ttsDoneMb, total: ttsSizeMb })
          }}</span>
          <progress
            :value="ttsModel.status.value.receivedBytes"
            :max="ttsModel.status.value.sizeBytes"
          />
          <button type="button" class="small" @click="ttsModel.cancel()">
            {{ t('tts.cancel') }}
          </button>
        </div>
        <div
          v-else-if="ttsModel.status.value && ttsModel.status.value.state !== 'ready'"
          class="download"
        >
          <span class="muted">{{ t('tts.needModel', { size: ttsSizeMb }) }}</span>
          <span v-if="ttsModel.status.value.errorKey" class="error">{{
            t(ttsModel.status.value.errorKey)
          }}</span>
          <button type="button" class="small" @click="ttsModel.install()">
            {{ ttsModel.status.value.errorKey ? t('tts.retry') : t('tts.download') }}
          </button>
          <span class="muted">{{ t('tts.fallbackHint') }}</span>
        </div>
        <template v-else>
          <label class="row">
            {{ t('tts.voiceUs') }}
            <span class="controls">
              <select
                :value="settingsStore.settings['tts.voiceUs']"
                @change="
                  setSetting('tts.voiceUs', ($event.target as HTMLSelectElement).value as never)
                "
              >
                <option v-for="v in US_VOICES" :key="v.id" :value="v.id">{{ v.label }}</option>
              </select>
              <button type="button" class="small" @click="speak(t('tts.testText'), 'us')">
                🔊 {{ t('tts.test') }}
              </button>
            </span>
          </label>
          <label class="row">
            {{ t('tts.voiceUk') }}
            <span class="controls">
              <select
                :value="settingsStore.settings['tts.voiceUk']"
                @change="
                  setSetting('tts.voiceUk', ($event.target as HTMLSelectElement).value as never)
                "
              >
                <option v-for="v in UK_VOICES" :key="v.id" :value="v.id">{{ v.label }}</option>
              </select>
              <button type="button" class="small" @click="speak(t('tts.testText'), 'uk')">
                🔊 {{ t('tts.test') }}
              </button>
            </span>
          </label>
          <p v-if="naturalVoice" class="muted">{{ t('tts.cacheHint') }}</p>
        </template>
      </template>
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

    <PxPanel class="block">
      <h2>{{ t('credits.title') }}</h2>
      <ul class="credits">
        <li v-for="k in CREDIT_KEYS" :key="k">{{ t(`credits.${k}`) }}</li>
      </ul>
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
.model {
  display: grid;
  gap: 4px;
  justify-items: start;
  padding: 6px 0;
  font-size: 13px;
}
.model progress {
  width: 100%;
}
.credits {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
  font-size: 13px;
}
.download {
  display: grid;
  gap: 6px;
  justify-items: start;
  font-size: 13px;
}
.download progress {
  width: 100%;
}
.error {
  color: var(--c-danger);
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
