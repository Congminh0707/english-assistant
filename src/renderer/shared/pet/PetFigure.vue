<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

// Thú cưng chibi vector (thiết kế v2). Hình sinh từ scripts/design-data/export-mascot.py vào shared/art/pets/<id>.pet.json;
// nhúng vào Shadow DOM để id/lớp CSS không đụng trang. Mỗi bản chỉ chứa defs + CSS + MỘT trạng thái đang hiện.
interface PetArt {
  css: string
  defs: string
  states: Record<string, string>
}
const arts = import.meta.glob<PetArt>('../art/pets/*.pet.json', { import: 'default' })
const cache = new Map<string, Promise<PetArt | null>>()

function loadArt(character: string): Promise<PetArt | null> {
  let p = cache.get(character)
  if (!p) {
    const load = arts[`../art/pets/${character}.pet.json`]
    p = load ? load() : Promise.resolve(null)
    cache.set(character, p)
  }
  return p
}

const props = withDefaults(
  defineProps<{
    character: string
    stage: string
    /** Trạng thái: idle, walk, run, jump, sit, sleep, eat, drink, read, listen, say, hello, happy, sad, surprised, levelup, car, boat, plane */
    pose?: string
    animate?: boolean
  }>(),
  { pose: 'idle', animate: false }
)

const host = ref<HTMLElement | null>(null)
const STAGES = ['egg', 'baby', 'teen', 'adult', 'legend']

async function render(): Promise<void> {
  const el = host.value
  if (!el) return
  const { character, stage, pose, animate } = props
  const art = await loadArt(character)
  if (!art || character !== props.character) return
  const st = STAGES.includes(stage) ? stage : 'baby'
  const svg = art.states[st === 'egg' ? 'egg' : pose] ?? art.states.idle
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cls = `st-${st}${animate && !reduced ? '' : ' still'}`
  const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' })
  root.innerHTML =
    `<style>:host{display:block}.w{width:100%;height:100%}.w svg.ps{display:block;width:100%;height:100%;overflow:visible}${art.css}</style>` +
    `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${art.defs}</defs></svg>` +
    `<div class="w ${cls}">${svg}</div>`
}

onMounted(render)
watch(() => [props.character, props.stage, props.pose, props.animate], render)
</script>

<template>
  <div ref="host" class="pet-figure" aria-hidden="true"></div>
</template>

<style scoped>
.pet-figure {
  width: 100%;
  height: 100%;
}
</style>
