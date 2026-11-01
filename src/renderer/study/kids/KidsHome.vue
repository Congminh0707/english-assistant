<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { KidsHome } from '@shared/schemas/kids'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { usePetStore } from '@renderer/shared/stores/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import { normalizeCharacterId } from '@shared/characters'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import { TILES, type KidsTile } from './kidsText'

// Màn hình chính của bé: vài ô thật to có hình, bấm là nghe tên ô — bé chưa biết đọc vẫn tự chọn được.
defineProps<{ home: KidsHome | null }>()
const emit = defineEmits<{ open: [id: KidsTile['id']] }>()

const { t } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()

function tap(tile: KidsTile): void {
  speak(tile.say, 'us', 0.85)
  emit('open', tile.id)
}
</script>

<template>
  <section class="home">
    <div class="pet">
      <span class="k-bubble hello">{{ home ? `Hello, ${home.petName}!` : 'Hello!' }}</span>
      <PetSprite
        v-if="petStore.pet"
        :character="normalizeCharacterId(petStore.pet.characterId)"
        :stage="petStore.pet.stage"
        :accessories="petStore.pet.equipped"
        pose="hello"
        :size="220"
        animate
      />
    </div>
    <div class="grid">
      <button
        v-for="tile in TILES"
        :key="tile.id"
        type="button"
        class="k-big tile"
        @click="tap(tile)"
      >
        <span class="pic"><PixelPicture :id="tile.picture" :size="96" /></span>
        <span class="text">
          <span class="label">{{ tile.say }}</span>
          <span class="vi">{{ t(tile.viKey) }}</span>
          <UiIcon name="volume" :size="24" class="say" />
        </span>
        <span v-if="tile.id === 'play' && home?.dueCount" class="k-badge">{{ home.dueCount }}</span>
        <span v-if="tile.id === 'stickers' && home" class="k-badge soft">
          {{ home.stickersEarned }}/{{ home.stickersTotal }}
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
  gap: var(--sp-6);
  align-items: center;
  width: 100%;
  max-width: 1080px;
  margin: var(--sp-6) auto 0;
  font-family: var(--font-kids);
}
.pet {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
}
.hello {
  font-size: 28px;
  white-space: nowrap;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-6) var(--sp-5);
}
.tile {
  display: flex;
  gap: var(--sp-4);
  justify-content: flex-start;
  min-height: 150px;
  min-width: 0;
  text-align: left;
}
.pic {
  display: grid;
  place-items: center;
  flex: none;
  width: 120px;
  height: 120px;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
}
.text {
  display: grid;
  gap: var(--sp-1);
  justify-items: start;
}
.label {
  font-size: 30px;
}
.vi {
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-ink-soft);
}
.say {
  color: var(--c-warning);
}
@media (max-width: 900px) {
  .home {
    grid-template-columns: 1fr;
  }
}
</style>
