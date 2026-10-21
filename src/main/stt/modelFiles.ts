// Model nhận dạng giọng nói: Whisper base.en (OpenAI, Apache-2.0 theo model card), bản ONNX lượng tử hoá 8-bit
// của Xenova (transformers.js). Ghim revision + sha256 từng file (tải rồi kiểm tra trước khi dùng — docs/16).
// Tổng ~80 MB; không nằm trong bộ cài: tải khi người dùng đồng ý (Cài đặt → Nhận dạng giọng nói).
import type { ModelSpec } from '../translate/modelFiles'

export const WHISPER_MODEL_ID = 'Xenova/whisper-base.en'

export const WHISPER_BASE_EN: ModelSpec = {
  id: WHISPER_MODEL_ID,
  revision: '95bf40a508535962c6483ead40270b2e32267508',
  files: [
    {
      path: 'added_tokens.json',
      size: 2082,
      sha256: '598c98875c01fe7ebd08ba6779f052f1136de6d36d9e7b99e04b432f78ecb28d'
    },
    {
      path: 'config.json',
      size: 2202,
      sha256: '5c390f2c6ba84ddeb7e362cd8b2123832911407850174e64d7081ccc36df2d64'
    },
    {
      path: 'generation_config.json',
      size: 1500,
      sha256: '1e57ed56ad1bd7f08a49ece7fe7daada674573805a35f8bdbbe68380aab5b1ee'
    },
    {
      path: 'merges.txt',
      size: 456318,
      sha256: '1ce1664773c50f3e0cc8842619a93edc4624525b728b188a9e0be33b7726adc5'
    },
    {
      path: 'normalizer.json',
      size: 52666,
      sha256: 'bf1c507dc8724ca9cf9903640dacfb69dae2f00edee4f21ceba106a7392f26dd'
    },
    {
      path: 'preprocessor_config.json',
      size: 339,
      sha256: 'a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d'
    },
    {
      path: 'special_tokens_map.json',
      size: 1717,
      sha256: '7da611d517fe29e77335b8d8384e71795fb7b37cbf95bdc3b5252fa7e09dd1f8'
    },
    {
      path: 'tokenizer.json',
      size: 2128494,
      sha256: 'c6ee8f089220a5b1188f6426456772572671c6141ae007eecb83c6a8349f5deb'
    },
    {
      path: 'tokenizer_config.json',
      size: 835,
      sha256: 'e082c1ad251541bf277967a703252cddd4bb37a71a43737e03d050c22ec08238'
    },
    {
      path: 'vocab.json',
      size: 999186,
      sha256: 'f6bd25a65e4e63ca31360e9fb11c7e4f9a391a78385d640acd814092dd6eee4f'
    },
    {
      path: 'onnx/encoder_model_quantized.onnx',
      size: 23200856,
      sha256: 'd0d4e59e2842617b39787cece73d7e8f76f99b1697d3386c0e682eca2269f4a1'
    },
    {
      path: 'onnx/decoder_model_merged_quantized.onnx',
      size: 53707027,
      sha256: 'a25afc5858a20aabb7652cb2d555996ebe10691a69bbdb423d5073d52f060325'
    }
  ]
}

/**
 * Model nhận dạng âm vị (wav2vec2 phoneme CTC) — TUỲ CHỌN, người dùng tự chọn tải thêm (355 MB; có thể thành gói trả
 * phí về sau). Là bản ONNX int8 của `facebook/wav2vec2-lv-60-espeak-cv-ft` (Apache-2.0) do `duyentq` công bố kèm
 * quy trình chuyển đổi; URL ghim theo commit + sha256 (đã đối chiếu). Bảng âm (`wav2vec2-vocab.json`) lấy từ bản gốc
 * facebook, rev `ae45363` (sha256 d732ab24…). Ngưỡng điểm hiệu chỉnh trên đúng file này, đừng thay bằng file khác.
 */
export const PRONUNCIATION_MODEL: ModelSpec | null = {
  id: 'duyentq/sonari-wav2vec2-phoneme-int8',
  revision: 'f0652c415244e59f472e23fe3c629cea1e694a11',
  files: [
    {
      path: 'wav2vec2_int8.onnx',
      size: 355352992,
      sha256: 'cd51f95340d31f72ffefc1b734bb6fae91f2f8b0964eb450a838ef7344a72876'
    }
  ]
}
