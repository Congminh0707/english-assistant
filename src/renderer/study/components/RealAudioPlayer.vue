<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { realAudioText } from '@shared/audioPack'
import { invoke } from '@renderer/shared/ipc'
import { useAudioPack } from '@renderer/shared/composables/useTts'
import AudioPackPanel from '@renderer/shared/components/AudioPackPanel.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Trình nghe bản thu thật (VOA...): file MP3 nằm trong gói âm thanh tải thêm, lấy qua kênh `audio:clip`.
// Không căn giờ từng câu: phát cả bài, lời thoại hiện theo đoạn (ẩn/hiện, bản dịch), chỉnh tốc độ 0,6–1×.
const props = defineProps<{
  title?: string
  lines: Array<{ en: string; vi?: string }>
  hideText?: boolean
  recording: { id: string; sourceUrl: string; credit: string; seconds: number }
}>()

const { t } = useI18n()
const { status } = useAudioPack()

const SPEEDS = [0.6, 0.8, 1] as const
const speed = ref<(typeof SPEEDS)[number]>(1)
const showText = ref(!props.hideText)
const showVi = ref(false)
const url = ref<string | null>(null)
const player = ref<HTMLAudioElement | null>(null)

const hasVi = props.lines.some((l) => l.vi)

async function load(): Promise<void> {
  if (url.value) return
  const clip = await invoke('audio:clip', {
    text: realAudioText(props.recording.id),
    accent: 'us',
    rate: 1
  }).catch(() => null)
  if (clip)
    url.value = URL.createObjectURL(new Blob([new Uint8Array(clip.audio)], { type: clip.mime }))
}

// Gói chưa cài lúc mở bài → tải xong (state 'ready') thì lấy bản thu ngay
watch(
  () => status.value?.state,
  () => void load(),
  { immediate: true }
)

function setSpeed(next: (typeof SPEEDS)[number]): void {
  speed.value = next
  if (player.value) player.value.playbackRate = next
}
// Đặt lại tốc độ khi <audio> mới được tạo (blob URL xong)
watch(url, () => {
  if (player.value) player.value.playbackRate = speed.value
})

onUnmounted(() => {
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <div class="real">
    <div class="card top">
      <strong v-if="title" class="now-title"><UiIcon name="headphones" /> {{ title }}</strong>
      <audio
        v-if="url"
        ref="player"
        :src="url"
        controls
        preload="metadata"
        class="audio"
        @loadedmetadata="player && (player.playbackRate = speed)"
      />
      <div v-else class="missing">
        <p class="muted">{{ t('player.real.needPack') }}</p>
        <AudioPackPanel compact />
      </div>
      <div class="speed" role="group" :aria-label="t('player.speed')">
        <span class="muted">{{ t('player.speed') }}</span>
        <span class="seg">
          <button
            v-for="s in SPEEDS"
            :key="s"
            type="button"
            class="seg-btn"
            :class="{ on: speed === s }"
            @click="setSpeed(s)"
          >
            {{ s }}×
          </button>
        </span>
      </div>
      <p class="muted small credit">
        {{ recording.credit }} ·
        <a :href="recording.sourceUrl" target="_blank" rel="noopener noreferrer">{{
          t('player.real.source')
        }}</a>
      </p>
    </div>

    <div class="card talk">
      <header class="talk-head">
        <h2>{{ t('player.lines') }}</h2>
        <div class="toggles">
          <button type="button" class="btn btn--sm" @click="showText = !showText">
            {{ showText ? t('player.hideText') : t('player.showText') }}
          </button>
          <button v-if="hasVi" type="button" class="btn btn--sm" @click="showVi = !showVi">
            {{ showVi ? t('player.hideVi') : t('player.showVi') }}
          </button>
        </div>
      </header>
      <p v-if="!showText" class="muted">{{ t('player.hidden') }}</p>
      <ol v-else class="paras">
        <li v-for="(line, i) in lines" :key="i">
          {{ line.en }}
          <small v-if="showVi && line.vi" class="vi">{{ line.vi }}</small>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.real {
  display: grid;
  gap: var(--sp-4);
}
.top {
  display: grid;
  gap: var(--sp-3);
}
.audio {
  width: 100%;
}
.now-title {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}
.speed {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.seg {
  display: inline-flex;
  gap: var(--sp-1);
}
.seg-btn {
  padding: var(--sp-1) var(--sp-3);
  border: 1px solid var(--c-line);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  color: var(--c-ink);
  cursor: pointer;
}
.seg-btn.on {
  background: var(--c-primary);
  color: var(--c-on-primary, #fff);
  border-color: var(--c-primary);
}
.talk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  flex-wrap: wrap;
}
.toggles {
  display: flex;
  gap: var(--sp-2);
}
.paras {
  margin: var(--sp-3) 0 0;
  padding-left: var(--sp-5);
  display: grid;
  gap: var(--sp-3);
  line-height: 1.6;
}
.vi {
  display: block;
  color: var(--c-ink-soft);
}
.small {
  font-size: 0.85em;
}
</style>
