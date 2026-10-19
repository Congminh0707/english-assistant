// Model dịch offline: Helsinki-NLP/opus-mt-en-vi (Apache-2.0), bản ONNX lượng tử hoá 8-bit của Xenova (transformers.js).
// Ghim đúng revision + sha256 từng file: tải về từ Hugging Face rồi kiểm tra trước khi dùng (docs/16-privacy-and-security.md).

export interface ModelFile {
  /** Đường dẫn tương đối trong thư mục model */
  path: string
  size: number
  sha256: string
}

export interface ModelSpec {
  /** Id kiểu Hugging Face: cũng là cấu trúc thư mục con trong userData/models */
  id: string
  revision: string
  files: ModelFile[]
}

export const OPUS_MT_EN_VI: ModelSpec = {
  id: 'Xenova/opus-mt-en-vi',
  revision: '30bcd461c0d7338ad106b36314d3eedc2d4e998c',
  files: [
    {
      path: 'config.json',
      size: 1389,
      sha256: '0c5ab981c2f5a4878c78522c8a61e3d733f5e3be6b1f83b68bbfb7f00e604637'
    },
    {
      path: 'generation_config.json',
      size: 293,
      sha256: '621eef69f7a1c7eff4bd5c696a113bd773de03e985f0a382b2c2e21002804dd2'
    },
    {
      path: 'tokenizer_config.json',
      size: 282,
      sha256: '51777ca2be47ccea798ad6e1457efbf8fcff1067258b21c6de7f834e1f4fa198'
    },
    {
      path: 'tokenizer.json',
      size: 5163544,
      sha256: '0e8bf67ccde0948009d8fe4254beb6e0df7df2950b627c9e53324a9857789a80'
    },
    {
      path: 'onnx/encoder_model_quantized.onnx',
      size: 47105950,
      sha256: 'dfcd7a32be3fdd21cbcf5d354520d626f1768fd6e205ca62a6a11a4641d31f36'
    },
    {
      path: 'onnx/decoder_model_merged_quantized.onnx',
      size: 54373748,
      sha256: '1cfc6a84f9c189e6928c9710b281fae3f1f42d4ffbba109e7b4ec8e31ceb06dd'
    }
  ]
}

export const modelBaseUrl = (spec: ModelSpec): string =>
  `https://huggingface.co/${spec.id}/resolve/${spec.revision}/`

export const modelTotalBytes = (spec: ModelSpec): number =>
  spec.files.reduce((sum, f) => sum + f.size, 0)
