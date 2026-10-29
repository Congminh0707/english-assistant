<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LEVEL_CODES, TRACKS, type Track } from '@shared/schemas/content/level'
import { cefrLabel } from '@shared/placement'
import { isChildTrack, type ProfileInfo } from '@shared/schemas/profile'
import type { Settings } from '@shared/schemas/settings'
import { UK_VOICES, US_VOICES } from '@shared/tts'
import { invoke } from '@renderer/shared/ipc'
import { useTts, useTtsModel } from '@renderer/shared/composables/useTts'
import { useStt } from '@renderer/shared/composables/useStt'
import { useTranslateModels } from '@renderer/shared/composables/useTranslateModels'
import type { TranslateOnlineStatus } from '@shared/schemas/translate'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { useUpdateStatus } from '@renderer/shared/composables/useUpdateStatus'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import AudioPackPanel from '@renderer/shared/components/AudioPackPanel.vue'
import SpritePackPanel from '@renderer/shared/components/SpritePackPanel.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Cài đặt: hồ sơ, học tập, chế độ yên lặng, giao diện. Đổi là lưu ngay (main đẩy lại cho mọi cửa sổ).
const emit = defineEmits<{ retest: []; changed: [] }>()

const { t } = useI18n()
const settingsStore = useSettingsStore()

const { speak, naturalVoice } = useTts()
const ttsModel = useTtsModel()
const trModels = useTranslateModels()
const stt = useStt()
const TR_DIRECTIONS = ['high', 'en-vi', 'vi-en'] as const

// Dịch online (Claude): chỉ biết đã có key chưa — key nhập xong là gửi thẳng sang main, không giữ lại ở renderer
const onlineStatus = ref<TranslateOnlineStatus>({ hasKey: false, canStore: true })
const apiKeyInput = ref('')
const keyMessage = ref('')

async function saveKey(): Promise<void> {
  keyMessage.value = ''
  try {
    onlineStatus.value = await invoke('translate:set-key', { key: apiKeyInput.value })
    apiKeyInput.value = ''
    keyMessage.value = t('translate.keySaved')
  } catch {
    keyMessage.value = onlineStatus.value.canStore
      ? t('translate.keyInvalid')
      : t('translate.keyCannotStore')
  }
}

async function clearKey(): Promise<void> {
  onlineStatus.value = await invoke('translate:clear-key')
  keyMessage.value = ''
}
const MB = 1024 * 1024
const toMb = (bytes: number | undefined): number => Math.round((bytes ?? 0) / MB)
const ttsSizeMb = computed(() => Math.round((ttsModel.status.value?.sizeBytes ?? 0) / MB))
const ttsDoneMb = computed(() => Math.round((ttsModel.status.value?.receivedBytes ?? 0) / MB))
const wantsNatural = computed(() => settingsStore.settings['tts.engine'] === 'kokoro')

const sttSizeMb = computed(() => Math.round((stt.status.value?.sizeBytes ?? 0) / MB))
const sttDoneMb = computed(() => Math.round((stt.status.value?.receivedBytes ?? 0) / MB))
const pronSizeMb = computed(() => Math.round((stt.pronunciation.value?.sizeBytes ?? 0) / MB))

/** 10 → "10 phút", 60 → "1 giờ", 720 → "12 giờ" */
const hideLabel = (minutes: number): string =>
  minutes >= 60
    ? t('study.settings.hours', { n: minutes / 60 })
    : t('study.settings.minutes', { n: minutes })

const CREDIT_KEYS = [
  'kokoro',
  'kokoroData',
  'espeak',
  'opusmt',
  'nllb',
  'whisper',
  'wav2vec2',
  'tatoeba',
  'twemoji'
] as const

const profiles = ref<ProfileInfo[]>([])
const newName = ref('')
const newTrack = ref<Track>('general')

async function loadProfiles(): Promise<void> {
  profiles.value = await invoke('profile:list')
}

/** Hồ sơ đang sửa (null = không sửa) và bản nháp các trường */
const editing = ref<string | null>(null)
const draft = reactive<{ name: string; petName: string; track: Track }>({
  name: '',
  petName: '',
  track: 'general'
})
const saveNote = ref('')

function startEdit(p: ProfileInfo): void {
  editing.value = p.id
  draft.name = p.name
  draft.petName = p.petName
  draft.track = p.track
  saveNote.value = ''
}

/** Đổi sang mục tiêu của trẻ em (hoặc ngược lại) → giao diện của hồ sơ đó đổi */
const draftChildChange = (p: ProfileInfo): boolean => isChildTrack(draft.track) !== p.isChild

