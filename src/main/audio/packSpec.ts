// Gói âm thanh bài nghe tạo sẵn (node scripts/audio/build-listening-audio.mjs) — đăng lên GitHub Release của dự án
// (tag `listening-audio-<ver>`, pre-release nên không ảnh hưởng cập nhật app). Điền size + sha256 sau khi build.
import { LISTENING_PACK_ID } from '@shared/audioPack'
import type { AudioPackSpec } from './AudioPackManager'

const VERSION = '1.4.0'

export const LISTENING_AUDIO_PACK: AudioPackSpec = {
  id: LISTENING_PACK_ID,
  version: VERSION,
  url: `https://github.com/Congminh0707/english-assistant/releases/download/listening-audio-${VERSION}/listening-audio-${VERSION}.zip`,
  size: 54111046,
  sha256: 'dd1bd50ca1ee006178da99ab92478d3f7770246ca6cfd47b3adb532a5d30add7'
}
