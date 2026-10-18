import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PetState } from '@shared/schemas/pet'
import { invoke } from '../ipc'

/** Bản sao trạng thái thú cưng để hiển thị — main là nguồn sự thật (docs/03-architecture.md#5) */
export const usePetStore = defineStore('pet', () => {
  const pet = ref<PetState | null>(null)

  async function load(): Promise<PetState> {
    pet.value = await invoke('pet:get')
    return pet.value
  }

  async function pat(): Promise<{ before: PetState | null; after: PetState }> {
    const before = pet.value
    pet.value = await invoke('pet:pat')
    return { before, after: pet.value }
  }

  /** Nghe cập nhật do main đẩy xuống; trả về hàm huỷ */
  function listen(): () => void {
    return window.api.on('pet:updated', (state) => {
      pet.value = state
    })
  }

  return { pet, load, pat, listen }
})
