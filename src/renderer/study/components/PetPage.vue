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
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'

// Trang Thú cưng: chọn/mua nhân vật và xem cây tiến hoá của từng nhân vật.
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()
const petStore = usePetStore()

const shop = ref<ShopState | null>(null)
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
    <h1>{{ t('study.pet.title') }}</h1>
    <p v-if="message" class="message">{{ message }}</p>

    <PxPanel class="hero">
      <PetSprite
        :character="current"
        :stage="pet.stage"
        :accessories="pet.equipped"
        :size="240"
        animate
      />
      <div class="hero-info">
        <div class="name">{{ pet.name }}</div>
        <div class="muted">
          {{ t(`characters.${current}.name`) }} · {{ t('stats.level', { level: pet.level }) }} ·
          {{ t(`pet.stage.${pet.stage}`) }}
        </div>
        <PxBar :value="pet.xpInLevel" :max="pet.xpForNext" />
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
    </PxPanel>

    <h2>{{ t('study.pet.chooseTitle') }}</h2>
    <div class="chars">
      <PxPanel
        v-for="id in CHARACTER_IDS"
        :key="id"
        class="char"
        :class="{ active: viewing === id, selected: current === id }"
      >
        <button type="button" class="view" @click="viewing = id">
          <PetSprite :character="id" :stage="pet.stage" :size="144" :silhouette="!owned(id)" />
          <span class="cname">{{ t(`characters.${id}.name`) }}</span>
          <span class="muted small">{{ t(`characters.${id}.desc`) }}</span>
        </button>
        <span v-if="current === id" class="tag">{{ t('study.pet.selected') }}</span>
        <button
          v-else-if="owned(id)"
          type="button"
          class="btn"
          :disabled="busy"
          @click="select(id)"
        >
          {{ t('study.pet.select') }}
        </button>
        <template v-else>
          <span class="muted small">🪙 {{ CHARACTERS[id].price }}</span>
          <span v-if="lockText(id)" class="muted small">{{ lockText(id) }}</span>
          <button type="button" class="btn buy" :disabled="busy || !!lockText(id)" @click="buy(id)">
            {{ t('shop.buy') }}
          </button>
        </template>
      </PxPanel>
    </div>

    <h2>{{ t('study.pet.evolutionTitle', { name: t(`characters.${viewing}.name`) }) }}</h2>
    <div class="stages">
      <PxPanel
        v-for="s in PET_STAGES"
        :key="s.stage"
        class="stage"
        :class="{ now: viewing === current && pet.stage === s.stage }"
      >
        <PetSprite
          :character="viewing"
          :stage="s.stage"
          :size="144"
          :silhouette="pet.level < s.minLevel"
          :animate="viewing === current && pet.stage === s.stage"
        />
        <div class="cname">
          {{ pet.level < s.minLevel ? '???' : t(`pet.stage.${s.stage}`) }}
        </div>
        <div class="muted small">{{ t('study.pet.fromLevel', { level: s.minLevel }) }}</div>
      </PxPanel>
    </div>
    <p class="muted small">{{ t('study.pet.keepHint') }}</p>
  </section>
</template>

<style scoped>
.pet-page {
  display: grid;
  gap: 8px;
  max-width: 760px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: 22px;
}
h2 {
  margin: 12px 0 0;
  font-size: 16px;
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
.hero {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
}
.hero-info {
  flex: 1;
  display: grid;
  gap: 4px;
}
.name {
  font-size: 20px;
  font-weight: 700;
}
.chars,
.stages {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}
.char,
.stage {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 10px 6px;
  text-align: center;
}
.char.active {
  outline: 3px solid var(--c-primary);
}
.char.selected {
  background: #fff8e0;
}
.stage.now {
  background: #fff8e0;
  outline: 3px solid var(--c-success);
}
.view {
  display: grid;
  gap: 2px;
  justify-items: center;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.cname {
  font-weight: 700;
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
  min-width: 80px;
  padding: 4px 10px;
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
