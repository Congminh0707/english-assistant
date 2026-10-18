import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline'
import { createGunzip } from 'node:zlib'
import { dirname } from 'node:path'
import type { Readable } from 'node:stream'

/** Đọc từng dòng của file lớn (tự giải nén nếu đuôi .gz) — không nạp cả file vào RAM. */
export async function* readLines(path: string): AsyncGenerator<string> {
  let stream: Readable = createReadStream(path, { highWaterMark: 1 << 20 })
  if (path.endsWith('.gz')) stream = stream.pipe(createGunzip())
  const rl = createInterface({ input: stream, crlfDelay: Infinity })
  for await (const line of rl) yield line
}

export async function* readJsonl<T>(path: string): AsyncGenerator<T> {
  for await (const line of readLines(path)) {
    if (line.trim()) yield JSON.parse(line) as T
  }
}

/** Ghi JSONL theo luồng; gọi close() để chờ flush xong. */
export class JsonlWriter {
  private stream
  count = 0

  constructor(path: string) {
    this.stream = createWriteStream(path, { encoding: 'utf8' })
  }

  async write(record: unknown): Promise<void> {
    this.count++
    if (!this.stream.write(JSON.stringify(record) + '\n')) {
      await new Promise<void>((r) => this.stream.once('drain', () => r()))
    }
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end((err?: Error | null) => (err ? reject(err) : resolve()))
    })
  }
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await ensureDir(dirname(path))
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

export async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path, { highWaterMark: 1 << 20 })) hash.update(chunk)
  return hash.digest('hex')
}

export function requireFile(path: string, hint: string): void {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}\n  → run: ${hint}`)
  }
}

/** Parse một dòng CSV đơn giản có hỗ trợ trường trong dấu ngoặc kép. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

export function log(...args: unknown[]): void {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args)
}
