import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultSettings, type SettingKey, type Settings } from '@shared/schemas/settings'
import { invoke } from '../ipc'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(defaultSettings())

  async function load(): Promise<Settings> {
    settings.value = await invoke('settings:get-all')
    return settings.value
  }

  async function set<K extends SettingKey>(key: K, value: Settings[K]): Promise<void> {
    settings.value = await invoke('settings:set', { key, value })
  }

  /** Nghe thay đổi từ main (vd đổi ngôn ngữ trong menu chuột phải); trả về hàm huỷ */
  function listen(onChange?: (s: Settings) => void): () => void {
    return window.api.on('settings:changed', (s) => {
      settings.value = s
      onChange?.(s)
    })
  }

  return { settings, load, set, listen }
})
