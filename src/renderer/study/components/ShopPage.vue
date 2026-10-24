<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ShopItem, ShopState } from '@shared/schemas/shop'
import { invoke, IpcError } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { Coins } from 'lucide-vue-next'
import ItemEmoji from '@renderer/shared/components/ItemEmoji.vue'

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
const characters = computed(() => state.value?.items.filter((i) => i.kind === 'character') ?? [])

const nameOf = (item: ShopItem): string =>
  item.kind === 'character'
    ? t(`characters.${item.id.split(':')[1]}.name`)
    : t(`items.${item.id.split(':')[1]}`)

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
  if (item.kind !== 'food' && item.owned > 0) return false
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
      <h1 class="page-title">{{ t('shop.title') }}</h1>
      <span v-if="state" class="chip chip--warning wallet">
        <Coins :size="15" :stroke-width="2.2" />
        {{ t('shop.coins', { coins: state.coins }) }}
      </span>
    </header>
    <p class="muted">{{ t('shop.earnHint') }}</p>
    <p v-if="message" class="message">{{ message }}</p>

    <template v-if="state">
      <h2>{{ t('shop.accessoryTitle', { pet: petStore.pet?.name ?? '' }) }}</h2>
      <div class="grid">
        <article
          v-for="item in accessories"
          :key="item.id"
          class="card item"
          :class="{ locked: item.locked && item.owned === 0 }"
        >
          <ItemEmoji class="emoji" :emoji="item.emoji" :size="48" />
          <div class="name">{{ nameOf(item) }}</div>
          <span class="chip price"><Coins :size="13" :stroke-width="2.4" />{{ item.price }}</span>
          <div class="note">
            <span v-if="item.owned > 0 && item.equipped" class="chip chip--success">
              {{ t('shop.wearing') }}
            </span>
            <span v-else-if="item.owned === 0 && missing(item)">{{ missing(item) }}</span>
          </div>
          <button
            v-if="item.owned > 0"
            type="button"
            class="btn btn--sm btn--block"
            :disabled="busy"
            @click="wear(item)"
          >
            {{ item.equipped ? t('shop.unwear') : t('shop.wear') }}
          </button>
          <button
            v-else
            type="button"
            class="btn btn--sm btn--block btn--success"
            :disabled="busy || !canBuy(item)"
            @click="buy(item)"
          >
            {{ t('shop.buy') }}
          </button>
        </article>
      </div>

      <h2>{{ t('shop.characterTitle') }}</h2>
      <div class="grid">
        <article
          v-for="item in characters"
          :key="item.id"
          class="card item"
          :class="{ locked: item.locked && item.owned === 0 }"
        >
          <ItemEmoji class="emoji" :emoji="item.emoji" :size="48" />
          <div class="name">{{ nameOf(item) }}</div>
          <span class="chip price"><Coins :size="13" :stroke-width="2.4" />{{ item.price }}</span>
          <div class="note">
            <span v-if="item.owned > 0" class="chip chip--success">{{ t('shop.ownedOne') }}</span>
            <span v-else-if="missing(item)">{{ missing(item) }}</span>
          </div>
          <button
            type="button"
            class="btn btn--sm btn--block btn--success"
            :disabled="busy || item.owned > 0 || !canBuy(item)"
            @click="buy(item)"
          >
            {{ t('shop.buy') }}
          </button>
        </article>
      </div>

      <h2>{{ t('shop.foodTitle') }}</h2>
      <div class="grid">
        <article v-for="item in foods" :key="item.id" class="card item">
          <ItemEmoji class="emoji" :emoji="item.emoji" :size="48" />
          <div class="name">{{ nameOf(item) }}</div>
          <span class="chip price"><Coins :size="13" :stroke-width="2.4" />{{ item.price }}</span>
          <div class="note">
            <span v-if="item.owned > 0" class="chip chip--primary">
              {{ t('shop.owned', { n: item.owned }) }}
            </span>
            <span v-else-if="missing(item)">{{ missing(item) }}</span>
          </div>
          <button
            type="button"
            class="btn btn--sm btn--block btn--success"
            :disabled="busy || !canBuy(item)"
            @click="buy(item)"
          >
            {{ t('shop.buy') }}
          </button>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.shop {
  display: grid;
  gap: var(--sp-2);
  max-width: 820px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.head .page-title {
  margin: 0;
}
h2 {
  margin: var(--sp-4) 0 0;
  font-size: var(--fs-lg);
}
.wallet {
  min-height: 30px;
  padding: 0 var(--sp-3);
  font-size: var(--fs-sm);
}
.wallet :deep(svg),
.price :deep(svg) {
  color: var(--c-coin);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.message {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-success-soft);
  color: #25693a;
  font-weight: 600;
}
/* Mọi thẻ cùng chiều cao; hàng nút luôn nằm đáy → các nút thẳng hàng dù có/không có ghi chú */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  align-items: stretch;
  gap: var(--sp-3);
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--sp-4) var(--sp-3) var(--sp-3);
  text-align: center;
}
.item.locked {
  opacity: 0.65;
}
.emoji {
  flex: none;
}
.name {
  font-weight: 700;
}
.price {
  font-variant-numeric: tabular-nums;
}
.note {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Chừa chỗ cố định cho dòng ghi chú (tối đa 2 dòng) để hàng nút không lệch */
  min-height: 34px;
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
  line-height: 1.3;
}
.item .btn {
  margin-top: auto;
}
</style>
