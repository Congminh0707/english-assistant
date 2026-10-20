<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { InventoryItem } from '@shared/schemas/pet'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useTts } from '@renderer/shared/composables/useTts'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import { FOOD_NAME, FOOD_PICTURE } from './kidsText'

// Thú cưng của bé: xem no/vui/khoẻ bằng trái tim, cho ăn bằng đồ ăn kiếm được khi học (bấm vào hình món ăn).
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()

const foods = ref<InventoryItem[]>([])
const happy = ref(false)

const hearts = (value: number | undefined): string => {
  const full = Math.round(((value ?? 0) / 100) * 5)
  return '♥'.repeat(full) + '♡'.repeat(5 - full)
}

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
  <section class="k-screen">
    <h1 class="k-title">{{ petStore.pet?.name ?? '…' }}</h1>
    <div class="pet" :class="{ happy }">
      <PixelPicture id="cat" :size="200" />
    </div>
    <div class="meters">
      <div v-for="m in meters" :key="m.key" class="meter">
        <PixelPicture :id="m.icon" :size="40" />
        <span class="hearts">{{ hearts(m.value) }}</span>
      </div>
    </div>

    <p class="k-sub">{{ foods.length ? t('kids.pet.feedHint') : t('kids.pet.noFood') }}</p>
    <div class="k-row">
      <button v-for="f in foods" :key="f.itemId" type="button" class="k-big food" @click="feed(f)">
        <PixelPicture :id="FOOD_PICTURE[f.itemId]" :size="90" />
        <span class="name">{{ FOOD_NAME[f.itemId] }}</span>
        <span class="qty">×{{ f.quantity }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.pet.happy {
  animation: k-bounce 500ms ease 2;
}
.meters {
  display: grid;
  gap: 8px;
}
.meter {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hearts {
  font-size: 28px;
  letter-spacing: 3px;
  color: var(--c-danger);
}
.food {
  min-width: 130px;
}
.name {
  font-size: 18px;
}
.qty {
  font-size: 16px;
  color: var(--c-ink-soft);
}
</style>
