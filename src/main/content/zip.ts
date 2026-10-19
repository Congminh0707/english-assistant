import { createReadStream, createWriteStream, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { Unzip, UnzipInflate, unzipSync } from 'fflate'

export interface ExtractedFile {
  sizeBytes: number
  sha256: string
}

/** Đọc một file nhỏ trong zip (vd manifest.json) mà không giải nén cả gói */
export function readSmallEntry(zipPath: string, name: string): Uint8Array | null {
  const files = unzipSync(readFileSync(zipPath), { filter: (f) => f.name === name })
  return files[name] ?? null
}

/**
 * Giải nén theo luồng các file cần thiết ra thư mục — content.db (~100+ MB) không phải nạp hết vào RAM.
 * Đồng thời tính sha256 để đối chiếu với manifest.
 */
export function extractEntries(
  zipPath: string,
  outDir: string,
  names: string[]
): Promise<Map<string, ExtractedFile>> {
  const wanted = new Set(names)
  return new Promise((resolve, reject) => {
    const results = new Map<string, ExtractedFile>()
    let pending = 0
    let inputEnded = false
    let failed = false
    const fail = (err: unknown): void => {
      if (failed) return
      failed = true
      reject(err)
    }
    const maybeDone = (): void => {
      if (inputEnded && pending === 0 && !failed) resolve(results)
    }

    const unzip = new Unzip((file) => {
      if (!wanted.has(file.name)) return
      pending++
      const out = createWriteStream(join(outDir, file.name))
      out.on('error', fail)
      const hash = createHash('sha256')
      let size = 0
      file.ondata = (err, chunk, final) => {
        if (err) return fail(err)
        hash.update(chunk)
        size += chunk.length
        out.write(chunk)
        if (final) {
          out.end(() => {
            results.set(file.name, { sizeBytes: size, sha256: hash.digest('hex') })
            pending--
            maybeDone()
          })
        }
      }
      file.start()
    })
    unzip.register(UnzipInflate)

    const input = createReadStream(zipPath, { highWaterMark: 1 << 20 })
    input.on('data', (chunk) => {
      try {
        unzip.push(chunk as Uint8Array)
      } catch (err) {
        fail(err)
      }
    })
    input.on('end', () => {
      try {
        unzip.push(new Uint8Array(0), true)
      } catch (err) {
        return fail(err)
      }
      inputEnded = true
      maybeDone()
    })
    input.on('error', fail)
  })
}
