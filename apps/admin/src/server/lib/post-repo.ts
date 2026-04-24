import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, dirname, join } from 'node:path'
import matter from 'gray-matter'
import { categoryDir, CONTENTS_ROOT, TRASH_ROOT } from '../paths'
import type { Category, PostFull, PostMeta, PostStatus } from '../../lib/types'

type Frontmatter = Record<string, unknown>

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function pickDate(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'string' && v.length > 0) {
    const d = new Date(v)
    return isNaN(d.getTime()) ? v : d.toISOString()
  }
  return null
}

function pickSeries(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && 'name' in v) {
    const name = (v as { name?: unknown }).name
    return typeof name === 'string' ? name : null
  }
  return null
}

function toPostMeta(args: {
  category: Category
  slug: string
  filePath: string
  data: Frontmatter
}): PostMeta {
  const { category, slug, filePath, data } = args
  const draft = data.draft === true
  const statusFromData = pickString(data.status) as PostStatus | null
  const status: PostStatus = statusFromData ?? (draft ? 'draft' : 'published')
  const tags = Array.isArray(data.tags)
    ? (data.tags.filter((t) => typeof t === 'string') as string[])
    : []

  return {
    category,
    slug,
    filePath,
    title: pickString(data.title) ?? slug,
    date: pickDate(data.date),
    tags,
    draft,
    status,
    description: pickString(data.description) ?? pickString(data.dek),
    image: pickString(data.image),
    series: pickSeries(data.series),
    updated: pickDate(data.updated)
  }
}

export function hashContent(raw: string): string {
  return createHash('sha1').update(raw).digest('hex')
}

async function discoverFiles(cat: Category): Promise<Array<{ slug: string; absPath: string; relPath: string }>> {
  const dir = categoryDir(cat)
  let entries: Dirent[] = []
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Dirent[]
  } catch {
    return []
  }
  const out: Array<{ slug: string; absPath: string; relPath: string }> = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (entry.isFile()) {
      if (/\.(md|mdx)$/i.test(entry.name)) {
        const slug = entry.name.replace(/\.(md|mdx)$/i, '')
        out.push({
          slug,
          absPath: join(dir, entry.name),
          relPath: `${cat}/${entry.name}`
        })
      }
    } else if (entry.isDirectory()) {
      const indexPath = join(dir, entry.name, 'index.md')
      try {
        await readFile(indexPath, 'utf8')
        out.push({
          slug: entry.name,
          absPath: indexPath,
          relPath: `${cat}/${entry.name}/index.md`
        })
      } catch {
        // index.md 없는 디렉토리는 건너뜀
      }
    }
  }
  return out
}

export type PostSource = {
  category: Category
  slug: string
  filePath: string
  absPath: string
  content: string
  data: Frontmatter
}

export async function listAllPostSources(): Promise<PostSource[]> {
  const cats: Category[] = ['articles', 'notes', 'projects']
  const all: PostSource[] = []
  for (const cat of cats) {
    const files = await discoverFiles(cat)
    for (const f of files) {
      try {
        const raw = await readFile(f.absPath, 'utf8')
        const parsed = matter(raw)
        all.push({
          category: cat,
          slug: f.slug,
          filePath: f.relPath,
          absPath: f.absPath,
          content: parsed.content,
          data: parsed.data as Frontmatter
        })
      } catch {
        // skip
      }
    }
  }
  return all
}

export async function listPosts(category: Category): Promise<PostMeta[]> {
  const files = await discoverFiles(category)
  const posts = await Promise.all(
    files.map(async (f) => {
      const raw = await readFile(f.absPath, 'utf8')
      const parsed = matter(raw)
      return toPostMeta({
        category,
        slug: f.slug,
        filePath: f.relPath,
        data: parsed.data as Frontmatter
      })
    })
  )
  return posts
}

async function resolvePostPath(category: Category, slug: string): Promise<{ absPath: string; relPath: string } | null> {
  const dir = categoryDir(category)
  const candidates = [
    join(dir, slug, 'index.md'),
    join(dir, `${slug}.md`),
    join(dir, `${slug}.mdx`)
  ]
  for (const p of candidates) {
    try {
      await stat(p)
      return { absPath: p, relPath: p.slice(CONTENTS_ROOT.length + 1) }
    } catch {
      // try next
    }
  }
  return null
}

export async function getPost(category: Category, slug: string): Promise<PostFull> {
  const resolved = await resolvePostPath(category, slug)
  if (!resolved) {
    const err = new Error(`post not found: ${category}/${slug}`)
    ;(err as Error & { code?: string }).code = 'ENOENT'
    throw err
  }
  const raw = await readFile(resolved.absPath, 'utf8')
  const parsed = matter(raw)
  const meta = toPostMeta({ category, slug, filePath: resolved.relPath, data: parsed.data as Frontmatter })
  return { ...meta, content: parsed.content, rawSource: raw, hash: hashContent(raw), data: parsed.data as Frontmatter }
}

