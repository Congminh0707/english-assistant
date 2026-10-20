<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsStickers } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'

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
  <section class="k-screen">
    <h1 class="k-title">⭐ {{ progress }}</h1>
    <p class="k-sub">{{ t('kids.album.hint') }}</p>
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
        <PixelPicture :id="s.pictureId" :size="84" class="pic" />
        <span v-if="s.earned" class="word">{{ s.word }}</span>
        <span v-else class="q">?</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 12px;
  width: 100%;
}
.slot {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 10px 4px 8px;
  border: 3px dashed var(--c-ink-soft);
  border-radius: 12px;
  background: transparent;
  font: inherit;
  cursor: default;
}
.slot.earned {
  border: 3px solid var(--c-border);
  background: var(--c-surface);
  cursor: pointer;
  box-shadow: 0 4px 0 0 var(--c-border);
}
.pic {
  filter: brightness(0) opacity(0.18);
}
.slot.earned .pic {
  filter: none;
}
.word {
  font-size: 15px;
  font-weight: 800;
}
.q {
  font-size: 18px;
  color: var(--c-ink-soft);
}
</style>
