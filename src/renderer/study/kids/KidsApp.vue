<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsActivity, KidsHome as KidsHomeData } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import KidsActivityView from './KidsActivity.vue'
import KidsAlbum from './KidsAlbum.vue'
import KidsHome from './KidsHome.vue'
import KidsPet from './KidsPet.vue'
import KidsUnits from './KidsUnits.vue'
import KidsGame from './game/KidsGame.vue'
import ParentGate from './ParentGate.vue'
import type { KidsTile } from './kidsText'
import { useKidsUsage } from './useKidsUsage'
import './kids.css'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Giao diện cho hồ sơ trẻ em: không thanh bên chữ, vài ô lớn có hình và âm thanh; có đồng hồ giới hạn thời gian của phụ huynh
// và một ổ khoá nhỏ để vào khu vực phụ huynh (PIN).
const emit = defineEmits<{ parent: []; changed: [] }>()

const { t } = useI18n()
const petStore = usePetStore()

type View = 'home' | 'play' | 'abc' | 'activity' | 'stickers' | 'pet'
const view = ref<View>('home')
const activity = ref<KidsActivity | null>(null)
const home = ref<KidsHomeData | null>(null)
const gate = ref<'enter' | 'set' | 'extend' | null>(null)
const { usage, set: setUsage } = useKidsUsage()

const locked = computed(() => usage.value?.locked ?? home.value?.usage.locked ?? false)

async function loadHome(): Promise<void> {
  home.value = await invoke('kids:home')
  setUsage(home.value.usage)
  await petStore.load()
}

function open(id: KidsTile['id']): void {
  view.value = id === 'abc' ? 'abc' : id
}

function openActivity(a: KidsActivity): void {
  activity.value = a
  view.value = 'activity'
}

function goHome(): void {
  view.value = 'home'
  void loadHome()
}

function backToList(): void {
  view.value = 'abc'
}

function changed(): void {
  void loadHome()
  emit('changed')
}

function openGate(mode: 'enter' | 'extend'): void {
  gate.value = mode === 'extend' ? 'extend' : home.value?.pinSet ? 'enter' : 'set'
}

async function gateOk(): Promise<void> {
  const mode = gate.value
  gate.value = null
  await loadHome()
  if (mode === 'enter' || mode === 'set') emit('parent')
}

onMounted(loadHome)
</script>

<template>
  <div class="kids">
    <header class="bar">
      <button
        v-if="view !== 'home'"
        type="button"
        class="k-round"
        :aria-label="t('kids.home')"
        @click="goHome"
      >
        <PixelPicture id="house" :size="44" />
      </button>
      <span v-else class="spacer" />
      <span v-if="home" class="score">
        <PixelPicture id="star" :size="34" />
        {{ home.stickersEarned }}
      </span>
      <button type="button" class="lock" :title="t('kids.parentArea')" @click="openGate('enter')">
        <UiIcon name="lock" />
      </button>
    </header>

    <main class="body">
      <KidsHome v-if="view === 'home'" :home="home" @open="open" />
      <KidsUnits v-else-if="view === 'abc'" @open="openActivity" />
      <KidsActivityView
        v-else-if="view === 'activity' && activity"
        :key="activity.id"
        :activity="activity"
        @back="backToList"
        @changed="changed"
      />
      <KidsAlbum v-else-if="view === 'stickers'" />
      <KidsPet v-else-if="view === 'pet'" @changed="changed" />
    </main>

    <!-- Ô Chơi: màn game toàn màn hình (bản đồ, lượt chơi, ôn) -->
    <KidsGame v-if="view === 'play'" @exit="goHome" @changed="changed" />

    <!-- Hết giờ: bé nghỉ ngơi, phụ huynh nhập PIN để cho dùng thêm -->
    <div v-if="locked" class="rest">
      <PixelPicture id="moon" :size="180" />
      <h1>Time to rest!</h1>
      <p class="sub">{{ t('kids.rest.text') }}</p>
      <button type="button" class="ask" @click="openGate('extend')">
        {{ t('kids.rest.extend') }}
      </button>
      <button type="button" class="ask" @click="openGate('enter')">
        {{ t('kids.parentArea') }}
      </button>
    </div>

    <ParentGate v-if="gate" :mode="gate" @ok="gateOk" @close="gate = null" />
  </div>
</template>

<style scoped>
.kids {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(#cfe9ff 0, #eaf6ff 40%, #fff8e7 100%);
  color: var(--c-ink);
  font-family: var(--font-ui);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px 0;
}
.spacer {
  width: 64px;
}
.score {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px 4px 10px;
  border: 2px solid var(--c-line);
  border-radius: 30px;
  background: var(--c-surface);
  font-size: 24px;
  font-weight: 800;
}
.lock {
  width: 44px;
  height: 44px;
  border: 2px solid var(--c-line);
  border-radius: 10px;
  background: var(--c-surface);
  font-size: 18px;
  opacity: 0.6;
  cursor: pointer;
}
.lock:hover {
  opacity: 1;
}
.body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 22px 28px;
}
.rest {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  gap: 12px;
  place-content: center;
  justify-items: center;
  background: #1f2a52;
  color: #fff;
  text-align: center;
}
.rest h1 {
  margin: 0;
  font-size: 44px;
}
.sub {
  margin: 0;
  max-width: 420px;
  color: #cfd8ff;
}
.ask {
  padding: 8px 18px;
  border: 2px solid #8fa0ff;
  border-radius: 10px;
  background: transparent;
  color: #cfd8ff;
  font: inherit;
  cursor: pointer;
}
</style>
