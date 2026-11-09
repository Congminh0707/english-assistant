<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

// Thú cưng chibi vector (mascot v3). Hình sinh từ scripts/design-data/mascot/export.py vào shared/art/pets/<id>.pet.json;
// nhúng vào Shadow DOM để id/lớp CSS không đụng trang. Mỗi giai đoạn vẽ riêng (19 dáng); phụ kiện vẽ riêng cho từng con
// (phần sau thân `b`, trước thân `f`) và co theo giai đoạn cùng thân.
interface StageArt {
  scale: number
  defs: string
  bg?: string
  fg?: string
  states: Record<string, string>
}
interface PetArt {
  css: string
  vb: { fig: string; legend: string; veh: string }
  egg: { defs: string; svg: string }
  stages: Record<string, StageArt>
  acc: Record<string, { slot: string; defs: string; b: string; f: string }>
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
    /** Phụ kiện đang đeo ('acc:bow'...) */
    accessories?: string[]
  }>(),
  { pose: 'idle', animate: false, accessories: () => [] }
)

const host = ref<HTMLElement | null>(null)
const VEHICLES = ['car', 'boat', 'plane']
/** Dáng mà tay phải không ở tư thế nghỉ: ẩn đồ cầm tay để khỏi lơ lửng */
const HIDE_HAND = ['run', 'jump', 'eat', 'drink', 'read', 'happy', 'surprised', 'levelup', 'say']

function figure(art: PetArt, stage: string, pose: string, accessories: string[]): string {
  if (stage === 'egg') {
    return `<svg class="ps" viewBox="${art.vb.fig}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>${art.egg.defs}</defs>${art.egg.svg}</svg>`
  }
  const st = art.stages[stage] ?? art.stages.baby
  const body = st.states[pose] ?? st.states.idle
  if (VEHICLES.includes(pose)) {
    return `<svg class="ps" viewBox="${art.vb.veh}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>${st.defs}</defs>${body}</svg>`
  }
  let defs = ''
  let back = ''
  let front = ''
  const cls: string[] = []
  for (const id of accessories) {
    const a = art.acc[id]
    if (!a) continue
    const hand = a.slot === 'hand' ? ' class="acc-hand"' : ''
    defs += a.defs
    back += `<g${hand}>${a.b}</g>`
    front += `<g${hand}>${a.f}</g>`
    if (a.slot === 'neck') cls.push('no-nk')
  }
  if (HIDE_HAND.includes(pose)) cls.push('hide-hand')
  const vb = stage === 'legend' ? art.vb.legend : art.vb.fig
  return (
    `<svg class="ps ${cls.join(' ')}" viewBox="${vb}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">` +
    `<defs>${st.defs}${defs}</defs>${st.bg ?? ''}` +
    `<g transform="translate(80 150) scale(${st.scale}) translate(-80 -150)">${back}${body}${front}</g>${st.fg ?? ''}</svg>`
  )
}

async function render(): Promise<void> {
  const el = host.value
  if (!el) return
  const { character, stage, pose, animate, accessories } = props
  const art = await loadArt(character)
  if (!art || character !== props.character) return
  const st = stage === 'egg' || art.stages[stage] ? stage : 'baby'
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' })
  root.innerHTML =
    `<style>:host{display:block}.w{width:100%;height:100%}.w svg.ps{display:block;width:100%;height:100%;overflow:visible}${art.css}</style>` +
    `<div class="w${animate && !reduced ? '' : ' still'}">${figure(art, st, pose, accessories)}</div>`
}

onMounted(render)
watch(
  () => [props.character, props.stage, props.pose, props.animate, props.accessories.join(',')],
  render
)
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
