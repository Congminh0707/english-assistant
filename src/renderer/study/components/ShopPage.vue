<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ShopItem, ShopState } from '@shared/schemas/shop'
import { invoke, IpcError } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { Coins } from 'lucide-vue-next'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import ShopItemCard from './ShopItemCard.vue'
import { characterFromItem, isPackCharacter, normalizeCharacterId } from '@shared/characters'
import { PET_STAGES } from '@shared/pet'
import { isAccessoryId, toggleEquipped, type AccessorySlot } from '@shared/shop'

// Cửa hàng: nhân vật thú cưng (nổi bật nhất), phụ kiện và đồ ăn mua bằng xu.
// Tab nhân vật: bấm/focus một thẻ để xem nhân vật ở khung bên phải (hình lớn, dải tiến hoá, một nút Mua/Dùng).
// Tab phụ kiện: rê chuột/focus vào một món để thử trên thú cưng.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const petStore = usePetStore()

const state = ref<ShopState | null>(null)
type Tab = 'accessory' | 'character' | 'food'
const TABS: Tab[] = ['character', 'accessory', 'food']
const tab = ref<Tab>('character')
const SLOTS: AccessorySlot[] = ['head', 'face', 'neck', 'hand', 'back']
const slotFilter = ref<AccessorySlot | 'all'>('all')
/** Phụ kiện đang thử (rê chuột/focus), hiện trên hình xem trước nhưng chưa đeo thật */
const trying = ref<string | null>(null)
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
const shownAccessories = computed(() =>
  slotFilter.value === 'all'
    ? accessories.value
    : accessories.value.filter((i) => i.slot === slotFilter.value)
)
const previewAccessories = computed(() => {
  const worn = petStore.pet?.equipped ?? []
  const id = trying.value
  return id && isAccessoryId(id) ? toggleEquipped(worn, id, true) : worn
})
const tryingItem = computed(() => accessories.value.find((i) => i.id === trying.value) ?? null)

// ---- Nhân vật ----
const characters = computed(() => state.value?.items.filter((i) => i.kind === 'character') ?? [])
/** Hai nhóm: nhân vật gốc của dự án và khách mời (nhân vật của gói nhân vật đã cài); nhóm rỗng thì ẩn */
const characterGroups = computed(() =>
  (['original', 'guest'] as const)
    .map((key) => ({
      key,
      items: characters.value.filter(
        (i) => isPackCharacter(characterFromItem(i.id)) === (key === 'guest')
      )
    }))
    .filter((g) => g.items.length > 0)
)
/** Nhân vật thú cưng đang dùng */
const activeCharacter = computed(() => normalizeCharacterId(state.value?.character ?? ''))
const isActive = (item: ShopItem): boolean => characterFromItem(item.id) === activeCharacter.value
/** Nhân vật người dùng bấm/focus để xem; null = chưa chọn */
const picked = ref<string | null>(null)
/** Thẻ nhân vật đang rê chuột (chỉ để chạy hoạt ảnh) */
const hovered = ref<string | null>(null)
/** Nhân vật đang xem: món đã chọn nếu còn trong danh sách, không thì nhân vật đang dùng, không thì món đầu */
const viewed = computed<ShopItem | null>(
  () =>
    characters.value.find((i) => i.id === picked.value) ??
    characters.value.find(isActive) ??
    characters.value[0] ??
    null
)
const viewedId = computed(() => (viewed.value ? characterFromItem(viewed.value.id) : null))
/** Thẻ nhân vật theo thứ tự hiển thị (cả hai nhóm) */
const shownCharacters = computed(() => characterGroups.value.flatMap((g) => g.items))
const CHAR_STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1
}
/**
 * Focus = xem, nên chỉ thẻ đang xem nằm trong thứ tự Tab (roving tabindex): Tab đi thẳng từ thẻ
 * sang nút Mua/Dùng; phím mũi tên/Home/End chuyển giữa các thẻ.
 */
