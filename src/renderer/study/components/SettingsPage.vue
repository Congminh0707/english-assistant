<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Box, Info, Languages, Moon, Repeat, User, Volume2 } from 'lucide-vue-next'
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
import { AI_MODELS } from '@shared/schemas/ai'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { useUpdateStatus } from '@renderer/shared/composables/useUpdateStatus'
import AudioPackPanel from '@renderer/shared/components/AudioPackPanel.vue'
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
const onlineStatus = ref<TranslateOnlineStatus>({
  hasKey: false,
  canStore: true,
  cloud: false,
  cloudKeys: { google: false, azure: false }
})
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

// Dịch online Google/Azure: key người dùng tự tạo, gửi thẳng sang main (mã hoá ở đó), renderer không giữ lại
const CLOUD_PROVIDERS = ['google', 'azure'] as const
type CloudProvider = (typeof CLOUD_PROVIDERS)[number]
const cloudKeyInput = ref<Record<CloudProvider, string>>({ google: '', azure: '' })
const azureRegionInput = ref('')
const cloudKeyMessage = ref<Record<CloudProvider, string>>({ google: '', azure: '' })

async function saveCloudKey(provider: CloudProvider): Promise<void> {
  cloudKeyMessage.value[provider] = ''
  try {
    onlineStatus.value = await invoke('translate:set-cloud-key', {
      provider,
      key: cloudKeyInput.value[provider],
      region: provider === 'azure' ? azureRegionInput.value : undefined
    })
    cloudKeyInput.value[provider] = ''
    if (provider === 'azure') azureRegionInput.value = ''
    cloudKeyMessage.value[provider] = t('translate.keySaved')
  } catch {
    cloudKeyMessage.value[provider] = onlineStatus.value.canStore
      ? t('translate.cloudKeyInvalid')
      : t('translate.keyCannotStore')
  }
}

