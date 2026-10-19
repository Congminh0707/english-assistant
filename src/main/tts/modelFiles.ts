// Model giọng đọc: Kokoro-82M (hexgrad, Apache-2.0), bản ONNX lượng tử hoá 8-bit của onnx-community (transformers.js).
// Ghim revision + sha256 từng file (tải rồi kiểm tra trước khi dùng — docs/16-privacy-and-security.md).
// File giọng (voices/*.bin) và bộ phiên âm (phonemizer, WASM) đi kèm trong gói npm `kokoro-js`/`phonemizer`.
import type { ModelSpec } from '../translate/modelFiles'

export const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'

export const KOKORO: ModelSpec = {
  id: KOKORO_MODEL_ID,
  revision: '1939ad2a8e416c0acfeecc08a694d14ef25f2231',
  files: [
    {
      path: 'config.json',
      size: 44,
      sha256: 'df34b4f930b23447cd4dc410fabfb42eb3f24e803e6c3f97d618fb359380a36f'
    },
    {
      path: 'tokenizer.json',
      size: 3497,
      sha256: '77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34'
    },
    {
      path: 'tokenizer_config.json',
      size: 113,
      sha256: 'be1cb066d6ef6b074b3f15e6a6dd21ac88ff3cdaedf325f0aaed686c70f75d20'
    },
    {
      path: 'onnx/model_quantized.onnx',
      size: 92361116,
      sha256: 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478'
    }
  ]
}
