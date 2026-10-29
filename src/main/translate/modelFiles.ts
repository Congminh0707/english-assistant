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

/** Chiều ngược lại: Helsinki-NLP/opus-mt-vi-en (Apache-2.0), cùng bộ file và cách đóng gói. */
export const OPUS_MT_VI_EN: ModelSpec = {
  id: 'Xenova/opus-mt-vi-en',
  revision: '541dfd72ec07e8f1563795e0224408ad8d729e80',
  files: [
    {
      path: 'config.json',
      size: 1389,
      sha256: 'c62a203a0183755af37b96a33cc125e7f74f97c1e90aaae1d1f404fd8a42eea8'
    },
    {
      path: 'generation_config.json',
      size: 293,
      sha256: '44f2c9011a9087c5ec93a1671066a4a59a7a8c00c03e84a6ecac0d840926566b'
    },
    {
      path: 'tokenizer_config.json',
      size: 282,
      sha256: '0221122d916f6f230d6b1967644457745aa01514e054897f62b8c6b419460ceb'
    },
    {
      path: 'tokenizer.json',
      size: 5169708,
      sha256: 'c41cc5afd26c053770b60e1031577bb7a8e2f3c2eeacde2a34f5c15abfd4eafd'
    },
    {
      path: 'onnx/encoder_model_quantized.onnx',
      size: 47133597,
      sha256: 'fa7bd78e8bed6bdc03728f62f1592c4bb52d9e12795496604c1e990e102abdb2'
    },
    {
      path: 'onnx/decoder_model_merged_quantized.onnx',
      size: 54401611,
      sha256: '540edbcc08bab0b42c03576a759fd9b4d5fc99996ac3178630733916dc2325cb'
    }
  ]
}

/**
 * Model dịch chất lượng cao: NLLB-200 distilled 600M (Meta AI, CC-BY-NC-4.0 — phi thương mại), bản ONNX lượng tử hoá 8-bit của Xenova.
 * MỘT model dịch cả Anh→Việt và Việt→Anh (mã ngôn ngữ eng_Latn / vie_Latn), ~870 MB (831 MiB) — tuỳ chọn tải thêm, chuẩn hơn rõ rệt
 * so với mBART-50 (đã đo: docs/decisions.md #34). Không đóng gói kèm app — xem docs/08-content-sources.md.
 */
export const NLLB_200: ModelSpec = {
  id: 'Xenova/nllb-200-distilled-600M',
  revision: '261c31d1a5732c67cdd16d80e8d6088507c7ccea',
  files: [
    {
      path: 'config.json',
      size: 873,
      sha256: '52f035acb54ac80e5ef7fe78d6967f8ddf8e8799f078d1a92a2c8168d8ff4a20'
    },
    {
      path: 'generation_config.json',
      size: 189,
      sha256: '1ce846259ae04c572ae1863e358534bbc376ff3d3f100b1494feda6200b51de8'
    },
    {
      path: 'tokenizer_config.json',
      size: 544,
      sha256: 'ddf411c9f790d081e72de76bb8e8b714d74e160e61bc10c9bd8f56022dcd7fd7'
    },
    {
      path: 'tokenizer.json',
      size: 17331224,
      sha256: '8ac789ad7dabea44d41537822d48c516ba358374c51813e2cba78c006e150c94'
    },
    {
      path: 'onnx/encoder_model_quantized.onnx',
      size: 419120483,
      sha256: '5cde664eacba07a62f198857ec6c06e09572b1ebb77c8137f1fa99ac604a3a28'
    },
    {
      path: 'onnx/decoder_model_merged_quantized.onnx',
      size: 475505771,
      sha256: 'dd66608c2a4194e78f95548fa0e64f24302303698c5b09fa8e1f9e16ec00676b'
    }
  ]
}


export const modelBaseUrl = (spec: ModelSpec): string =>
  `https://huggingface.co/${spec.id}/resolve/${spec.revision}/`

export const modelTotalBytes = (spec: ModelSpec): number =>
  spec.files.reduce((sum, f) => sum + f.size, 0)
