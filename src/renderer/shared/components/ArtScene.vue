<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

// Tranh Làng chữ sinh từ scripts/design-data/export-art.py. Nhúng vào Shadow DOM để id và lớp CSS
// của tranh không đụng trang; nạp chậm vì mỗi tranh nặng vài trăm KB.
const scenes = import.meta.glob('../art/scenes/*.art.html', {
  query: '?raw',
  import: 'default'
})

const props = defineProps<{ name: string }>()
const host = ref<HTMLElement | null>(null)

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
  if (name === props.name) root.innerHTML = html
}

onMounted(render)
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
