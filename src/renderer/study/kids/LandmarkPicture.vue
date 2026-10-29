<script setup lang="ts">
import { computed } from 'vue'
import { landmarkImage } from '@shared/voxels/landmarks'

// Công trình của một nơi trên bản đồ (Chùa Cầu, chợ Bến Thành…): hình isometric chiếu từ mô hình voxel
// (src/shared/voxels) — cùng bản vẽ với bản đồ 3D. Mỗi hình vài nghìn ô nên vẽ một lần lên canvas thành ảnh data:
// (CSP cho phép img-src data:), có cache theo id, thay vì hàng nghìn <rect> SVG. docs/19-kids-world.md §5.2
const props = withDefaults(defineProps<{ id: string; width?: number }>(), { width: 160 })

const cache = new Map<string, { url: string; ratio: number }>()

function render(id: string): { url: string; ratio: number } | null {
  const hit = cache.get(id)
  if (hit) return hit
  const image = landmarkImage(id)
  if (!image || image.width === 0) return null
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  for (const r of image.rects) {
    ctx.fillStyle = r.color
    ctx.fillRect(r.x, r.y, r.w, 1)
  }
  const out = { url: canvas.toDataURL('image/png'), ratio: image.height / image.width }
  cache.set(id, out)
  return out
}

const picture = computed(() => render(props.id))
</script>

<template>
  <img
    v-if="picture"
    class="landmark"
    :src="picture.url"
    :width="width"
    :height="Math.round(width * picture.ratio)"
    alt=""
    aria-hidden="true"
    draggable="false"
  />
</template>

<style scoped>
.landmark {
  display: block;
  image-rendering: pixelated;
}
</style>
