<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { geoLayout } from '@shared/kidsWorldLayout'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import { VN_SIZE, isVnLand, projectVn } from '@shared/vnMap'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { mountVnMap3D, type Map3DHandle } from './map3d'

// Bản đồ 3D tầng Việt Nam (docs/19-kids-world.md §5.2): địa hình voxel + công trình voxel dựng bằng three.js, cùng dữ
// liệu và luồng với bản 2D (WorldMap.vue). Chạm công trình → thẻ nhỏ với nút Chơi. Không có WebGL / lỗi → báo `fail`
// để KidsGame quay về bản 2D.
const props = defineProps<{ world: KidsWorldView; tierId: string; scale: number }>()
const emit = defineEmits<{ start: [placeId: string]; fail: [] }>()

const { t } = useI18n()
const host = ref<HTMLDivElement | null>(null)
const ready = ref(false)
const selectedId = ref<string | null>(null)
let handle: Map3DHandle | null = null
let gone = false

const places = computed(() =>
  [...(props.world.tiers.find((x) => x.id === props.tierId)?.places ?? [])].sort(
    (a, b) => a.order - b.order
  )
)
const selected = computed(() => places.value.find((p) => p.id === selectedId.value) ?? null)

onMounted(async () => {
  try {
    if (!host.value) return
    const layout = geoLayout(
      places.value.map((p) => ({
        id: p.id,
        ...projectVn(p.geo?.lon ?? 0, p.geo?.lat ?? 0),
        via: p.via?.map(([lon, lat]) => projectVn(lon, lat)),
        ferry: p.ferry
      })),
      VN_SIZE,
      (p) => isVnLand(p)
    )
    const h = await mountVnMap3D(host.value, {
      width: 1600,
      height: 900,
      pixelRatio: Math.min(2, (window.devicePixelRatio || 1) * props.scale),
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      places: places.value.flatMap((p) => {
        const pt = layout.points.find((q) => q.id === p.id)
        return pt
          ? [
              {
                id: p.id,
                title: p.title,
                vi: p.vi,
                landmark: p.landmark,
                x: pt.x,
                y: pt.y,
                done: p.state === 'done'
              }
            ]
          : []
      }),
      onSelect: (id) => {
        selectedId.value = id
      }
    })
    if (gone) {
      h.dispose()
      return
    }
    handle = h
    ready.value = true
    if (props.world.currentPlaceId) {
      selectedId.value = null
      h.focus(props.world.currentPlaceId)
    }
  } catch {
    emit('fail')
  }
})

onBeforeUnmount(() => {
  gone = true
  handle?.dispose()
})

function closeCard(): void {
  selectedId.value = null
  handle?.focus(null)
}
</script>

<template>
  <div class="map3d">
    <div ref="host" class="gl" />
    <p v-if="ready && !selected" class="help">{{ t('kids.game.help3d') }}</p>
    <div v-if="selected" class="card" @pointerdown.stop>
      <button type="button" class="close" :aria-label="t('kids.game.close')" @click="closeCard">
        <UiIcon name="close" :size="26" />
      </button>
      <div class="text">
        <h2>{{ selected.title }}</h2>
        <p>{{ selected.vi }} · {{ selected.topicVi }} · {{ selected.landmarkVi }}</p>
      </div>
      <button
        type="button"
        class="go"
        :aria-label="t('kids.game.play')"
        @click="emit('start', selected.id)"
      >
        <UiIcon name="play" :size="48" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.map3d {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(#79cdf2, #46a5db);
  user-select: none;
}
.gl {
  position: absolute;
  inset: 0;
}
.help {
  position: absolute;
  bottom: 22px;
  left: 50%;
  margin: 0;
  padding: 8px 22px;
  border: 4px solid #3b2a3a;
  border-radius: 999px;
  background: #fff8e2;
  color: #3b2a3a;
  font-size: 22px;
  font-weight: 700;
  transform: translateX(-50%);
  pointer-events: none;
}
.card {
  position: absolute;
  bottom: 28px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 18px 28px 22px 34px;
  border: 5px solid #3b2a3a;
  border-radius: 36px;
  background: #fff8e2;
  box-shadow: 0 8px 0 0 #c9a46a;
  color: #3b2a3a;
  transform: translateX(-50%);
}
.text h2 {
  margin: 0;
  font-size: 44px;
  line-height: 1.1;
}
.text p {
  margin: 4px 0 0;
  font-size: 22px;
  color: #6b5566;
}
.go {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  flex: none;
  border: 5px solid #3b2a3a;
  border-radius: 50%;
  background: #5cc85a;
  color: #fff;
  fill: #fff;
  cursor: pointer;
  box-shadow: 0 8px 0 0 #2f8a35;
}
.go:active {
  transform: translateY(6px);
  box-shadow: 0 2px 0 0 #2f8a35;
}
.close {
  position: absolute;
  top: -18px;
  right: -14px;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 4px solid #3b2a3a;
  border-radius: 50%;
  background: #fff;
  color: #3b2a3a;
  cursor: pointer;
}
</style>
