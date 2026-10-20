import { ref, watch, type Ref } from 'vue'
import { PET_STAGES } from '@shared/pet'
import type { PetState } from '@shared/schemas/pet'

export interface EvolutionEvent {
  character: string
  name: string
  from: string
  to: string
  accessories: string[]
}

const rank = (stage: string): number => PET_STAGES.findIndex((s) => s.stage === stage)

/**
 * Phát hiện thú cưng vừa tiến hoá để hiện màn hình tiến hoá. Giai đoạn đã xem lưu theo từng nhân vật
 * trong localStorage nên cả tiến hoá xảy ra lúc cửa sổ Học tập đang đóng cũng được báo khi mở lại.
 * Lần đầu thấy một nhân vật chỉ ghi nhận, không báo.
 */
export function useEvolution(pet: Ref<PetState | null>): {
  evolution: Ref<EvolutionEvent | null>
  dismiss: () => void
} {
  const evolution = ref<EvolutionEvent | null>(null)

  watch(
    () => (pet.value ? `${pet.value.characterId}/${pet.value.stage}` : ''),
    (key) => {
      const p = pet.value
      if (!key || !p) return
      const storeKey = `pet.seenStage.${p.characterId}`
      let seen: string | null = null
      try {
        seen = localStorage.getItem(storeKey)
      } catch {
        /* không có localStorage: coi như chưa xem */
      }
      if (seen && rank(p.stage) > rank(seen)) {
        evolution.value = {
          character: p.characterId,
          name: p.name,
          from: seen,
          to: p.stage,
          accessories: p.equipped
        }
      }
      try {
        localStorage.setItem(storeKey, p.stage)
      } catch {
        /* bỏ qua */
      }
    },
    { immediate: true }
  )

  return { evolution, dismiss: () => (evolution.value = null) }
}