function onCharKey(e: KeyboardEvent, item: ShopItem): void {
  const list = shownCharacters.value
  const n = list.length
  let i = list.findIndex((x) => x.id === item.id)
  if (e.key === 'Home') i = 0
  else if (e.key === 'End') i = n - 1
  else if (CHAR_STEP[e.key]) i = (i + CHAR_STEP[e.key] + n) % n
  else return
  e.preventDefault()
  const target = list[i]
  picked.value = target.id
  const root = (e.currentTarget as HTMLElement).closest('.col')
  root?.querySelector<HTMLElement>(`[data-char="${target.id}"]`)?.focus()
}
/** Khung xem trước hiện nhân vật ở giai đoạn hiện tại của người chơi (trứng thì hiện bé con) */
const previewStage = computed(() => {
  const stage = petStore.pet?.stage ?? 'baby'
  return stage === 'egg' ? 'baby' : stage
})
const evolution = PET_STAGES.filter((s) => s.stage !== 'egg')
const stageLocked = (minLevel: number): boolean => (petStore.pet?.level ?? 0) < minLevel

const nameOf = (item: ShopItem): string =>
  item.kind === 'character'
    ? t(`characters.${characterFromItem(item.id)}.name`)
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
const useCharacter = (item: ShopItem): Promise<void> =>
  run(() => invoke('shop:select-character', { characterId: characterFromItem(item.id) }))

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

      <div class="body" :class="`body--${tab}`">
        <!-- Nhân vật: hai nhóm thẻ có hình thú cưng thật -->
        <div v-if="tab === 'character'" class="col">
          <section v-for="g in characterGroups" :key="g.key" class="group">
            <h2 class="group-title">{{ t(`shop.group.${g.key}`) }}</h2>
            <div class="chars">
              <button
                v-for="item in g.items"
                :key="item.id"
                type="button"
                class="card char"
                :class="{ viewed: viewed?.id === item.id, active: isActive(item) }"
                :aria-pressed="viewed?.id === item.id"
                :tabindex="viewed?.id === item.id ? 0 : -1"
                :data-char="item.id"
                @keydown="onCharKey($event, item)"
                @click="picked = item.id"
                @focus="picked = item.id"
                @mouseenter="hovered = item.id"
                @mouseleave="hovered = null"
              >
                <span class="char-art">
                  <PetSprite
                    :character="characterFromItem(item.id)"
                    stage="adult"
                    :size="96"
                    :animate="viewed?.id === item.id || hovered === item.id"
                  />
                </span>
                <span class="char-name">{{ nameOf(item) }}</span>
                <span class="char-desc">{{
                  t(`characters.${characterFromItem(item.id)}.desc`)
                }}</span>
                <span class="note">
                  <span class="chip price">
                    <Coins :size="13" :stroke-width="2.4" />{{ item.price }}
                  </span>
                  <span v-if="isActive(item)" class="chip chip--success">
                    <UiIcon name="check" :size="12" />{{ t('shop.using') }}
                  </span>
                  <span v-else-if="item.owned > 0" class="chip chip--primary">
                    {{ t('shop.ownedOne') }}
                  </span>
                  <span v-else-if="missing(item)" class="miss">
                    <UiIcon v-if="item.locked" name="lock" :size="12" />{{ missing(item) }}
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>

        <!-- Phụ kiện: lọc theo vị trí, rê chuột để thử -->
        <div v-else-if="tab === 'accessory'" class="col">
          <div class="filters" role="group" :aria-label="t('shop.slot.filter')">
            <button
              v-for="k in ['all', ...SLOTS] as const"
              :key="k"
              type="button"
              class="btn btn--sm btn--pill"
              :class="slotFilter === k ? 'btn--primary' : 'btn--ghost'"
              :aria-pressed="slotFilter === k"
              @click="slotFilter = k"
            >
              {{ t(`shop.slot.${k}`) }}
            </button>
          </div>
          <div class="items">
            <ShopItemCard
              v-for="item in shownAccessories"
              :key="item.id"
              :item="item"
              :name="nameOf(item)"
              :busy="busy"
              :can-buy="canBuy(item)"
              :missing="missing(item)"
              :trying="trying === item.id"
              @mouseenter="trying = item.id"
              @mouseleave="trying = null"
              @focusin="trying = item.id"
              @focusout="trying = null"
              @buy="buy(item)"
              @wear="wear(item)"
            />
          </div>
        </div>

        <!-- Đồ ăn: mua nhiều lần được -->
        <div v-else class="col">
          <div class="items">
            <ShopItemCard
              v-for="item in foods"
              :key="item.id"
              :item="item"
              :name="nameOf(item)"
              :busy="busy"
              :can-buy="canBuy(item)"
              :missing="missing(item)"
              @buy="buy(item)"
            />
          </div>
        </div>

        <aside class="card preview" :class="{ 'preview--char': tab === 'character' }">
          <!-- Khung xem nhân vật -->
          <template v-if="tab === 'character' && viewed && viewedId">
            <div class="hero">
              <PetSprite :character="viewedId" :stage="previewStage" :size="150" animate />
            </div>
            <div class="hero-info">
              <div class="pname">{{ nameOf(viewed) }}</div>
              <p class="muted small">{{ t(`characters.${viewedId}.desc`) }}</p>
              <h3 class="evo-title">{{ t('shop.evolution') }}</h3>
              <ol class="evo">
                <li
                  v-for="s in evolution"
                  :key="s.stage"
                  class="evo-step"
                  :class="{ now: petStore.pet?.stage === s.stage }"
                >
                  <PetSprite
                    :character="viewedId"
                    :stage="s.stage"
                    :size="44"
                    :silhouette="stageLocked(s.minLevel)"
                  />
                  <span class="evo-label">{{
                    stageLocked(s.minLevel)
                      ? t('stats.level', { level: s.minLevel })
                      : t(`pet.stage.${s.stage}`)
                  }}</span>
                </li>
              </ol>
              <div v-if="!isActive(viewed) && viewed.owned === 0" class="note">
                <span class="chip price">
                  <Coins :size="13" :stroke-width="2.4" />{{ viewed.price }}
                </span>
                <span v-if="missing(viewed)" class="miss">
                  <UiIcon v-if="viewed.locked" name="lock" :size="12" />{{ missing(viewed) }}
                </span>
              </div>
              <button v-if="isActive(viewed)" type="button" class="btn btn--block" disabled>
                {{ t('shop.using') }}
              </button>
              <button
                v-else-if="viewed.owned > 0"
                type="button"
                class="btn btn--block btn--primary"
                :disabled="busy"
                @click="useCharacter(viewed)"
              >
                {{ t('shop.use') }}
              </button>
              <button
                v-else
                type="button"
                class="btn btn--block btn--success"
                :disabled="busy || !canBuy(viewed)"
                @click="buy(viewed)"
              >
                {{ t('shop.buy') }}
              </button>
            </div>
          </template>

          <!-- Thú cưng của người chơi (phụ kiện / đồ ăn) -->
          <template v-else-if="tab !== 'character' && petStore.pet">
            <PetSprite
              :character="normalizeCharacterId(petStore.pet.characterId)"
              :stage="petStore.pet.stage"
              :accessories="previewAccessories"
              :size="150"
              animate
            />
            <div class="pname">{{ petStore.pet.name }}</div>
            <div class="muted small">
              {{ t(`characters.${normalizeCharacterId(petStore.pet.characterId)}.name`) }} ·
              {{ t('stats.level', { level: petStore.pet.level }) }}
            </div>
            <p v-if="tryingItem && !tryingItem.equipped" class="muted small trying-note">
              {{ t('shop.trying', { item: nameOf(tryingItem) }) }}
            </p>
            <dl class="slots">
              <div v-for="s in SLOTS" :key="s" class="slot">
                <dt>{{ t(`shop.slot.${s}`) }}</dt>
                <dd>{{ wornIn(s) }}</dd>
              </div>
            </dl>
          </template>

          <div class="status" role="status">
            <p v-if="message" class="message" :class="{ 'message--error': isError }">
              {{ message }}
            </p>
          </div>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
