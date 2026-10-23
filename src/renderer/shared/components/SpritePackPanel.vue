<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSpritePack } from '@renderer/shared/pet/hires'
import PxBar from './PxBar.vue'
import UiIcon from './UiIcon.vue'

// Gói sprite thú cưng độ phân giải cao (288px, tải thêm): hiện trong Cài đặt. Bộ cài chỉ có sprite 96px.
const { t } = useI18n()
const pack = useSpritePack()

const state = computed(() => pack.status.value?.state ?? 'not-installed')
const sizeMb = computed(() =>
  Math.max(1, Math.round((pack.status.value?.sizeBytes ?? 0) / 1_048_576))
)
const percent = computed(() => {
  const s = pack.status.value
  return s && s.sizeBytes ? Math.min(100, Math.round((s.receivedBytes / s.sizeBytes) * 100)) : 0
})
</script>

<template>
  <div class="sprite-pack">
    <div class="text">
      <strong><UiIcon name="pet" /> {{ t('spritePack.title') }}</strong>
      <span class="muted">{{ t('spritePack.desc', { mb: sizeMb }) }}</span>
    </div>
    <div class="actions">
      <template v-if="state === 'downloading'">
        <PxBar :value="percent" :max="100" />
        <span class="muted">{{ t('spritePack.downloading', { pct: percent }) }}</span>
        <button type="button" class="btn" @click="pack.cancel()">
          {{ t('spritePack.cancel') }}
        </button>
      </template>
      <template v-else-if="state === 'ready'">
        <span class="ok"><UiIcon name="check" /> {{ t('spritePack.ready') }}</span>
        <template v-if="pack.status.value?.updateAvailable">
          <span class="chip chip--primary">{{ t('spritePack.updateAvailable') }}</span>
          <button type="button" class="btn btn--primary btn--sm" @click="pack.install()">
            {{ t('spritePack.update', { mb: sizeMb }) }}
          </button>
          <span v-if="pack.status.value?.errorKey" class="err">{{
            t(pack.status.value.errorKey)
          }}</span>
        </template>
        <button type="button" class="btn" @click="pack.remove()">
          {{ t('spritePack.remove') }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="btn btn--primary" @click="pack.install()">
          {{ state === 'error' ? t('spritePack.retry') : t('spritePack.download', { mb: sizeMb }) }}
        </button>
        <span v-if="state === 'error'" class="err">{{
          t(pack.status.value?.errorKey ?? 'errors.modelDownload')
        }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sprite-pack {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--c-surface);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
}
.text {
  display: grid;
  gap: 2px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  align-items: center;
}
.muted {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.ok {
  color: #1f8a4c;
  font-weight: 700;
}
.err {
  color: var(--c-danger);
  font-size: var(--fs-sm);
}
</style>