async function saveEdit(p: ProfileInfo): Promise<void> {
  const name = draft.name.trim()
  const petName = draft.petName.trim()
  if (!name || !petName) return
  await invoke('profile:update', {
    id: p.id,
    name,
    petName,
    ...(draft.track !== p.track ? { track: draft.track } : {})
  })
  editing.value = null
  saveNote.value = t('study.settings.edited')
  await Promise.all([settingsStore.load(), loadProfiles()])
  emit('changed')
}

/** Công cụ chỉ có khi chạy dev (không xuất hiện trong bản đóng gói) */
const isDev = import.meta.env.DEV
const devNote = ref('')
async function devLevelUp(): Promise<void> {
  try {
    await invoke('dev:level-up', { levels: 10 })
    devNote.value = t('study.settings.devLeveled')
    emit('changed')
  } catch (err) {
    devNote.value = String(err)
  }
}
async function devGrantCoins(): Promise<void> {
  try {
    await invoke('dev:grant-coins', { coins: 1_000_000 })
    devNote.value = t('study.settings.devGranted')
    emit('changed')
  } catch (err) {
    devNote.value = String(err)
  }
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
  { key: 'review.choices', label: 'choices' },
  { key: 'review.typing', label: 'typing' },
  { key: 'review.autoPlay', label: 'autoPlay' }
] as const

const update = useUpdateStatus()
const updateMb = computed(() => Math.round((update.status.value?.sizeBytes ?? 0) / MB))

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

onMounted(async () => {
  void loadProfiles()
  onlineStatus.value = await invoke('translate:online-status')
})
</script>

