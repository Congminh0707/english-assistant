<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { InventoryItem } from '@shared/schemas/pet'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import { normalizeCharacterId } from '@shared/characters'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import { FOOD_NAME, FOOD_PICTURE } from './kidsText'

// Thú cưng của bé: xem no/vui/khoẻ bằng trái tim, cho ăn bằng đồ ăn kiếm được khi học (bấm vào hình món ăn).
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()

const foods = ref<InventoryItem[]>([])
const happy = ref(false)

const hearts = (value: number | undefined): number => Math.round(((value ?? 0) / 100) * 5)

const meters = computed(() => [
  { key: 'hunger', icon: 'rice', value: petStore.pet?.hunger },
  { key: 'mood', icon: 'heart', value: petStore.pet?.mood },
  { key: 'energy', icon: 'sun', value: petStore.pet?.energy }
])

async function load(): Promise<void> {
  await petStore.load()
  foods.value = (await invoke('inventory:list')).filter(
    (i) => i.quantity > 0 && i.itemId in FOOD_PICTURE
  )
}

async function feed(item: InventoryItem): Promise<void> {
  try {
    await invoke('pet:feed', { itemId: item.itemId })
    speak('Yum!', 'us', 0.9)
    happy.value = true
    window.setTimeout(() => (happy.value = false), 900)
    await load()
    emit('changed')
  } catch (err) {
    console.warn('[kids] feed failed', err)
    speak('No thanks!', 'us', 0.9)
  }
}

onMounted(load)
</script>

<template>
  <section class="pet-screen">
    <div class="who">
      <span class="k-bubble name">{{ petStore.pet?.name ?? t('kids.loading') }}</span>
      <div class="pet" :class="{ happy }">
        <PetSprite
          v-if="petStore.pet"
          :character="normalizeCharacterId(petStore.pet.characterId)"
          :stage="petStore.pet.stage"
          :accessories="petStore.pet.equipped"
          :pose="happy ? 'happy' : 'idle'"
          :size="240"
          animate
        />
      </div>
    </div>
    <div class="side">
      <div class="k-big meters">
        <div v-for="m in meters" :key="m.key" class="meter">
          <PictureImage :id="m.icon" :size="40" />
          <span class="hearts" role="img" :aria-label="`${hearts(m.value)} / 5`">
            <UiIcon
              v-for="n in 5"
              :key="n"
              name="heart"
              :size="32"
              :class="n <= hearts(m.value) ? 'on' : 'off'"
            />
          </span>
        </div>
      </div>

      <p class="k-sub">{{ foods.length ? t('kids.pet.feedHint') : t('kids.pet.noFood') }}</p>
      <div v-if="foods.length" class="k-row">
        <button
          v-for="f in foods"
          :key="f.itemId"
          type="button"
          class="k-big food"
          @click="feed(f)"
        >
          <PictureImage :id="FOOD_PICTURE[f.itemId]" :size="72" />
          <span class="name-food">{{ FOOD_NAME[f.itemId] }}</span>
          <span class="k-badge soft">×{{ f.quantity }}</span>
        </button>
      </div>
      <div v-else class="empty">
        <PictureImage id="cake" :size="72" class="ghost" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.pet-screen {
  display: grid;
  grid-template-columns: minmax(180px, 280px) minmax(0, 1fr);
  gap: var(--sp-6);
  align-items: center;
  width: 100%;
  max-width: 1000px;
  margin: var(--sp-4) auto 0;
  font-family: var(--font-kids);
}
.who {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
}
.name {
  font-size: 30px;
}
.pet.happy {
  animation: k-bounce 500ms ease 2;
}
.side {
  display: grid;
  gap: var(--sp-5);
  justify-items: center;
}
.meters {
  display: grid;
  gap: var(--sp-2);
  width: fit-content;
  padding: var(--sp-4) var(--sp-6);
  justify-items: start;
  cursor: default;
}
.meter {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
}
.hearts {
  display: inline-flex;
  gap: var(--sp-1);
}
.hearts .on {
  color: var(--c-danger);
  fill: currentcolor;
}
.hearts .off {
  color: var(--c-line);
}
.food {
  min-width: 120px;
  padding: var(--sp-3) var(--sp-4);
}
.name-food {
  font-size: 18px;
}
.empty {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 120px;
  border: 3px dashed var(--c-ink-soft);
  border-radius: var(--r-lg);
}
.ghost {
  opacity: 0.3;
  filter: grayscale(1);
}
@media (prefers-reduced-motion: reduce) {
  .pet.happy {
    animation: none;
  }
}
@media (max-width: 900px) {
  .pet-screen {
    grid-template-columns: 1fr;
  }
}
</style>
