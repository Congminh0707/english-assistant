// Gói âm thanh bài nghe tạo sẵn (node scripts/audio/build-listening-audio.mjs) — đăng lên GitHub Release của dự án
// (tag `listening-audio-<ver>`, pre-release nên không ảnh hưởng cập nhật app). Điền size + sha256 sau khi build.
import { LISTENING_PACK_ID } from '@shared/audioPack'
import type { AudioPackSpec } from './AudioPackManager'

const VERSION = '1.1.0'

export const LISTENING_AUDIO_PACK: AudioPackSpec = {
  id: LISTENING_PACK_ID,
  version: VERSION,
  url: `https://github.com/Congminh0707/english-assistant/releases/download/listening-audio-${VERSION}/listening-audio-${VERSION}.zip`,
  size: 22194886,
  sha256: '7bf41ad37461eece6919d5cd8f7e2d7207eb036053ccdcd6283adb6a18d8b98e'
}
