import type { MascotWindow } from '../windows/MascotWindow'
import type { StudyWindow } from '../windows/StudyWindow'
import { handle } from './handle'

export function registerStudyIpc(study: StudyWindow, mascot: MascotWindow): void {
  study.onClosed = () => mascot.setGameMode(false)
  handle(
    'study:fullscreen',
    (on) => {
      // vào game toàn màn hình thì ẩn mascot trên thanh tác vụ, thoát game thì hiện lại
      mascot.setGameMode(on)
      return study.setFullScreen(on)
    },
    { from: () => study.webContents }
  )
}