<template>
  <section class="settings">
    <h1>{{ t('study.settings.title') }}</h1>

    <PxPanel class="block">
      <h2>{{ t('study.settings.profiles') }}</h2>
      <ul class="profiles">
        <li v-for="p in profiles" :key="p.id" class="profile" :class="{ active: p.active }">
          <form v-if="editing === p.id" class="edit" @submit.prevent="saveEdit(p)">
            <label>
              {{ t('study.settings.editName') }}
              <input v-model="draft.name" type="text" maxlength="40" required />
            </label>
            <label>
              {{ t('study.settings.editPet') }}
              <input v-model="draft.petName" type="text" maxlength="20" required />
            </label>
            <label>
              {{ t('study.settings.editTrack') }}
              <select v-model="draft.track">
                <option v-for="tr in TRACKS" :key="tr" :value="tr">
                  {{ t(`study.tracks.${tr}`) }}
                </option>
              </select>
            </label>
            <p v-if="draftChildChange(p)" class="warn">{{ t('study.settings.childWarn') }}</p>
            <div class="edit-actions">
              <button
                type="submit"
                class="btn btn--sm btn--primary"
                :disabled="!draft.name.trim() || !draft.petName.trim()"
              >
                {{ t('study.settings.editSave') }}
              </button>
              <button type="button" class="btn btn--sm btn--ghost" @click="editing = null">
                {{ t('study.settings.editCancel') }}
              </button>
            </div>
          </form>
          <template v-else>
            <div>
              <strong>{{ p.name }}</strong>
              <span class="muted">
                · {{ t(`study.tracks.${p.track}`) }} · <UiIcon name="pet" /> {{ p.petName }}</span
              >
              <span v-if="p.isChild" class="tag">{{ t('study.settings.child') }}</span>
            </div>
            <span v-if="p.active" class="muted"
              ><UiIcon name="check" /> {{ t('study.settings.active') }}</span
            >
            <button v-else type="button" class="btn btn--sm" @click="switchTo(p.id)">
              {{ t('study.settings.switch') }}
            </button>
            <button
              type="button"
              class="btn btn--sm btn--icon btn--ghost"
              :title="t('study.settings.edit')"
              :aria-label="t('study.settings.edit')"
              @click="startEdit(p)"
            >
              <UiIcon name="pencil" />
            </button>
          </template>
        </li>
      </ul>
      <p v-if="saveNote" class="saved-note">{{ saveNote }}</p>
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
        <button type="submit" class="btn btn--sm" :disabled="!newName.trim()">
          {{ t('study.settings.create') }}
        </button>
      </form>
    </PxPanel>

    <PxPanel v-if="isDev" class="block">
      <h2>{{ t('study.settings.devTitle') }}</h2>
      <button type="button" class="btn btn--sm" @click="devGrantCoins">
        {{ t('study.settings.devGrantCoins') }}
      </button>
      <button type="button" class="btn btn--sm" @click="devLevelUp">
        {{ t('study.settings.devLevelUp') }}
      </button>
      <p v-if="devNote" class="saved-note">{{ devNote }}</p>
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
          <button type="button" class="btn btn--sm" @click="emit('retest')">
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
      <label class="row">
        {{ t('translate.preferHigh') }}
        <input
          type="checkbox"
          :checked="settingsStore.settings['translate.highQuality']"
          @change="setSetting('translate.highQuality', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <div v-for="dir in TR_DIRECTIONS" :key="dir" class="model">
        <strong>{{ t(`translate.dir.${dir}`) }}</strong>
        <template v-if="trModels.statuses[dir].value">
          <span v-if="trModels.statuses[dir].value?.state === 'ready'" class="muted"
            ><UiIcon name="check" /> {{ t('tts.ready') }} ({{
              toMb(trModels.statuses[dir].value?.sizeBytes)
            }}
            MB)</span
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
              class="btn btn--sm"
              @click="trModels.cancel(dir)"
            >
              {{ t('translate.cancel') }}
            </button>
            <button
              v-else-if="trModels.statuses[dir].value?.state === 'ready'"
              type="button"
              class="btn btn--sm"
              @click="trModels.remove(dir)"
            >
              {{ t('translate.remove') }}
            </button>
            <button v-else type="button" class="btn btn--sm" @click="trModels.install(dir)">
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
      <h2>{{ t('translate.onlineTitle') }}</h2>
      <p class="muted">{{ t('translate.onlineHint') }}</p>
      <label class="row">
        {{ t('translate.onlineToggle') }}
        <input
          type="checkbox"
          :checked="settingsStore.settings['translate.online']"
          @change="setSetting('translate.online', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <div class="model">
        <input
          v-model="apiKeyInput"
          type="password"
          autocomplete="off"
          spellcheck="false"
          :placeholder="t('translate.keyPlaceholder')"
          @keydown.enter="saveKey"
        />
        <button type="button" class="btn btn--sm" :disabled="!apiKeyInput" @click="saveKey">
          {{ t('translate.keySave') }}
        </button>
        <button v-if="onlineStatus.hasKey" type="button" class="btn btn--sm" @click="clearKey">
          {{ t('translate.keyClear') }}
        </button>
      </div>
      <p class="muted">
        {{ keyMessage || (onlineStatus.hasKey ? t('translate.keySaved') : t('translate.keyNone')) }}
      </p>
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
          <option v-for="o in ['random', 'mixed', 'new-first', 'review-first']" :key="o" :value="o">
            {{ t(`study.settings.order.${o}`) }}
          </option>
        </select>
      </label>
      <label class="row">
        {{ t('study.settings.hideReviewed') }}
        <select
          :value="settingsStore.settings['review.hideMinutes']"
          @change="
            setSetting(
              'review.hideMinutes',
              Number(($event.target as HTMLSelectElement).value) as never
            )
          "
        >
          <option :value="0">{{ t('study.settings.hideNever') }}</option>
          <option v-for="m in [10, 30, 60, 180, 720]" :key="m" :value="m">
            {{ t('study.settings.hideFor', { text: hideLabel(m) }) }}
          </option>
        </select>
      </label>
      <p class="muted">{{ t('study.settings.hideHint') }}</p>
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
        <button type="button" class="btn btn--sm" :disabled="backfilling" @click="backfill">
          {{ t('study.settings.backfill') }}
        </button>
      </div>
    </PxPanel>

    <PxPanel class="block">
      <h2>{{ t('study.settings.quickTranslate') }}</h2>
      <label class="row">
        {{ t('study.settings.autoCopy') }}
        <input
          type="checkbox"
          :checked="settingsStore.settings['translate.autoCopy']"
          @change="setSetting('translate.autoCopy', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <p class="muted">{{ t('study.settings.autoCopyHint') }}</p>
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
          ><UiIcon name="check" /> {{ t('tts.ready') }}</span
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
          <button type="button" class="btn btn--sm" @click="ttsModel.cancel()">
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
          <button type="button" class="btn btn--sm" @click="ttsModel.install()">
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
              <button type="button" class="btn btn--sm" @click="speak(t('tts.testText'), 'us')">
                <UiIcon name="volume" /> {{ t('tts.test') }}
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
              <button type="button" class="btn btn--sm" @click="speak(t('tts.testText'), 'uk')">
                <UiIcon name="volume" /> {{ t('tts.test') }}
              </button>
            </span>
          </label>
          <p v-if="naturalVoice" class="muted">{{ t('tts.cacheHint') }}</p>
        </template>
      </template>
    </PxPanel>

    <PxPanel class="block">
      <AudioPackPanel />
    </PxPanel>

    <PxPanel class="block">
      <SpritePackPanel />
    </PxPanel>

    <PxPanel class="block">
      <h2>{{ t('speech.settingsTitle') }}</h2>
      <p class="muted">{{ t('speech.settingsHint') }}</p>
      <div v-if="stt.status.value?.state === 'downloading'" class="download">
        <span class="muted">{{ t('tts.downloading', { done: sttDoneMb, total: sttSizeMb }) }}</span>
        <progress :value="stt.status.value.receivedBytes" :max="stt.status.value.sizeBytes" />
        <button type="button" class="btn btn--sm" @click="stt.cancel()">
          {{ t('tts.cancel') }}
        </button>
      </div>
      <div v-else-if="stt.status.value?.state === 'ready'" class="download">
        <span class="muted"
          ><UiIcon name="check" /> {{ t('speech.whisperReady', { size: sttSizeMb }) }}</span
        >
      </div>
      <div v-else-if="stt.status.value" class="download">
        <span class="muted">{{ t('speech.whisperNeed', { size: sttSizeMb }) }}</span>
        <span v-if="stt.status.value.errorKey" class="error">{{
          t(stt.status.value.errorKey)
        }}</span>
        <button type="button" class="btn btn--sm" @click="stt.install()">
          {{ stt.status.value.errorKey ? t('tts.retry') : t('tts.download') }}
        </button>
      </div>
      <div class="download">
        <strong>{{ t('speech.pronTitle') }}</strong>
        <span class="muted">{{ t('speech.pronHint') }}</span>
        <template v-if="stt.pronunciation.value?.available">
          <progress
            v-if="stt.pronunciation.value.state === 'downloading'"
            :value="stt.pronunciation.value.receivedBytes"
            :max="stt.pronunciation.value.sizeBytes"
          />
          <span v-else-if="stt.pronunciation.value.state === 'ready'" class="muted"
            ><UiIcon name="check" /> {{ t('speech.pronReady') }}</span
          >
          <button v-else type="button" class="btn btn--sm" @click="stt.installPronunciation()">
            {{ t('speech.pronDownload', { size: pronSizeMb }) }}
          </button>
        </template>
        <span v-else class="muted">{{ t('speech.pronSoon') }}</span>
      </div>
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
      <h2>{{ t('update.title') }}</h2>
      <p class="muted">
        {{ t('update.current', { version: update.status.value?.currentVersion ?? '…' }) }}
      </p>
      <label class="row">
        {{ t('update.auto') }}
        <input
          type="checkbox"
          :checked="settingsStore.settings['app.autoUpdate']"
          @change="setSetting('app.autoUpdate', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <div v-if="update.status.value" class="download">
        <span class="muted">{{
          t(`update.state.${update.status.value.state}`, {
            version: update.status.value.version ?? '',
            percent: update.status.value.percent,
            size: updateMb
          })
        }}</span>
        <progress
          v-if="update.status.value.state === 'downloading'"
          :value="update.status.value.percent"
          max="100"
        />
        <span v-if="update.status.value.errorKey" class="error">{{
          t(update.status.value.errorKey)
        }}</span>
        <span class="controls">
          <button
            v-if="update.status.value.state === 'available'"
            type="button"
            class="btn btn--sm"
            @click="update.download()"
          >
            {{ t('update.download') }}
          </button>
          <button
            v-else-if="update.status.value.state === 'ready'"
            type="button"
            class="btn btn--sm"
            @click="update.install()"
          >
            {{ t('update.install') }}
          </button>
          <button
            v-else
            type="button"
            class="btn btn--sm"
            :disabled="['disabled', 'checking', 'downloading'].includes(update.status.value.state)"
            @click="update.check()"
          >
            {{ t('update.check') }}
          </button>
        </span>
      </div>
      <p class="muted small">{{ t('update.privacy') }}</p>
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
.small {
  font-size: var(--fs-xs);
}
.settings {
  display: grid;
  gap: 16px;
  max-width: 680px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
h2 {
  margin: 0 0 8px;
  font-size: var(--fs-lg);
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
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  border-radius: var(--r-md);
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
  border: 1px solid var(--c-line);
  background: var(--c-bg);
  border-radius: var(--r-md);
}
.profile.active {
  border-width: var(--px);
  background: var(--c-primary-soft);
}
.edit {
  display: grid;
  flex: 1;
  gap: var(--sp-2);
}
.edit label {
  display: grid;
  gap: 4px;
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
}
.edit .warn {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-warning-soft);
  color: #7a5200;
  font-size: var(--fs-xs);
}
.edit-actions {
  display: flex;
  gap: var(--sp-2);
}
.saved-note {
  margin: var(--sp-2) 0 0;
  color: var(--c-success);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.tag {
  margin-left: 6px;
  padding: 0 5px;
  font-size: 11px;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
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
</style>
