<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ShopItem, ShopState } from '@shared/schemas/shop'
import { invoke, IpcError } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { Coins } from 'lucide-vue-next'
import ItemEmoji from '@renderer/shared/components/ItemEmoji.vue'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import { normalizeCharacterId } from '@shared/characters'
import type { AccessorySlot } from '@shared/shop'

// Cửa hàng: mua đồ ăn và phụ kiện bằng xu, đeo/tháo phụ kiện cho mascot.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const petStore = usePetStore()

const state = ref<ShopState | null>(null)
type Tab = 'accessory' | 'character' | 'food'
const TABS: Tab[] = ['accessory', 'character', 'food']
const tab = ref<Tab>('accessory')
const SLOTS: AccessorySlot[] = ['head', 'face', 'neck', 'back']
/** Tên món đang đeo ở một vị trí, hoặc "Trống" */
function wornIn(slot: AccessorySlot): string {
  const item = accessories.value.find((i) => i.slot === slot && i.equipped && i.owned > 0)
  return item ? nameOf(item) : t('shop.slot.empty')
}
const message = ref('')
const isError = ref(false)
const loadFailed = ref(false)
const busy = ref(false)
let messageTimer = 0

const foods = computed(() => state.value?.items.filter((i) => i.kind === 'food') ?? [])
const accessories = computed(() => state.value?.items.filter((i) => i.kind === 'accessory') ?? [])
const characters = computed(() => state.value?.items.filter((i) => i.kind === 'character') ?? [])

const nameOf = (item: ShopItem): string =>
  item.kind === 'character'
    ? t(`characters.${item.id.split(':')[1]}.name`)
    : t(`items.${item.id.split(':')[1]}`)

function say(text: string, error = false): void {
  message.value = text
  isError.value = error
  window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => (message.value = ''), 2500)
}

async function run(action: () => Promise<ShopState>, done?: string): Promise<void> {
  if (busy.value) return
  busy.value = true
  try {
    state.value = await action()
    await petStore.load()
    if (done) say(done)
    emit('changed')
  } catch (err) {
    say(t(err instanceof IpcError ? err.info.messageKey : 'errors.unknown'), true)
    await load()
  } finally {
    busy.value = false
  }
}

