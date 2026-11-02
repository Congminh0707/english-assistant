// Gói âm thanh bài nghe tạo sẵn (node scripts/audio/build-listening-audio.mjs) — đăng lên GitHub Release của dự án
// (tag `listening-audio-<ver>`, pre-release nên không ảnh hưởng cập nhật app). Điền size + sha256 sau khi build.
import { LISTENING_PACK_ID } from '@shared/audioPack'
import type { AudioPackSpec } from './AudioPackManager'

const VERSION = '1.3.0'

export const LISTENING_AUDIO_PACK: AudioPackSpec = {
  id: LISTENING_PACK_ID,
  version: VERSION,
  url: `https://github.com/Congminh0707/english-assistant/releases/download/listening-audio-${VERSION}/listening-audio-${VERSION}.zip`,
  size: 23397766,
  sha256: '9c3b41936a42754f9ffdc1839f0c510c252165f4a743e7485404a3c071a37a5d'
}
