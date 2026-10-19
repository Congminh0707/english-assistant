<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ShopItem, ShopState } from '@shared/schemas/shop'
import { invoke, IpcError } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

// Cửa hàng: mua đồ ăn và phụ kiện bằng xu, đeo/tháo phụ kiện cho mascot.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const petStore = usePetStore()

const state = ref<ShopState | null>(null)
const message = ref('')
const busy = ref(false)
let messageTimer = 0

const foods = computed(() => state.value?.items.filter((i) => i.kind === 'food') ?? [])
const accessories = computed(() => state.value?.items.filter((i) => i.kind === 'accessory') ?? [])

const nameOf = (item: ShopItem): string => t(`items.${item.id.split(':')[1]}`)

function say(text: string): void {
  message.value = text
  window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => (message.value = ''), 2500)
}

async function run(action: () => Promise<ShopState>, done?: string): Promise<void> {
  if (busy.value) return
  busy.value = true
  try {
    state.value = await action()
    if (done) say(done)
    emit('changed')
  } catch (err) {
    say(t(err instanceof IpcError ? err.info.messageKey : 'errors.unknown'))
    await load()
  } finally {
    busy.value = false
  }
}

async function load(): Promise<void> {
  state.value = await invoke('shop:state')
}

const buy = (item: ShopItem): Promise<void> =>
  run(() => invoke('shop:buy', { itemId: item.id }), t('shop.bought', { item: nameOf(item) }))
const wear = (item: ShopItem): Promise<void> =>
  run(() => invoke('shop:equip', { itemId: item.id, equipped: !item.equipped }))

function canBuy(item: ShopItem): boolean {
  if (!state.value) return false
  if (item.locked) return false
  if (item.kind === 'accessory' && item.owned > 0) return false
  return state.value.coins >= item.price
}

function missing(item: ShopItem): string {
  if (!state.value) return ''
  if (item.locked) return t('shop.needLevel', { level: item.minLevel })
  return state.value.coins < item.price
    ? t('shop.tooExpensive', { n: item.price - state.value.coins })
    : ''
}

onMounted(load)
</script>

<template>
  <section class="shop">
    <header class="head">
      <h1>{{ t('shop.title') }}</h1>
      <span v-if="state" class="coins">🪙 {{ t('shop.coins', { coins: state.coins }) }}</span>
    </header>
    <p class="muted">{{ t('shop.earnHint') }}</p>
    <p v-if="message" class="message">{{ message }}</p>

    <template v-if="state">
      <h2>{{ t('shop.accessoryTitle', { pet: petStore.pet?.name ?? '' }) }}</h2>
      <div class="grid">
        <PxPanel
          v-for="item in accessories"
          :key="item.id"
          class="item"
          :class="{ locked: item.locked }"
        >
          <div class="emoji">{{ item.emoji }}</div>
          <div class="name">{{ nameOf(item) }}</div>
          <div class="price">🪙 {{ item.price }}</div>
          <template v-if="item.owned > 0">
            <span v-if="item.equipped" class="tag">{{ t('shop.wearing') }}</span>
            <button type="button" class="btn" :disabled="busy" @click="wear(item)">
              {{ item.equipped ? t('shop.unwear') : t('shop.wear') }}
            </button>
          </template>
          <template v-else>
            <span v-if="missing(item)" class="muted small">{{ missing(item) }}</span>
            <button
              type="button"
              class="btn buy"
              :disabled="busy || !canBuy(item)"
              @click="buy(item)"
            >
              {{ t('shop.buy') }}
            </button>
          </template>
        </PxPanel>
      </div>

      <h2>{{ t('shop.foodTitle') }}</h2>
      <div class="grid">
        <PxPanel v-for="item in foods" :key="item.id" class="item">
          <div class="emoji">{{ item.emoji }}</div>
          <div class="name">{{ nameOf(item) }}</div>
          <div class="price">🪙 {{ item.price }}</div>
          <span v-if="item.owned > 0" class="muted small">{{
            t('shop.owned', { n: item.owned })
          }}</span>
          <span v-else-if="missing(item)" class="muted small">{{ missing(item) }}</span>
          <button
            type="button"
            class="btn buy"
            :disabled="busy || !canBuy(item)"
            @click="buy(item)"
          >
            {{ t('shop.buy') }}
          </button>
        </PxPanel>
      </div>
    </template>
  </section>
</template>

<style scoped>
.shop {
  display: grid;
  gap: 8px;
  max-width: 720px;
  margin: 0 auto;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
h1 {
  margin: 0;
  font-size: 22px;
}
h2 {
  margin: 12px 0 0;
  font-size: 16px;
}
.coins {
  padding: 4px 10px;
  font-weight: 700;
  background: var(--c-surface);
  border: var(--px) solid var(--c-border);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: 13px;
}
.small {
  font-size: 12px;
}
.message {
  margin: 0;
  padding: 6px 10px;
  background: #e3f4e8;
  border-left: 4px solid var(--c-success);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.item {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 12px 8px;
  text-align: center;
}
.item.locked {
  opacity: 0.7;
}
.emoji {
  font-size: 40px;
  line-height: 1.1;
}
.name {
  font-weight: 700;
}
.price {
  font-size: 13px;
  color: var(--c-ink-soft);
}
.tag {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-success);
  border: 1px solid var(--c-border);
}
.btn {
  min-width: 90px;
  padding: 5px 12px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.btn.buy:not(:disabled) {
  background: var(--c-success);
  color: #fff;
}
.btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
