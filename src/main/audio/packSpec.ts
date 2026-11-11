// Gói âm thanh bài nghe tạo sẵn (node scripts/audio/build-listening-audio.mjs) — đăng lên GitHub Release của dự án
// (tag `listening-audio-<ver>`, pre-release nên không ảnh hưởng cập nhật app). Điền size + sha256 sau khi build.
import { LISTENING_PACK_ID } from '@shared/audioPack'
import type { AudioPackSpec } from './AudioPackManager'

const VERSION = '1.7.0'

export const LISTENING_AUDIO_PACK: AudioPackSpec = {
  id: LISTENING_PACK_ID,
  version: VERSION,
  url: `https://github.com/Congminh0707/english-assistant/releases/download/listening-audio-${VERSION}/listening-audio-${VERSION}.zip`,
  size: 267760884,
  sha256: '6c81104b611db8b475af542af82bc462b71d1da4e7d52289fa308f55219d88c5'
}
