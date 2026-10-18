import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

export const ROOT = resolve(here, '../../..')
export const CONTENT_DIR = join(ROOT, 'content')
export const RAW_DIR = join(CONTENT_DIR, 'raw')
export const NORMALIZED_DIR = join(CONTENT_DIR, 'normalized')
export const CURATED_DIR = join(CONTENT_DIR, 'curated')
export const PACKS_DIR = join(CONTENT_DIR, 'packs')
export const BUILD_DIR = join(CONTENT_DIR, '.build')

export const rawPath = (sourceId: string, file: string): string => join(RAW_DIR, sourceId, file)
export const normalizedPath = (file: string): string => join(NORMALIZED_DIR, file)
