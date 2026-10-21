// Gói âm thanh bài nghe tạo sẵn (node scripts/audio/build-listening-audio.mjs) — đăng lên GitHub Release của dự án
// (tag `listening-audio-<ver>`, pre-release nên không ảnh hưởng cập nhật app). Điền size + sha256 sau khi build.
import { LISTENING_PACK_ID } from '@shared/audioPack'
import type { AudioPackSpec } from './AudioPackManager'

const VERSION = '1.0.0'

export const LISTENING_AUDIO_PACK: AudioPackSpec = {
  id: LISTENING_PACK_ID,
  version: VERSION,
  url: `https://github.com/Congminh0707/english-assistant/releases/download/listening-audio-${VERSION}/listening-audio-${VERSION}.zip`,
  size: 14348931,
  sha256: '525049c0192782e1d212bc50822b2de862bdb2d857c3fca4da5a81ae1a4e46b9'
}
