<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Tranh Làng chữ sinh từ scripts/design-data/export-art.py. Nhúng vào Shadow DOM để id và lớp CSS
// của tranh không đụng trang; nạp chậm vì mỗi tranh nặng vài trăm KB.
const scenes = import.meta.glob('../art/scenes/*.art.html', {
  query: '?raw',
  import: 'default'
})

/** `fill`: tranh có kích thước cố định (thanh bên) được kéo cao bằng khung thay vì chừa viền trên/dưới */
const props = defineProps<{ name: string; fill?: boolean }>()
const host = ref<HTMLElement | null>(null)
let source: SVGSVGElement | null = null
let observer: ResizeObserver | null = null

async function render(): Promise<void> {
  const el = host.value
  const load = scenes[`../art/scenes/${props.name}.art.html`]
  if (!el) return
  const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' })
  if (!load) {
    console.warn('[ArtScene] không có tranh', props.name)
    root.replaceChildren()
    return
  }
  const name = props.name
  const html = (await load()) as string
  if (name !== props.name) return
  root.innerHTML = html
  source = null
  if (props.fill) {
    const svg = root.querySelector('svg[role="img"]')
    if (svg) {
      source = svg as SVGSVGElement
      svg.remove()
      stretch()
    }
  }
}

/**
 * `fill`: giữ nguyên nét tranh (cả đường cong mép phải) nhưng kéo cao bằng khung: dải trời trên cùng và dải đất dưới cùng
 * được giãn dọc, phần giữa giữ đúng cỡ tranh.
 */
const BAND_TOP = 22
const BAND_BOTTOM = 26
function stretch(): void {
  const el = host.value
  const root = el?.shadowRoot
  if (!el || !root || !source) return
  root.querySelectorAll('.band').forEach((n) => n.remove())
  const [, , w, h] = (source.getAttribute('viewBox') ?? '0 0 216 720').split(' ').map(Number)
  const extra = Math.max(0, el.clientHeight - h)
  const top = Math.round(extra * 0.65)
  const parts: Array<[number, number, number]> = [
    [0, BAND_TOP, BAND_TOP + top],
    [BAND_TOP, h - BAND_TOP - BAND_BOTTOM, h - BAND_TOP - BAND_BOTTOM],
    [h - BAND_BOTTOM, BAND_BOTTOM, BAND_BOTTOM + extra - top]
  ]
  let y = 0
  for (const [sy, sh, dh] of parts) {
    const band = source.cloneNode(true) as SVGSVGElement
    band.setAttribute('class', 'band')
    band.setAttribute('viewBox', `0 ${sy} ${w} ${sh}`)
    band.setAttribute('preserveAspectRatio', 'none')
    band.style.cssText = `position:absolute;left:0;top:${y}px;width:${w}px;height:${dh}px`
    root.append(band)
    y += dh
  }
}

onMounted(() => {
  void render()
  if (props.fill && host.value) {
    observer = new ResizeObserver(stretch)
    observer.observe(host.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.name, render)
</script>

<template>
  <div ref="host" class="art-scene" aria-hidden="true"></div>
</template>

<style scoped>
.art-scene {
  width: 100%;
  height: 100%;
}
</style>
