import { onBeforeUnmount, onMounted, ref } from 'vue'

// Cỡ chữ/hình của màn game toàn màn hình theo cửa sổ: 1 = cửa sổ 1100×800 (cỡ thiết kế), giữ trong [0.75, 1.6].
// Dùng chung một giá trị cho CSS (`--s` đặt ở GameStage) và các cỡ số của PictureImage/SpriteLoop.
const BASE_W = 1100
const BASE_H = 800

const compute = (): number =>
  Math.min(1.6, Math.max(0.75, Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)))

const scale = ref(compute())
let users = 0
const update = (): void => {
  scale.value = compute()
}

export function useStageScale(): { scale: typeof scale; px: (n: number) => number } {
  onMounted(() => {
    if (users++ === 0) window.addEventListener('resize', update)
    update()
  })
  onBeforeUnmount(() => {
    if (--users === 0) window.removeEventListener('resize', update)
  })
  return { scale, px: (n: number) => Math.round(n * scale.value) }
}