/* Bố cục theo bề rộng vùng nội dung (container query), không theo bề rộng cửa sổ */
.shop {
  container: shop / inline-size;
  display: grid;
  gap: var(--sp-3);
  max-width: 100%;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
}
.head .page-title {
  margin: 0;
}
.wallet {
  flex: none;
  min-height: 30px;
  padding: 0 var(--sp-3);
  font-size: var(--fs-sm);
}
.wallet :deep(svg),
.price :deep(svg) {
  color: var(--c-coin);
}
.price {
  font-variant-numeric: tabular-nums;
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
  flex-wrap: wrap;
  justify-self: start;
  gap: var(--sp-1);
  max-width: 100%;
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
.tab:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 1px;
}

/* Hẹp: một cột. Tab nhân vật đưa khung xem lên trên để nút Mua/Dùng luôn thấy ngay */
.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--sp-3);
  align-items: start;
}
.body--character .preview {
  order: -1;
}
.col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}

/* ---- Nhân vật ---- */
.group {
  display: grid;
  gap: var(--sp-2);
}
.group-title {
  margin: 0;
  font-size: var(--fs-lg);
}
.chars {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: var(--sp-3);
}
.char {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-3);
  color: inherit;
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}
.char:hover {
  background: var(--c-surface-2);
}
.char:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.char.viewed {
  border-color: var(--c-primary);
}
.char.active {
  background: var(--c-warning-soft);
}
/* Khung hình vuông cố định, không cắt đuôi/cánh */
.char-art {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  overflow: visible;
}
.char-name {
  font-weight: 700;
}
.char-desc {
  display: -webkit-box;
  min-height: 2.6em;
  overflow: hidden;
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
  line-height: 1.3;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  min-height: 24px;
  margin-top: auto;
}
.miss {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
}

