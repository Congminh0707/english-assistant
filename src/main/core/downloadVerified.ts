import { createHash } from 'node:crypto'
import { AppError } from './AppError'

export interface DownloadSpec {
  url: string
  size: number
  sha256: string
}

/**
 * Tải một file (gói nội dung) vào bộ nhớ, báo tiến trình, kiểm tra đúng kích thước + sha256 rồi mới trả về.
 * Dùng chung cho các gói tải thêm (âm thanh bài nghe, sprite độ phân giải cao). Không import electron.
 */
export async function downloadVerified(
  spec: DownloadSpec,
  fetchFn: typeof fetch,
  onProgress: (receivedBytes: number) => void,
  signal?: AbortSignal
): Promise<Buffer> {
  onProgress(0)
  const response = await fetchFn(spec.url, { signal, redirect: 'follow' })
  if (!response.ok || !response.body) throw new AppError('MODEL_DOWNLOAD', 'errors.modelDownload')

  const hash = createHash('sha256')
  const chunks: Buffer[] = []
  let received = 0
  const reader = response.body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      const buf = Buffer.from(value)
      hash.update(buf)
      chunks.push(buf)
      received += buf.length
      onProgress(Math.min(received, spec.size))
    }
  } finally {
    reader.releaseLock()
  }
  if (received !== spec.size || hash.digest('hex') !== spec.sha256) {
    throw new AppError('MODEL_CORRUPT', 'errors.modelCorrupt')
  }
  return Buffer.concat(chunks)
}
