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
import ArtScene from '@renderer/shared/components/ArtScene.vue'
import { isDark } from '@renderer/shared/theme'
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
    <!-- Nền cảnh (S5KidsHome); tối thì đổi sang cảnh đêm -->
    <ArtScene class="bg" :name="isDark ? 'kids-bg-night' : 'kids-bg'" />
    <header class="bar">
      <button
        v-if="view !== 'home'"
        type="button"
        class="k-round home-btn"
        :aria-label="t('kids.home')"
        @click="goHome"
      >
        <UiIcon name="home" :size="32" />
      </button>
      <span v-else class="spacer" />
      <span v-if="home" class="k-bubble score">
        <UiIcon name="star" :size="30" class="fill" />
        {{ home.stickersEarned }}
      </span>
      <button
        type="button"
        class="k-round lock"
        :title="t('kids.parentArea')"
        :aria-label="t('kids.parentArea')"
        @click="openGate('enter')"
      >
        <UiIcon name="lock" :size="20" />
      </button>
    </header>

    <main class="body">
      <p v-if="view === 'home' && !home" class="loading">
        <PixelPicture id="star" :size="96" class="spin" />
        <span class="k-bubble">{{ t('kids.loading') }}</span>
      </p>
      <KidsHome v-else-if="view === 'home'" :home="home" @open="open" />
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
      <ArtScene class="bg" name="kids-bg-night" />
      <UiIcon name="moon" :size="120" />
      <h1>Time to rest!</h1>
      <p class="sub">{{ t('kids.rest.text') }}</p>
      <button type="button" class="k-ghost ask" @click="openGate('extend')">
        {{ t('kids.rest.extend') }}
      </button>
      <button type="button" class="k-ghost ask" @click="openGate('enter')">
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
  background: var(--c-bg);
  color: var(--c-ink);
  font-family: var(--font-kids);
}
.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.bar,
.body {
  position: relative;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5) 0;
}
.home-btn {
  width: 64px;
  height: 64px;
}
.spacer {
  width: 64px;
}
.score {
  margin-left: auto;
  margin-right: auto;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-4) var(--sp-1) var(--sp-3);
  font-size: 26px;
  line-height: 1.3;
}
.score .fill {
  color: var(--c-coin);
  fill: currentcolor;
}
.lock {
  width: 48px;
  height: 48px;
  background: var(--c-surface-2);
  color: var(--c-ink-soft);
}
.body {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-4) var(--sp-5) var(--sp-6);
}
.loading {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
  margin: var(--sp-7) 0 0;
}
.spin {
  animation: k-bounce 900ms ease infinite;
}
.rest {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  gap: var(--sp-3);
  place-content: center;
  justify-items: center;
  background: var(--c-ink);
  color: var(--c-on-primary);
  text-align: center;
}
.rest > :not(.bg) {
  position: relative;
}
.rest svg {
  color: var(--c-coin);
  fill: currentcolor;
}
.rest .ask {
  border-color: var(--c-on-primary);
  background: transparent;
  color: var(--c-on-primary);
}
.rest h1 {
  color: var(--c-on-primary);
  margin: 0;
  font-size: 48px;
  font-weight: 800;
}
.sub {
  margin: 0;
  max-width: 420px;
  font-family: var(--font-ui);
  color: inherit;
}
@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none;
  }
}
</style>