/* ---- Phụ kiện / đồ ăn ---- */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
  align-items: stretch;
  gap: var(--sp-3);
}

/* ---- Khung bên phải ---- */
.preview {
  display: grid;
  justify-items: center;
  gap: var(--sp-2);
  min-width: 0;
  padding: var(--sp-4);
  text-align: center;
}
.preview--char {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  justify-items: stretch;
  gap: var(--sp-4);
  text-align: left;
}
.preview--char .status {
  grid-column: 1 / -1;
}
.hero {
  display: grid;
  place-items: center;
  width: 160px;
  height: 160px;
  border-radius: var(--r-lg);
  background: var(--c-surface-2);
}
.hero-info {
  display: grid;
  gap: var(--sp-2);
  min-width: 0;
}
.pname {
  font-size: var(--fs-xl);
  font-weight: 800;
}
.evo-title {
  margin: var(--sp-1) 0 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.evo {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.evo-step {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: var(--sp-1) 0;
  border: 1px solid transparent;
  border-radius: var(--r-md);
}
.evo-step.now {
  border-color: var(--c-success);
  background: var(--c-success-soft);
}
.evo-label {
  max-width: 100%;
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
}
.preview--char .note {
  justify-content: flex-start;
  margin-top: 0;
}
.trying-note {
  margin: 0;
  text-align: center;
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
.status {
  width: 100%;
}
.status:empty {
  display: none;
}
.message {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-success-soft);
  color: var(--c-success);
  font-size: var(--fs-sm);
  font-weight: 600;
  text-align: center;
}
.message--error {
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
}

/* ---- Tải / lỗi ---- */
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

/* Rất hẹp: khung xem nhân vật xếp dọc */
@container shop (max-width: 459px) {
  .preview--char {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    text-align: center;
  }
  .preview--char .note {
    justify-content: center;
  }
}
/* Rộng: lưới bên trái, khung xem dính bên phải */
@container shop (min-width: 700px) {
  .body {
    grid-template-columns: minmax(0, 1fr) 248px;
  }
  .body--character .preview {
    order: 0;
  }
  .preview {
    position: sticky;
    top: 0;
  }
  .preview--char {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    gap: var(--sp-2);
    text-align: center;
  }
  .preview--char .note {
    justify-content: center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
  .char {
    transition: none;
  }
}
</style>
