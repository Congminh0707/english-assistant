import { createReadStream, createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { Zip, ZipDeflate, unzipSync } from 'fflate'

export type ZipEntry = { name: string; path: string } | { name: string; data: string | Uint8Array }

/** Ghi file zip theo luồng (file lớn như content.db không phải nạp hết vào RAM). */
export async function writeZip(outPath: string, entries: ZipEntry[]): Promise<void> {
  const ws = createWriteStream(outPath)
  const zip = new Zip()
  const done = new Promise<void>((resolve, reject) => {
    ws.on('error', reject)
    ws.on('finish', () => resolve())
    zip.ondata = (err, chunk, final) => {
      if (err) return reject(err)
      ws.write(chunk)
      if (final) ws.end()
    }
  })
  for (const e of entries) {
    const file = new ZipDeflate(e.name, { level: 9 })
    zip.add(file)
    if ('path' in e) {
      for await (const chunk of createReadStream(e.path, { highWaterMark: 1 << 20 })) {
        file.push(chunk as Uint8Array)
      }
      file.push(new Uint8Array(0), true)
    } else {
      file.push(typeof e.data === 'string' ? new TextEncoder().encode(e.data) : e.data, true)
    }
  }
  zip.end()
  await done
}

/** Đọc một file trong zip (giải nén vào RAM) */
export async function readZipEntry(zipPath: string, name: string): Promise<Uint8Array> {
  const files = unzipSync(await readFile(zipPath), { filter: (f) => f.name === name })
  const data = files[name]
  if (!data) throw new Error(`${name} not found in ${zipPath}`)
  return data
}
