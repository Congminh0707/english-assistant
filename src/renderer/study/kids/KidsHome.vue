<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { KidsHome } from '@shared/schemas/kids'
import { useTts } from '@renderer/shared/composables/useTts'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import { TILES, type KidsTile } from './kidsText'

// Màn hình chính của bé: vài ô thật to có hình, bấm là nghe tên ô — bé chưa biết đọc vẫn tự chọn được.
defineProps<{ home: KidsHome | null }>()
const emit = defineEmits<{ open: [id: KidsTile['id']] }>()

const { t } = useI18n()
const { speak } = useTts()

function tap(tile: KidsTile): void {
  speak(tile.say, 'us', 0.85)
  emit('open', tile.id)
}
</script>

<template>
  <section class="k-screen">
    <h1 class="k-title">{{ home ? `Hello, ${home.petName}!` : 'Hello!' }}</h1>
    <div class="grid">
      <button
        v-for="tile in TILES"
        :key="tile.id"
        type="button"
        class="k-big tile"
        @click="tap(tile)"
      >
        <PixelPicture :id="tile.picture" :size="128" />
        <span class="label">{{ tile.say }}</span>
        <span class="vi">{{ t(tile.viKey) }}</span>
        <span v-if="tile.id === 'play' && home?.dueCount" class="badge">{{ home.dueCount }}</span>
        <span v-if="tile.id === 'stickers' && home" class="badge soft">
          {{ home.stickersEarned }}/{{ home.stickersTotal }}
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 22px;
  width: 100%;
}
.tile {
  position: relative;
  padding: 18px 12px 14px;
}
.label {
  font-size: 28px;
}
.vi {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-ink-soft);
}
.badge {
  position: absolute;
  top: 10px;
  right: 12px;
  min-width: 34px;
  padding: 2px 8px;
  border: 2px solid var(--c-line);
  border-radius: 20px;
  background: var(--c-danger);
  color: #fff;
  font-size: 20px;
  text-align: center;
}
.badge.soft {
  background: var(--c-warning);
  color: var(--c-ink);
}
</style>