async function clearCloudKey(provider: CloudProvider): Promise<void> {
  onlineStatus.value = await invoke('translate:clear-cloud-key', { provider })
  cloudKeyMessage.value[provider] = ''
}
// AI (Claude): dùng chung key của Dịch online; chỉ hiện số lượt gọi tháng này
const aiCalls = ref(0)
async function loadAiStatus(): Promise<void> {
  try {
    aiCalls.value = (await invoke('ai:status')).callsThisMonth
  } catch {
    // Không đọc được: giữ số cũ
  }
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
/** Hồ sơ trẻ em không dùng AI (docs/11 §5) */
const activeIsChild = computed(() => profiles.value.find((p) => p.active)?.isChild ?? false)
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
  { key: 'review.autoPlay', label: 'autoPlay' },
  { key: 'review.autoSaveReading', label: 'autoSaveReading' }
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

type Sect = 'profile' | 'review' | 'voice' | 'translate' | 'mascot' | 'update' | 'credits'
const SECTIONS = [
  { id: 'profile', icon: User },
  { id: 'review', icon: Repeat },
  { id: 'voice', icon: Volume2 },
  { id: 'translate', icon: Languages },
  { id: 'mascot', icon: Moon },
  { id: 'update', icon: Box },
  { id: 'credits', icon: Info }
] as const
const sect = ref<Sect>('profile')

onMounted(async () => {
  void loadProfiles()
  void loadAiStatus()
  try {
    onlineStatus.value = await invoke('translate:online-status')
  } catch {
    // Không đọc được trạng thái: giữ giá trị mặc định (chưa có khoá)
  }
})
</script>

<template>
  <section class="settings">
    <h1 class="page-title">{{ t('study.settings.title') }}</h1>

    <div class="layout">
      <nav class="snav" role="tablist">
        <button
          v-for="k in SECTIONS"
          :key="k.id"
          type="button"
          role="tab"
          class="snav-item"
          :class="{ on: sect === k.id }"
          :aria-selected="sect === k.id"
          @click="sect = k.id"
        >
          <component :is="k.icon" :size="16" :stroke-width="2.2" />{{
            t(`study.settings.sect.${k.id}`)
          }}
        </button>
      </nav>
      <div class="content">
        <section v-show="sect === 'profile'" class="card block">
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
                    · {{ t(`study.tracks.${p.track}`) }} · <UiIcon name="pet" />
                    {{ p.petName }}</span
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
              <option v-for="tr in TRACKS" :key="tr" :value="tr">
                {{ t(`study.tracks.${tr}`) }}
              </option>
            </select>
            <button type="submit" class="btn btn--sm" :disabled="!newName.trim()">
              {{ t('study.settings.create') }}
            </button>
          </form>
        </section>

        <section v-if="isDev" v-show="sect === 'profile'" class="card block">
          <h2>{{ t('study.settings.devTitle') }}</h2>
          <button type="button" class="btn btn--sm" @click="devGrantCoins">
            {{ t('study.settings.devGrantCoins') }}
          </button>
          <button type="button" class="btn btn--sm" @click="devLevelUp">
            {{ t('study.settings.devLevelUp') }}
          </button>
          <p v-if="devNote" class="saved-note">{{ devNote }}</p>
        </section>

        <section v-show="sect === 'profile'" class="card block">
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
          <label v-if="!activeIsChild" class="row">
            {{ t('study.settings.diaryHour') }}
            <!-- 'off' thay cho null: <option :value="null"> mất thuộc tính value -->
            <select
              :value="settingsStore.settings['diary.hour'] ?? 'off'"
              @change="
                setSetting(
                  'diary.hour',
                  ($event.target as HTMLSelectElement).value === 'off'
                    ? null
                    : Number(($event.target as HTMLSelectElement).value)
                )
              "
            >
              <option value="off">{{ t('study.settings.quizOff') }}</option>
              <option v-for="h in [19, 20, 21, 22, 23]" :key="h" :value="h">
                {{ `${h}:00` }}
              </option>
            </select>
          </label>
        </section>

        <section v-show="sect === 'translate'" class="card block">
          <h2>{{ t('translate.modelsTitle') }}</h2>
          <p class="muted">{{ t('translate.modelsHint') }}</p>
          <label class="row">
            {{ t('translate.preferHigh') }}
            <input
              type="checkbox"
              :checked="settingsStore.settings['translate.highQuality']"
              @change="
                setSetting('translate.highQuality', ($event.target as HTMLInputElement).checked)
              "
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
              <span
                v-else-if="trModels.statuses[dir].value?.state === 'downloading'"
                class="muted"
                >{{
                  t('translate.downloading', {
                    done: toMb(trModels.statuses[dir].value?.receivedBytes),
                    total: toMb(trModels.statuses[dir].value?.sizeBytes)
                  })
                }}</span
              >
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
        </section>

        <section v-show="sect === 'translate'" class="card block">
          <h2>{{ t('translate.cloudTitle') }}</h2>
          <p class="muted">{{ t('translate.cloudHint') }}</p>
          <label class="row">
            {{ t('translate.cloudToggle') }}
            <input
              type="checkbox"
              :checked="settingsStore.settings['translate.cloud']"
              @change="setSetting('translate.cloud', ($event.target as HTMLInputElement).checked)"
            />
          </label>
          <template v-for="provider in CLOUD_PROVIDERS" :key="provider">
            <h3>{{ t(`translate.cloudBadge.${provider}`) }}</h3>
            <div class="model">
              <input
                v-model="cloudKeyInput[provider]"
                type="password"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t(`translate.cloudKeyPlaceholder.${provider}`)"
                @keydown.enter="saveCloudKey(provider)"
              />
              <input
                v-if="provider === 'azure'"
                v-model="azureRegionInput"
                type="text"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t('translate.cloudRegionPlaceholder')"
                @keydown.enter="saveCloudKey(provider)"
              />
              <button
                type="button"
                class="btn btn--sm"
                :disabled="!cloudKeyInput[provider]"
                @click="saveCloudKey(provider)"
              >
                {{ t('translate.keySave') }}
              </button>
              <button
                v-if="onlineStatus.cloudKeys[provider]"
                type="button"
                class="btn btn--sm"
                @click="clearCloudKey(provider)"
              >
                {{ t('translate.keyClear') }}
              </button>
            </div>
            <p class="muted">
              {{
                cloudKeyMessage[provider] ||
                (onlineStatus.cloudKeys[provider]
                  ? t('translate.keySaved')
                  : t('translate.keyNone'))
              }}
            </p>
          </template>
        </section>

        <section v-show="sect === 'translate'" class="card block">
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
            {{
              keyMessage || (onlineStatus.hasKey ? t('translate.keySaved') : t('translate.keyNone'))
            }}
          </p>
        </section>

        <section v-if="!activeIsChild" v-show="sect === 'translate'" class="card block">
          <h2>{{ t('study.settings.ai.title') }}</h2>
          <p class="muted">{{ t('study.settings.ai.hint') }}</p>
          <label class="row">
            {{ t('study.settings.ai.toggle') }}
            <input
              type="checkbox"
              :checked="settingsStore.settings['ai.enabled']"
              @change="setSetting('ai.enabled', ($event.target as HTMLInputElement).checked)"
            />
          </label>
          <label class="row">
            {{ t('study.settings.ai.model') }}
            <select
              :value="settingsStore.settings['ai.model']"
              @change="setSetting('ai.model', ($event.target as HTMLSelectElement).value as never)"
            >
              <option v-for="m in AI_MODELS" :key="m" :value="m">
                {{ t(`study.settings.ai.models.${m}`) }}
              </option>
            </select>
          </label>
          <p class="muted">
            {{
              onlineStatus.hasKey ? t('study.settings.ai.sharedKey') : t('study.settings.ai.noKey')
            }}
          </p>
          <p class="muted">{{ t('study.settings.ai.calls', { n: aiCalls }) }}</p>
        </section>

        <section v-show="sect === 'review'" class="card block">
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
              @change="
                setSetting('review.order', ($event.target as HTMLSelectElement).value as never)
              "
            >
              <option
                v-for="o in ['random', 'mixed', 'new-first', 'review-first']"
                :key="o"
                :value="o"
              >
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
          <p class="muted">{{ t('study.settings.autoSaveReadingHint') }}</p>
          <div class="row">
            <span class="muted">{{ backfillMessage || t('study.settings.backfillHint') }}</span>
            <button type="button" class="btn btn--sm" :disabled="backfilling" @click="backfill">
              {{ t('study.settings.backfill') }}
            </button>
          </div>
        </section>

        <section v-show="sect === 'translate'" class="card block">
          <h2>{{ t('study.settings.quickTranslate') }}</h2>
          <label class="row">
            {{ t('study.settings.autoCopy') }}
            <input
              type="checkbox"
              :checked="settingsStore.settings['translate.autoCopy']"
              @change="
                setSetting('translate.autoCopy', ($event.target as HTMLInputElement).checked)
              "
            />
          </label>
          <p class="muted">{{ t('study.settings.autoCopyHint') }}</p>
        </section>

        <section v-show="sect === 'voice'" class="card block">
          <h2>{{ t('tts.title') }}</h2>
          <label class="row">
            {{ t('tts.accent') }}
            <select
              :value="settingsStore.settings['tts.accent']"
              @change="
                setSetting('tts.accent', ($event.target as HTMLSelectElement).value as never)
              "
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
        </section>

        <section v-show="sect === 'voice'" class="card block">
          <AudioPackPanel />
        </section>

        <section v-show="sect === 'voice'" class="card block">
          <h2>{{ t('speech.settingsTitle') }}</h2>
          <p class="muted">{{ t('speech.settingsHint') }}</p>
          <div v-if="stt.status.value?.state === 'downloading'" class="download">
            <span class="muted">{{
              t('tts.downloading', { done: sttDoneMb, total: sttSizeMb })
            }}</span>
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
        </section>

        <section v-show="sect === 'mascot'" class="card block">
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
                @change="
                  setSetting('quiet.dnd.enabled', ($event.target as HTMLInputElement).checked)
                "
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
        </section>

        <section v-show="sect === 'mascot'" class="card block">
          <h2>{{ t('study.settings.appearance') }}</h2>
          <label class="row">
            {{ t('study.settings.language') }}
            <select
              :value="settingsStore.settings['ui.language']"
              @change="
                setSetting('ui.language', ($event.target as HTMLSelectElement).value as never)
              "
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label class="row">
            {{ t('study.settings.theme') }}
            <select
              :value="settingsStore.settings['ui.theme']"
              @change="setSetting('ui.theme', ($event.target as HTMLSelectElement).value as never)"
            >
              <option value="system">{{ t('study.settings.themeSystem') }}</option>
              <option value="light">{{ t('study.settings.themeLight') }}</option>
              <option value="dark">{{ t('study.settings.themeDark') }}</option>
            </select>
          </label>
          <label class="row">
            {{ t('study.settings.size') }}
            <select
              :value="settingsStore.settings['mascot.scale']"
              @change="
                setSetting(
                  'mascot.scale',
                  Number(($event.target as HTMLSelectElement).value) as never
                )
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
        </section>

        <section v-show="sect === 'update'" class="card block">
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
                :disabled="
                  ['disabled', 'checking', 'downloading'].includes(update.status.value.state)
                "
                @click="update.check()"
              >
                {{ t('update.check') }}
              </button>
            </span>
          </div>
          <p class="muted small">{{ t('update.privacy') }}</p>
        </section>

        <section v-show="sect === 'credits'" class="card block">
          <h2>{{ t('credits.title') }}</h2>
          <ul class="credits">
            <li v-for="k in CREDIT_KEYS" :key="k">{{ t(`credits.${k}`) }}</li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.small {
  font-size: var(--fs-xs);
}
.settings {
  display: grid;
  gap: var(--sp-3);
  max-width: 100%;
}
.settings .page-title {
  margin: 0;
}
.layout {
  display: grid;
  grid-template-columns: 172px minmax(0, 1fr);
  gap: var(--sp-5);
  align-items: start;
}
.content {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
.snav {
  position: sticky;
  top: 0;
  display: grid;
  gap: var(--sp-1);
}
.snav-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: 36px;
  padding: 0 var(--sp-3);
  border: 0;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.snav-item:hover {
  background: var(--c-surface-2);
}
.snav-item.on {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .snav {
    position: static;
    display: flex;
    flex-wrap: wrap;
  }
  .snav-item {
    white-space: nowrap;
  }
}
h2 {
  margin: 0 0 8px;
  font-size: var(--fs-lg);
}
.block {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-4);
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
  color: var(--c-warning);
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
  color: var(--c-on-primary);
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
