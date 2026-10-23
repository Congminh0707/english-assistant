<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CHARACTER_IDS,
  CHARACTERS,
  characterItemId,
  DEFAULT_CHARACTER_ID,
  normalizeCharacterId,
  type CharacterId
} from '@shared/characters'
import { nextStage, PET_STAGES } from '@shared/pet'
import type { ShopItem, ShopState } from '@shared/schemas/shop'
import { invoke, IpcError } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import PxBar from '@renderer/shared/components/PxBar.vue'
import { Coins } from 'lucide-vue-next'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'

// Trang Thú cưng: chọn/mua nhân vật và xem cây tiến hoá của từng nhân vật.
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()
const petStore = usePetStore()

const shop = ref<ShopState | null>(null)
/** Đổi tên thú cưng ngay tại trang này */
const renaming = ref(false)
const nameDraft = ref('')
async function startRename(): Promise<void> {
  nameDraft.value = pet.value?.name ?? ''
  renaming.value = true
}
async function saveRename(): Promise<void> {
  const name = nameDraft.value.trim()
  if (!name || name === pet.value?.name) {
    renaming.value = false
    return
  }
  const active = (await invoke('profile:list')).find((p) => p.active)
  if (active) await invoke('profile:update', { id: active.id, petName: name })
  await petStore.load()
  renaming.value = false
  emit('changed')
}
const viewing = ref<CharacterId>(DEFAULT_CHARACTER_ID)
const message = ref('')
const busy = ref(false)
let messageTimer = 0

const pet = computed(() => petStore.pet)
const current = computed(() => normalizeCharacterId(pet.value?.characterId ?? ''))
const upcoming = computed(() => (pet.value ? nextStage(pet.value.level) : null))

function itemOf(id: CharacterId): ShopItem | undefined {
  return shop.value?.items.find((i) => i.id === characterItemId(id))
}
const owned = (id: CharacterId): boolean =>
  id === DEFAULT_CHARACTER_ID || (itemOf(id)?.owned ?? 0) > 0

function say(text: string): void {
  message.value = text
  window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => (message.value = ''), 2500)
}

async function run(action: () => Promise<ShopState>, done?: string): Promise<void> {
  if (busy.value) return
  busy.value = true
  try {
    shop.value = await action()
    await petStore.load()
    if (done) say(done)
    emit('changed')
  } catch (err) {
    say(t(err instanceof IpcError ? err.info.messageKey : 'errors.unknown'))
    shop.value = await invoke('shop:state')
  } finally {
    busy.value = false
  }
}

const buy = (id: CharacterId): Promise<void> =>
  run(
    () => invoke('shop:buy', { itemId: characterItemId(id) }),
    t('shop.bought', { item: t(`characters.${id}.name`) })
  )
const select = (id: CharacterId): Promise<void> =>
  run(() => invoke('shop:select-character', { characterId: id }))

function lockText(id: CharacterId): string {
  const item = itemOf(id)
  if (!item || !shop.value) return ''
  if (item.locked) return t('shop.needLevel', { level: item.minLevel })
  return shop.value.coins < item.price
    ? t('shop.tooExpensive', { n: item.price - shop.value.coins })
    : ''
}

onMounted(async () => {
  shop.value = await invoke('shop:state')
  viewing.value = normalizeCharacterId(shop.value.character)
})
</script>

