<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import PlaceProgress from './PlaceProgress.vue'

// Giới thiệu một nơi (docs/19-kids-world.md §5.5): `overview` hiện trước khi vào (học gì, gồm những bước nào,
// kèm nét chính/văn hoá/ẩm thực), `about` là biển giới thiệu bên trong cảnh (chỉ phần nét chính/văn hoá/ẩm thực).
const props = defineProps<{
  place: KidsWorldView['tiers'][number]['places'][number]
  mode: 'overview' | 'about'
}>()
const emit = defineEmits<{ enter: []; close: [] }>()

const { t, locale } = useI18n()
const { speak } = useTts()

const name = computed(() => (locale.value === 'vi' ? props.place.vi : props.place.title))
const SECTIONS = [
  { key: 'intro', icon: 'map' },
  { key: 'culture', icon: 'party' },
  { key: 'food', icon: 'heart' }
] as const
const STEPS = [0, 1, 2, 3, 4]

/** Ngoài cảnh chỉ hiện đoạn ngắn; trong cảnh (`about`) thêm đoạn dài chi tiết */
function line(key: (typeof SECTIONS)[number]['key']): string {
  const l = props.place.about?.[key]
  if (!l) return ''
  const vi = locale.value === 'vi'
  const short = vi ? l.vi : l.en
  const more = props.mode === 'about' && l.more ? (vi ? l.more.vi : l.more.en) : ''
  return more ? `${short} ${more}` : short
}

function say(key: (typeof SECTIONS)[number]['key']): void {
  const l = props.place.about?.[key]
  if (!l) return
  speak(props.mode === 'about' && l.more ? `${l.en} ${l.more.en}` : l.en, 'us', 0.8)
}
</script>

<template>
  <div class="about" role="dialog" :aria-label="name" @click.self="emit('close')">
    <div class="sheet">
      <button type="button" class="close" :aria-label="t('kids.game.close')" @click="emit('close')">
        <UiIcon name="close" :size="28" />
      </button>
      <h2>{{ name }}</h2>
      <p class="sub">{{ place.landmarkVi }}</p>

      <ul v-if="place.about" class="sections">
        <li v-for="s in SECTIONS" :key="s.key">
          <span class="ico"><UiIcon :name="s.icon" :size="30" /></span>
          <span class="body">
            <strong>{{ t(`kids.game.about.${s.key}`) }}</strong>
            <span>{{ line(s.key) }}</span>
          </span>
          <button
            type="button"
            class="say"
            :aria-label="t('kids.game.about.listen')"
            @click="say(s.key)"
          >
            <UiIcon name="volume" :size="26" />
          </button>
        </li>
      </ul>

      <template v-if="mode === 'overview'">
        <div class="learn">
          <h3>
            {{ t('kids.game.about.learn') }}
            <span class="count">{{ locale === 'vi' ? place.topicVi : place.topic }}</span>
          </h3>
          <PlaceProgress :place="place" />
          <ol class="steps">
            <li v-for="i in STEPS" :key="i">
              <span class="n">{{ i + 1 }}</span>
              {{ t(`kids.game.about.steps[${i}]`) }}
            </li>
          </ol>
        </div>
        <button type="button" class="go" @click="emit('enter')">
          {{ t('kids.game.enter', { name }) }}
        </button>
      </template>
      <PlaceProgress v-else :place="place" />
    </div>
  </div>
</template>

<style scoped>
.about {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-items: center;
  background: rgb(58 36 19 / 45%);
  font-family: var(--font-kids);
  color: var(--g-ink);
}
.sheet {
  position: relative;
  display: grid;
  gap: 14px;
  width: 1120px;
  max-height: 820px;
  padding: 30px 40px 34px;
  overflow-y: auto;
  border: 5px solid var(--g-coin);
  border-radius: 32px;
  background: var(--g-paper);
  animation: k-pop 320ms ease;
}
h2 {
  margin: 0;
  padding-right: 60px;
  color: var(--g-brown);
  font-size: 48px;
  font-weight: 800;
  line-height: 1.1;
}
h3 {
  margin: 0 0 8px;
  color: var(--g-brown);
  font-size: 26px;
}
.count {
  margin-left: 8px;
  font-size: 20px;
  font-weight: 600;
}
.sub {
  margin: -8px 0 0;
  font-size: 21px;
  font-weight: 600;
  color: var(--g-brown);
}
.sections {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sections li {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border: 3px solid var(--g-line);
  border-radius: 22px;
  background: #fff;
}
.ico {
  display: grid;
  flex: none;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--g-butter);
  color: var(--g-red);
}
.body {
  display: grid;
  flex: 1;
  gap: 2px;
  font-size: 22px;
  line-height: 1.3;
}
.body strong {
  color: var(--g-brown);
  font-size: 20px;
}
.say,
.close {
  display: grid;
  flex: none;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 0;
  border: 3px solid var(--g-line);
  border-radius: 50%;
  background: var(--g-paper);
  color: var(--g-brown);
  cursor: pointer;
}
.close {
  position: absolute;
  top: 18px;
  right: 18px;
}
.say:focus-visible,
.close:focus-visible,
.go:focus-visible {
  outline: 4px solid var(--g-teal);
  outline-offset: 3px;
}
.steps {
  display: flex;
  margin-top: 10px !important;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 19px;
  font-weight: 600;
}
.steps li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.n {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--g-red);
  color: #fff;
  font-size: 17px;
  font-weight: 800;
}
.go {
  min-height: 72px;
  padding: 0 20px;
  border: 4px solid var(--g-coin);
  border-radius: 36px;
  background: var(--g-red);
  color: #fff;
  font: inherit;
  font-size: 27px;
  font-weight: 700;
  cursor: pointer;
}
.go:active {
  transform: translateY(3px);
}
@media (prefers-reduced-motion: reduce) {
  .sheet {
    animation: none;
  }
}
</style>