async function atomicWrite(absPath: string, content: string): Promise<void> {
  await mkdir(dirname(absPath), { recursive: true })
  const tmp = `${absPath}.tmp-${process.pid}-${Date.now()}`
  await writeFile(tmp, content, 'utf8')
  await rename(tmp, absPath)
}

export async function savePost(args: {
  category: Category
  slug: string
  frontmatter: Frontmatter
  content: string
  expectedHash: string | null
}): Promise<PostFull> {
  const resolved = await resolvePostPath(args.category, args.slug)
  if (!resolved) {
    const err = new Error(`post not found: ${args.category}/${args.slug}`)
    ;(err as Error & { code?: string }).code = 'ENOENT'
    throw err
  }
  if (args.expectedHash) {
    const currentRaw = await readFile(resolved.absPath, 'utf8')
    const currentHash = hashContent(currentRaw)
    if (currentHash !== args.expectedHash) {
      const err = new Error('stale write: file on disk has changed')
      ;(err as Error & { code?: string }).code = 'ESTALE'
      throw err
    }
  }
  const newRaw = matter.stringify(args.content, args.frontmatter)
  await atomicWrite(resolved.absPath, newRaw)
  const parsed = matter(newRaw)
  const meta = toPostMeta({
    category: args.category,
    slug: args.slug,
    filePath: resolved.relPath,
    data: parsed.data as Frontmatter
  })
  return { ...meta, content: parsed.content, rawSource: newRaw, hash: hashContent(newRaw), data: parsed.data as Frontmatter }
}

export async function createPost(args: {
  category: Category
  slug: string
  frontmatter: Frontmatter
  content: string
}): Promise<PostFull> {
  const existing = await resolvePostPath(args.category, args.slug)
  if (existing) {
    const err = new Error(`slug already exists: ${args.category}/${args.slug}`)
    ;(err as Error & { code?: string }).code = 'EEXIST'
    throw err
  }
  const dir = categoryDir(args.category)
  const absPath = join(dir, `${args.slug}.md`)
  const relPath = `${args.category}/${args.slug}.md`
  const newRaw = matter.stringify(args.content, args.frontmatter)
  await atomicWrite(absPath, newRaw)
  const parsed = matter(newRaw)
  const meta = toPostMeta({
    category: args.category,
    slug: args.slug,
    filePath: relPath,
    data: parsed.data as Frontmatter
  })
  return { ...meta, content: parsed.content, rawSource: newRaw, hash: hashContent(newRaw), data: parsed.data as Frontmatter }
}

function timestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export async function trashPost(category: Category, slug: string): Promise<{ trashedPath: string }> {
  const resolved = await resolvePostPath(category, slug)
  if (!resolved) {
    const err = new Error(`post not found: ${category}/${slug}`)
    ;(err as Error & { code?: string }).code = 'ENOENT'
    throw err
  }
  await mkdir(TRASH_ROOT, { recursive: true })
  const isFolderIndex = basename(resolved.absPath) === 'index.md'
  const srcPath = isFolderIndex ? dirname(resolved.absPath) : resolved.absPath
  const stamp = timestamp()
  const baseName = isFolderIndex ? basename(dirname(resolved.absPath)) : basename(resolved.absPath)
  const destPath = join(TRASH_ROOT, `${stamp}__${category}__${baseName}`)
  await rename(srcPath, destPath)
  return { trashedPath: destPath.slice(CONTENTS_ROOT.length + 1) }
}

export async function movePost(args: {
  fromCategory: Category
  toCategory: Category
  slug: string
}): Promise<PostMeta> {
  if (args.fromCategory === args.toCategory) {
    const err = new Error('source and target categories are the same')
    ;(err as Error & { code?: string }).code = 'EINVAL'
    throw err
  }
  const resolved = await resolvePostPath(args.fromCategory, args.slug)
  if (!resolved) {
    const err = new Error(`post not found: ${args.fromCategory}/${args.slug}`)
    ;(err as Error & { code?: string }).code = 'ENOENT'
    throw err
  }
  const targetExisting = await resolvePostPath(args.toCategory, args.slug)
  if (targetExisting) {
    const err = new Error(`slug already exists in target: ${args.toCategory}/${args.slug}`)
    ;(err as Error & { code?: string }).code = 'EEXIST'
    throw err
  }

  const targetDir = categoryDir(args.toCategory)
  await mkdir(targetDir, { recursive: true })

  const isFolderIndex = basename(resolved.absPath) === 'index.md'
  const srcPath = isFolderIndex ? dirname(resolved.absPath) : resolved.absPath
  const baseName = isFolderIndex ? basename(dirname(resolved.absPath)) : basename(resolved.absPath)
  const destPath = join(targetDir, baseName)
  await rename(srcPath, destPath)

  const newRelRoot = isFolderIndex
    ? `${args.toCategory}/${baseName}/index.md`
    : `${args.toCategory}/${baseName}`
  const readAbs = isFolderIndex ? join(destPath, 'index.md') : destPath
  const raw = await readFile(readAbs, 'utf8')
  const parsed = matter(raw)
  return toPostMeta({
    category: args.toCategory,
    slug: args.slug,
    filePath: newRelRoot,
    data: parsed.data as Frontmatter
  })
}