<template>
  <section v-if="pet" class="pet-page">
    <h1 class="page-title">{{ t('study.pet.title') }}</h1>
    <p v-if="message" class="message">{{ message }}</p>

    <div class="card hero">
      <PetSprite
        :character="current"
        :stage="pet.stage"
        :accessories="pet.equipped"
        :size="240"
        animate
      />
      <div class="hero-info">
        <form v-if="renaming" class="rename" @submit.prevent="saveRename">
          <input
            v-model="nameDraft"
            type="text"
            maxlength="20"
            required
            :placeholder="t('study.pet.renamePlaceholder')"
            autofocus
          />
          <button type="submit" class="btn btn--sm btn--primary">
            <UiIcon name="check" />
          </button>
          <button type="button" class="btn btn--sm btn--ghost" @click="renaming = false">
            <UiIcon name="close" />
          </button>
        </form>
        <div v-else class="name">
          {{ pet.name }}
          <button
            type="button"
            class="btn btn--xs btn--icon btn--ghost"
            :title="t('study.pet.rename')"
            :aria-label="t('study.pet.rename')"
            @click="startRename"
          >
            <UiIcon name="pencil" :size="14" />
          </button>
        </div>
        <div class="muted">
          {{ t(`characters.${current}.name`) }} · {{ t('stats.level', { level: pet.level }) }} ·
          {{ t(`pet.stage.${pet.stage}`) }}
        </div>
        <PxBar :value="pet.xpInLevel" :max="pet.xpForNext" color="var(--c-xp)" />
        <p v-if="upcoming" class="muted">
          {{
            t('study.pet.nextEvolution', {
              stage: t(`pet.stage.${upcoming.stage}`),
              n: upcoming.minLevel - pet.level
            })
          }}
        </p>
        <p v-else class="muted">{{ t('study.pet.maxStage') }}</p>
      </div>
    </div>

    <h2>{{ t('study.pet.chooseTitle') }}</h2>
    <div class="chars">
      <article
        v-for="id in CHARACTER_IDS"
        :key="id"
        class="card char"
        :class="{ active: viewing === id, selected: current === id }"
      >
        <button type="button" class="view" @click="viewing = id">
          <span class="sprite"
            ><PetSprite :character="id" :stage="pet.stage" :size="132" :silhouette="!owned(id)"
          /></span>
          <span class="cname">{{ t(`characters.${id}.name`) }}</span>
          <span class="muted small desc">{{ t(`characters.${id}.desc`) }}</span>
        </button>
        <div class="note">
          <span v-if="current === id" class="chip chip--success">{{
            t('study.pet.selected')
          }}</span>
          <template v-else-if="!owned(id)">
            <span class="chip price"
              ><Coins :size="13" :stroke-width="2.4" />{{ CHARACTERS[id].price }}</span
            >
            <span v-if="lockText(id)">{{ lockText(id) }}</span>
          </template>
        </div>
        <button v-if="current === id" type="button" class="btn btn--sm btn--block" disabled>
          {{ t('study.pet.selected') }}
        </button>
        <button
          v-else-if="owned(id)"
          type="button"
          class="btn btn--sm btn--block btn--primary"
          :disabled="busy"
          @click="select(id)"
        >
          {{ t('study.pet.select') }}
        </button>
        <button
          v-else
          type="button"
          class="btn btn--sm btn--block btn--success"
          :disabled="busy || !!lockText(id)"
          @click="buy(id)"
        >
          {{ t('shop.buy') }}
        </button>
      </article>
    </div>

    <h2>{{ t('study.pet.evolutionTitle', { name: t(`characters.${viewing}.name`) }) }}</h2>
    <div class="stages">
      <article
        v-for="s in PET_STAGES"
        :key="s.stage"
        class="card stage"
        :class="{ now: viewing === current && pet.stage === s.stage }"
      >
        <span class="sprite">
          <PetSprite
            :character="viewing"
            :stage="s.stage"
            :size="132"
            :silhouette="pet.level < s.minLevel"
            :animate="viewing === current && pet.stage === s.stage"
          />
        </span>
        <div class="cname">
          {{ pet.level < s.minLevel ? '???' : t(`pet.stage.${s.stage}`) }}
        </div>
        <div class="muted small">{{ t('study.pet.fromLevel', { level: s.minLevel }) }}</div>
      </article>
    </div>
    <p class="muted small">{{ t('study.pet.keepHint') }}</p>
  </section>
</template>

<style scoped>
.pet-page {
  display: grid;
  gap: var(--sp-2);
  max-width: 820px;
}
h2 {
  margin: var(--sp-4) 0 0;
  font-size: var(--fs-lg);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.small {
  font-size: var(--fs-xs);
}
.message {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-success-soft);
  color: #25693a;
  font-weight: 600;
}
.hero {
  display: flex;
  gap: var(--sp-5);
  align-items: center;
  padding: var(--sp-4) var(--sp-5);
}
.hero-info {
  flex: 1;
  display: grid;
  gap: 6px;
}
.name {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-xl);
  font-weight: 700;
}
.rename {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.rename input {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-lg);
}
/* Thẻ nhân vật/giai đoạn cùng chiều cao; nút và ghi chú nằm đáy nên luôn thẳng hàng */
.chars,
.stages {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  align-items: stretch;
  gap: var(--sp-3);
}
.char,
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--sp-3);
  text-align: center;
}
.char.active {
  border-color: var(--c-primary);
  box-shadow:
    0 0 0 2px var(--c-primary-soft),
    var(--shadow-sm);
}
.char.selected {
  background: var(--c-warning-soft);
}
.stage.now {
  border-color: var(--c-success);
  background: var(--c-success-soft);
}
/* Khung sprite vuông cố định, không cắt đuôi/cánh của nhân vật */
.sprite {
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
  overflow: visible;
}
.view {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  border-radius: var(--r-md);
}
.desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em;
}
.cname {
  font-weight: 700;
}
.note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 40px;
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
  line-height: 1.3;
}
.price :deep(svg) {
  color: var(--c-coin);
}
</style>
