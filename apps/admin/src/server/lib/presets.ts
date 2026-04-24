import { mkdir, readdir, readFile, rm, writeFile, stat } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { CONTENTS_ROOT } from '../paths'
import { CATEGORIES, type Category } from '../../lib/types'

const PRESETS_ROOT = join(CONTENTS_ROOT, '.presets')

export type Preset = {
  id: string
  name: string
  category: Category
  frontmatter: Record<string, unknown>
  body: string
  updatedAt: string
}

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{3,64}$/.test(id)
}

function isValidCategory(cat: unknown): cat is Category {
  return typeof cat === 'string' && (CATEGORIES as readonly string[]).includes(cat)
}

async function ensureRoot(): Promise<void> {
  await mkdir(PRESETS_ROOT, { recursive: true })
}

async function readOne(id: string): Promise<Preset | null> {
  const path = join(PRESETS_ROOT, `${id}.json`)
  try {
    const raw = await readFile(path, 'utf8')
    const parsed = JSON.parse(raw) as Preset
    return parsed
  } catch {
    return null
  }
}

export async function listPresets(): Promise<Preset[]> {
  await ensureRoot()
  let entries
  try {
    entries = await readdir(PRESETS_ROOT, { withFileTypes: true })
  } catch {
    return []
  }
  const out: Preset[] = []
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.json')) continue
    const id = e.name.replace(/\.json$/, '')
    const p = await readOne(id)
    if (p) out.push(p)
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}

function hashId(name: string, category: Category): string {
  const h = createHash('sha1').update(`${category}::${name}`).digest('hex').slice(0, 10)
  return `p-${h}`
}

export type SavePresetInput = {
  id?: string
  name: string
  category: Category
  frontmatter: Record<string, unknown>
  body: string
}

export async function savePreset(input: SavePresetInput): Promise<Preset> {
  if (!input.name || typeof input.name !== 'string') {
    throw Object.assign(new Error('name is required'), { code: 'EINVAL' })
  }
  if (!isValidCategory(input.category)) {
    throw Object.assign(new Error('invalid category'), { code: 'EINVAL' })
  }
  if (typeof input.body !== 'string') {
    throw Object.assign(new Error('body must be string'), { code: 'EINVAL' })
  }
  if (!input.frontmatter || typeof input.frontmatter !== 'object') {
    throw Object.assign(new Error('frontmatter must be object'), { code: 'EINVAL' })
  }
  await ensureRoot()

  let id = input.id
  if (id && !isValidId(id)) {
    throw Object.assign(new Error('invalid preset id'), { code: 'EINVAL' })
  }
  if (!id) {
    id = hashId(input.name, input.category)
    if (await readOne(id)) id = `p-${randomUUID().slice(0, 10)}`
  }

  const preset: Preset = {
    id,
    name: input.name,
    category: input.category,
    frontmatter: input.frontmatter,
    body: input.body,
    updatedAt: new Date().toISOString()
  }
  const path = join(PRESETS_ROOT, `${id}.json`)
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`
  await writeFile(tmp, JSON.stringify(preset, null, 2), 'utf8')
  const { rename } = await import('node:fs/promises')
  await rename(tmp, path)
  return preset
}

export async function deletePreset(id: string): Promise<void> {
  if (!isValidId(id)) {
    throw Object.assign(new Error('invalid preset id'), { code: 'EINVAL' })
  }
  const path = join(PRESETS_ROOT, `${id}.json`)
  try {
    await stat(path)
  } catch {
    throw Object.assign(new Error('preset not found'), { code: 'ENOENT' })
  }
  await rm(path, { force: true })
}
