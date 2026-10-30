import type { StudyWindow } from '../windows/StudyWindow'
import { handle } from './handle'

export function registerStudyIpc(study: StudyWindow): void {
  handle('study:fullscreen', (on) => study.setFullScreen(on), { from: () => study.webContents })
}
