<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsStickers } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Album sticker: mỗi hình bé đã trả lời đúng trong thẻ "nghe → chạm hình" thì được dán (hình còn lại là bóng mờ).
const { t } = useI18n()
const { speak } = useTts()

const data = ref<KidsStickers | null>(null)

const progress = computed(() => (data.value ? `${data.value.earned} / ${data.value.total}` : ''))

onMounted(async () => {
  data.value = await invoke('kids:stickers')
})
</script>

<template>
  <section class="k-screen wide">
    <div class="k-row head">
      <span class="k-bubble progress">
        <UiIcon name="star" :size="30" class="fill" />
        {{ progress || t('kids.loading') }}
      </span>
      <p class="k-sub">{{ t('kids.album.hint') }}</p>
    </div>
    <div class="grid">
      <button
        v-for="s in data?.stickers ?? []"
        :key="s.pictureId"
        type="button"
        class="slot"
        :class="{ earned: s.earned }"
        :disabled="!s.earned"
        :title="s.earned ? `${s.word} — ${s.vi}` : ''"
        @click="speak(s.word, 'us', 0.8)"
      >
        <PictureImage :id="s.pictureId" :size="84" class="pic" />
        <span v-if="s.earned" class="word">{{ s.word }}</span>
        <span v-else class="q">?</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.wide {
  max-width: 1000px;
}
.head {
  gap: var(--sp-4);
}
.progress {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: 28px;
}
.progress .fill {
  color: var(--c-coin);
  fill: currentcolor;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: var(--sp-4);
  width: 100%;
  padding-bottom: var(--sp-3);
}
.slot {
  display: grid;
  gap: var(--sp-1);
  justify-items: center;
  padding: var(--sp-3) var(--sp-1) var(--sp-2);
  border: 3px dashed var(--c-ink-soft);
  border-radius: var(--r-md);
  background: transparent;
  font: inherit;
  font-family: var(--font-kids);
  color: var(--c-ink);
  cursor: default;
}
.slot.earned {
  border: 3px solid var(--c-ink);
  background: var(--c-surface);
  cursor: pointer;
  box-shadow: 0 4px 0 var(--c-ink);
}
.slot.earned:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--c-ink);
}
.pic {
  filter: brightness(0) opacity(0.18);
}
.slot.earned .pic {
  filter: none;
}
.word {
  font-size: 18px;
  font-weight: 800;
}
.q {
  font-size: 20px;
  font-weight: 800;
  color: var(--c-ink-soft);
}
</style>
