<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TRACKS, type LevelCode, type Track } from '@shared/schemas/content/level'
import { cefrLabel } from '@shared/placement'
import { isChildTrack } from '@shared/schemas/profile'
import { invoke } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { petName as sharedPetName } from '@renderer/shared/i18n'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Màn hình chào lần đầu: tên + mục tiêu → tên thú cưng → trình độ (làm kiểm tra hoặc tự chọn).
const emit = defineEmits<{ done: [startTest: boolean] }>()

const { t } = useI18n()
const settingsStore = useSettingsStore()

const step = ref(1)
const name = ref('')
const track = ref<Track>('general')
const petName = ref('Bi')
// Văn bản các bước sau nhắc tên thú cưng ngay khi người dùng gõ
watch(petName, (name) => (sharedPetName.value = name.trim() || 'Bi'), { immediate: true })
const busy = ref(false)
const failed = ref(false)

const MANUAL_LEVELS: Array<{ level: LevelCode }> = [
  { level: 'PA1_2' },
  { level: 'A1_1' },
  { level: 'A2_1' },
  { level: 'B1_1' },
  { level: 'B2_1' },
  { level: 'C1' }
]

const canNext = computed(() =>
  step.value === 1 ? name.value.trim().length > 0 : petName.value.trim().length > 0
)

async function finish(startTest: boolean, level?: LevelCode): Promise<void> {
  if (busy.value) return
  busy.value = true
  failed.value = false
  try {
    await invoke('profile:setup', {
      name: name.value.trim(),
      track: track.value,
      petName: petName.value.trim() || undefined
    })
    if (level) await settingsStore.set('learning.level', level)
    emit('done', startTest)
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="overlay">
    <div class="card box" role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <h1 id="onb-title">{{ t('study.onboarding.title') }}</h1>
      <div class="steps" aria-hidden="true">
        <span v-for="n in 3" :key="n" class="dot" :class="{ on: n <= step }" />
      </div>

      <template v-if="step === 1">
        <h2>{{ t('study.onboarding.step1') }}</h2>
        <label class="field">
          {{ t('study.onboarding.name') }}
          <input
            v-model="name"
            type="text"
            maxlength="40"
            :placeholder="t('study.onboarding.namePlaceholder')"
            @keydown.enter="canNext && (step = 2)"
          />
        </label>
        <div class="field">
          {{ t('study.onboarding.goal') }}
          <div class="tracks">
            <button
              v-for="tr in TRACKS"
              :key="tr"
              type="button"
              class="chip-btn"
              :class="{ active: track === tr }"
              @click="track = tr"
            >
              {{ t(`study.tracks.${tr}`) }}
            </button>
          </div>
          <p v-if="isChildTrack(track)" class="hint">{{ t('study.onboarding.childNote') }}</p>
        </div>
      </template>

      <template v-else-if="step === 2">
        <h2>{{ t('study.onboarding.step2') }}</h2>
        <label class="field">
          {{ t('study.onboarding.petName') }}
          <input
            v-model="petName"
            type="text"
            maxlength="20"
            @keydown.enter="canNext && (step = 3)"
          />
        </label>
      </template>

      <template v-else>
        <h2>{{ t('study.onboarding.step3') }}</h2>
        <button
          type="button"
          class="btn btn--primary btn--lg"
          :disabled="busy"
          @click="finish(true)"
        >
          <UiIcon name="test" /> {{ t('study.onboarding.takeTest') }}
        </button>
        <p class="hint">{{ t('study.onboarding.takeTestHint') }}</p>
        <div class="field">
          {{ t('study.onboarding.pickLevel') }}
          <div class="tracks">
            <button
              v-for="l in MANUAL_LEVELS"
              :key="l.level"
              type="button"
              class="chip-btn"
              :disabled="busy"
              @click="finish(false, l.level)"
            >
              {{ cefrLabel(l.level) }}
            </button>
          </div>
        </div>
      </template>

      <p v-if="failed" class="fail" role="alert">{{ t('study.state.error') }}</p>

      <footer class="nav">
        <button v-if="step > 1" type="button" class="btn btn--ghost btn--sm" @click="step--">
          {{ t('study.onboarding.back') }}
        </button>
        <span class="spacer" />
        <button
          v-if="step < 3"
          type="button"
          class="btn btn--primary"
          :disabled="!canNext"
          @click="step++"
        >
          {{ t('study.onboarding.next') }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-5);
  background: color-mix(in srgb, var(--c-ink) 55%, transparent);
}
.box {
  display: grid;
  gap: var(--sp-4);
  width: min(560px, 100%);
  padding: var(--sp-5) var(--sp-6);
  box-shadow: var(--shadow-md);
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
h2 {
  margin: 0;
  font-size: var(--fs-lg);
  color: var(--c-primary);
}
.steps {
  display: flex;
  gap: var(--sp-2);
}
.dot {
  width: 28px;
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
}
.dot.on {
  background: var(--c-primary);
}
.field {
  display: grid;
  gap: 6px;
  font-weight: 600;
}
input {
  box-sizing: border-box;
  font-weight: 400;
}
input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
}
.tracks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.chip-btn {
  min-height: var(--btn-h-sm);
  padding: 0 var(--sp-3);
  border: 2px solid var(--c-line);
  border-radius: var(--r-pill);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
}
.chip-btn:hover:not(:disabled) {
  background: var(--c-primary-soft);
}
.chip-btn.active {
  border-color: var(--c-coin);
  background: var(--c-primary);
  color: var(--c-on-primary);
  font-weight: 700;
}
.chip-btn:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.hint {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: 400;
  color: var(--c-ink-soft);
}
.fail {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-weight: 600;
}
.nav {
  display: flex;
  align-items: center;
}
.spacer {
  flex: 1;
}
</style>
