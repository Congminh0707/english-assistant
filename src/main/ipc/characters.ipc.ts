import { BrowserWindow, dialog } from 'electron'
import { readFileSync, statSync } from 'node:fs'
import { basename } from 'node:path'
import { CHARACTER_PACK_EXT, CHARACTER_PACK_MAX_BYTES } from '@shared/schemas/characterPack'
import { CharacterPackError, type CharacterPackService } from '../services/CharacterPackService'
import type { StudyWindow } from '../windows/StudyWindow'
import { handle } from './handle'

/**
 * Gói nhân vật (.eapack): mọi cửa sổ đọc danh sách + hình; chỉ cửa sổ Học tập (Cài đặt) được cài/gỡ.
 * Hộp chọn file mở ở đây (service không import electron). Cài/gỡ xong `onChanged` đăng ký lại nhân vật và nạp lại các cửa sổ.
 */
export function registerCharacterIpc(
  packs: CharacterPackService,
  study: StudyWindow,
  onChanged: () => void
): void {
  const fromStudy = { from: () => study.webContents }
  handle('characters:packs', () => ({ packs: packs.list() }))
  handle('characters:art', ({ id }) => packs.art(id))
  handle(
    'characters:install-pack',
    async () => {
      const options: Electron.OpenDialogOptions = {
        properties: ['openFile'],
        filters: [{ name: 'English Assistant', extensions: [CHARACTER_PACK_EXT.slice(1)] }]
      }
      const owner = study.webContents[0]
        ? BrowserWindow.fromWebContents(study.webContents[0])
        : null
      const picked = owner
        ? await dialog.showOpenDialog(owner, options)
        : await dialog.showOpenDialog(options)
      const file = picked.filePaths[0]
      if (picked.canceled || !file) return { packs: packs.list(), installed: null }
      if (statSync(file).size > CHARACTER_PACK_MAX_BYTES) throw new CharacterPackError('quá cỡ')
      const info = packs.install(readFileSync(file, 'utf8'), basename(file))
      onChanged()
      return { packs: packs.list(), installed: info.id }
    },
    fromStudy
  )
  handle(
    'characters:remove-pack',
    ({ packId }) => {
      packs.remove(packId)
      onChanged()
      return { packs: packs.list() }
    },
    fromStudy
  )
}
