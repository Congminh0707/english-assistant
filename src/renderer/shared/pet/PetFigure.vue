<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

// Thú cưng chibi vector (mascot v4: phần phụ nối khớp lắc lư, xem docs/05). Hình sinh từ scripts/design-data/mascot/export.py vào shared/art/pets/<id>.pet.json;
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
    /** Chuyển động cả thân chồng lên dáng: perk, peek, wag, wiggle, squash, bounce, dizzy, sway, shimmy */
    motion?: string
  }>(),
  { pose: 'idle', animate: false, accessories: () => [], motion: '' }
)

/** Chuyển động cả thân (lớp `m-*` trên khung `.w`); mọi chuyển động bắt đầu và kết thúc ở tư thế nghỉ, số vòng hữu hạn, để không giật khi hết; `wag`/`perk`/`wiggle`/`sway` còn làm đuôi, lá vẫy nhanh hơn */
const MOTION_CSS =
  '.w{transform-origin:50% 100%}' +
  '.m-perk{animation:m-perk .55s ease-out 1}@keyframes m-perk{35%{transform:translateY(-5%) scale(.97,1.05)}70%{transform:scale(1.03,.97)}}' +
  '.m-peek{animation:m-peek 2s ease-in-out 1}@keyframes m-peek{25%{transform:rotate(-5deg)}65%{transform:rotate(5deg)}}' +
  '.m-wiggle{animation:m-wiggle .5s ease-in-out 4}@keyframes m-wiggle{25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}' +
  '.m-squash{animation:m-squash .8s ease-in-out 2}@keyframes m-squash{50%{transform:scale(1.07,.9)}}' +
  '.m-bounce{animation:m-bounce 1.25s cubic-bezier(.3,0,.4,1) 1}' +
  '@keyframes m-bounce{12%{transform:scale(1.1,.86)}32%{transform:translateY(-16%) scale(.95,1.07)}50%{transform:scale(1.08,.9)}' +
  '66%{transform:translateY(-8%) scale(.97,1.04)}82%{transform:scale(1.04,.96)}}' +
  '.m-dizzy{animation:m-dizzy 1.2s ease-in-out 2}@keyframes m-dizzy{25%{transform:translateX(-3%) rotate(-6deg)}75%{transform:translateX(3%) rotate(6deg)}}' +
  '.m-sway{animation:m-sway 1.1s ease-in-out 2}@keyframes m-sway{25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}' +
  '.m-shimmy{animation:m-shimmy 1s ease-in-out 2}' +
  '@keyframes m-shimmy{20%{transform:translateX(-5%) rotate(-4deg)}40%{transform:translateY(-3%)}60%{transform:translateX(5%) rotate(4deg)}80%{transform:translateY(-3%)}}' +
  '.m-wag .sg,.m-perk .sg,.m-wiggle .sg,.m-sway .sg,.m-shimmy .sg{--d:1.1s!important}' +
  '.w.still{animation:none!important}'

/** Đồng hồ chung cho đuôi, lá, đốm sáng (`--f` trong fx4.CSS4): đổi dáng dựng lại hình mà đuôi vẫn lắc tiếp đúng nhịp, không giật về đầu */
const phase = (): string => ((performance.now() / 1000) % 3600).toFixed(2)

const frameClass = (still: boolean): string =>
  `w${still ? ' still' : ''}${props.motion ? ` m-${props.motion}` : ''}`

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
    `<style>:host{display:block}.w{width:100%;height:100%}.w svg.ps{display:block;width:100%;height:100%;overflow:visible}${art.css}${MOTION_CSS}</style>` +
    `<div class="${frameClass(!animate || reduced)}" style="--f:${phase()}s">${figure(art, st, pose, accessories)}</div>`
}

onMounted(render)
watch(
  () => [props.character, props.stage, props.pose, props.animate, props.accessories.join(',')],
  render
)
// Đổi chuyển động thì chỉ đổi lớp của khung, không dựng lại hình (dựng lại sẽ khởi động lại mọi hoạt ảnh)
watch(
  () => props.motion,
  () => {
    const frame = host.value?.shadowRoot?.querySelector('.w')
    if (frame) frame.className = frameClass(frame.classList.contains('still'))
  }
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