async function load(): Promise<void> {
  loadFailed.value = false
  try {
    state.value = await invoke('shop:state')
  } catch {
    loadFailed.value = true
  }
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
      <div>
        <h1 class="page-title">{{ t('shop.title') }}</h1>
        <p class="muted">{{ t('shop.earnHint') }}</p>
      </div>
      <span v-if="state" class="chip chip--warning wallet">
        <Coins :size="15" :stroke-width="2.2" />
        {{ t('shop.coins', { coins: state.coins }) }}
      </span>
    </header>

    <div v-if="loadFailed" class="card state state--error" role="alert">
      <p>{{ t('study.state.error') }}</p>
      <button type="button" class="btn btn--sm" @click="load">{{ t('study.state.retry') }}</button>
    </div>
    <div
      v-else-if="!state"
      class="card skeleton"
      aria-busy="true"
      :aria-label="t('study.state.loading')"
    />

    <template v-if="state">
      <nav class="tabs" role="tablist">
        <button
          v-for="k in TABS"
          :key="k"
          type="button"
          role="tab"
          class="tab"
          :class="{ on: tab === k }"
          :aria-selected="tab === k"
          @click="tab = k"
        >
          {{
            k === 'accessory'
              ? t('shop.accessoryTitle', { pet: petStore.pet?.name ?? '' })
              : t(`shop.${k}Title`)
          }}
        </button>
      </nav>

      <div class="body">
        <div v-if="tab === 'accessory'" class="items">
          <article
            v-for="item in accessories"
            :key="item.id"
            class="card item"
            :class="{ locked: item.locked && item.owned === 0 }"
          >
            <div class="top">
              <span class="art"><ItemEmoji :emoji="item.emoji" :size="36" /></span>
              <div class="info">
                <div class="name">{{ nameOf(item) }}</div>
                <span class="chip price"
                  ><Coins :size="13" :stroke-width="2.4" />{{ item.price }}</span
                >
              </div>
            </div>
            <div class="foot">
              <span v-if="item.owned > 0 && item.equipped" class="chip chip--success">
                {{ t('shop.wearing') }}
              </span>
              <span v-else-if="item.owned === 0 && missing(item)" class="miss">{{
                missing(item)
              }}</span>
              <button
                v-if="item.owned > 0"
                type="button"
                class="btn btn--sm act"
                :disabled="busy"
                @click="wear(item)"
              >
                {{ item.equipped ? t('shop.unwear') : t('shop.wear') }}
              </button>
              <button
                v-else
                type="button"
                class="btn btn--sm act"
                :disabled="busy || !canBuy(item)"
                @click="buy(item)"
              >
                {{ t('shop.buy') }}
              </button>
            </div>
          </article>
        </div>

        <div v-else-if="tab === 'character'" class="items items--big">
          <article
            v-for="item in characters"
            :key="item.id"
            class="card item item--big"
            :class="{ locked: item.locked && item.owned === 0 }"
          >
            <ItemEmoji :emoji="item.emoji" :size="56" />
            <div class="name">{{ nameOf(item) }}</div>
            <div class="foot foot--center">
              <span class="chip price"
                ><Coins :size="13" :stroke-width="2.4" />{{ item.price }}</span
              >
              <span v-if="item.owned > 0" class="chip chip--success">{{ t('shop.ownedOne') }}</span>
              <span v-else-if="missing(item)" class="miss">{{ missing(item) }}</span>
              <button
                v-if="item.owned === 0"
                type="button"
                class="btn btn--sm btn--primary"
                :disabled="busy || !canBuy(item)"
                @click="buy(item)"
              >
                {{ t('shop.buy') }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="items">
          <article v-for="item in foods" :key="item.id" class="card item">
            <div class="top">
              <span class="art"><ItemEmoji :emoji="item.emoji" :size="36" /></span>
              <div class="info">
                <div class="name">{{ nameOf(item) }}</div>
                <span class="chip price"
                  ><Coins :size="13" :stroke-width="2.4" />{{ item.price }}</span
                >
              </div>
            </div>
            <div class="foot">
              <span v-if="item.owned > 0" class="chip chip--primary">
                {{ t('shop.owned', { n: item.owned }) }}
              </span>
              <span v-else-if="missing(item)" class="miss">{{ missing(item) }}</span>
              <button
                type="button"
                class="btn btn--sm act"
                :disabled="busy || !canBuy(item)"
                @click="buy(item)"
              >
                {{ t('shop.buy') }}
              </button>
            </div>
          </article>
        </div>

        <aside v-if="petStore.pet" class="card preview">
          <PetSprite
            :character="normalizeCharacterId(petStore.pet.characterId)"
            :stage="petStore.pet.stage"
            :accessories="petStore.pet.equipped"
            :size="150"
            animate
          />
          <div class="pname">{{ petStore.pet.name }}</div>
          <div class="muted small">
            {{ t(`characters.${normalizeCharacterId(petStore.pet.characterId)}.name`) }} ·
            {{ t('stats.level', { level: petStore.pet.level }) }}
          </div>
          <dl class="slots">
            <div v-for="s in SLOTS" :key="s" class="slot">
              <dt>{{ t(`shop.slot.${s}`) }}</dt>
              <dd>{{ wornIn(s) }}</dd>
            </div>
          </dl>
          <p v-if="message" class="message" :class="{ 'message--error': isError }" role="status">
            {{ message }}
          </p>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.shop {
  display: grid;
  gap: var(--sp-3);
  max-width: 100%;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.head .page-title {
  margin: 0;
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
.small {
  font-size: var(--fs-xs);
}
.tabs {
  display: inline-flex;
  justify-self: start;
  gap: var(--sp-1);
  padding: var(--sp-1);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.tab {
  min-height: var(--btn-h-sm);
  padding: 0 var(--sp-3);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.tab.on {
  background: var(--c-surface);
  color: var(--c-ink);
  box-shadow: var(--shadow-sm);
}
.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 216px;
  gap: var(--sp-3);
  align-items: start;
}
.items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-3);
}
.items--big {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.item {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-3);
}
.item.locked {
  opacity: 0.6;
}
.item--big {
  justify-items: center;
  padding: var(--sp-5) var(--sp-3);
  text-align: center;
}
.top {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.art {
  display: grid;
  flex: none;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.info {
  display: grid;
  gap: 2px;
  justify-items: start;
  min-width: 0;
}
.name {
  font-weight: 700;
}
.price {
  font-variant-numeric: tabular-nums;
}
.foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-2);
  min-height: var(--btn-h);
}
.foot--center {
  justify-content: center;
  flex-wrap: wrap;
}
.foot .act {
  margin-left: auto;
}
.miss {
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
}
.preview {
  display: grid;
  justify-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  text-align: center;
}
.pname {
  font-size: var(--fs-xl);
  font-weight: 800;
}
.slots {
  display: grid;
  gap: 2px;
  width: 100%;
  margin: var(--sp-2) 0 0;
  padding-top: var(--sp-2);
  border-top: 1px solid var(--c-line);
  text-align: left;
}
.slot {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
}
.slot dt {
  color: var(--c-ink-soft);
}
.slot dd {
  margin: 0;
  font-weight: 700;
}
.message {
  width: 100%;
  margin: var(--sp-2) 0 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-success-soft);
  color: var(--c-success);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.message--error {
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.state p {
  margin: 0;
}
.state--error {
  border-radius: var(--r-lg);
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.skeleton {
  min-height: 160px;
  border-radius: var(--r-lg);
  background: linear-gradient(90deg, var(--c-surface-2), var(--c-surface), var(--c-surface-2));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
@media (max-width: 900px) {
  .body {
    grid-template-columns: 1fr;
  }
  .items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
