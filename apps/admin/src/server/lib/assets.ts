import { readdir, readFile, rm, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { CONTENTS_ROOT, categoryDir } from '../paths'
import { CATEGORIES, type Category } from '../../lib/types'

export type AssetEntry = {
  category: Category
  postSlug: string
  filename: string
  relPath: string
  sizeBytes: number
  referenced: boolean
  referencedBy: string[]
}

export type AssetReport = {
  totalBytes: number
  orphanBytes: number
  items: AssetEntry[]
  byCategory: Array<{ category: Category; bytes: number; count: number; orphans: number }>
}

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'])

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i).toLowerCase()
}

async function walkImages(dir: string, depth = 0): Promise<string[]> {
  if (depth > 5) return []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: string[] = []
  for (const e of entries) {
    if (e.name.startsWith('.')) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkImages(full, depth + 1)))
    } else if (e.isFile() && IMAGE_EXT.has(extOf(e.name))) {
      out.push(full)
    }
  }
  return out
}

async function readPostSource(absPath: string): Promise<string> {
  try {
    return await readFile(absPath, 'utf8')
  } catch {
    return ''
  }
}

async function collectPosts(cat: Category): Promise<Array<{ slug: string; dir: string; src: string }>> {
  const dir = categoryDir(cat)
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: Array<{ slug: string; dir: string; src: string }> = []
  for (const e of entries) {
    if (e.name.startsWith('.')) continue
    if (e.isDirectory()) {
      const indexPath = join(dir, e.name, 'index.md')
      const src = await readPostSource(indexPath)
      if (src) out.push({ slug: e.name, dir: join(dir, e.name), src })
    } else if (e.isFile() && /\.(md|mdx)$/i.test(e.name)) {
      const slug = e.name.replace(/\.(md|mdx)$/i, '')
      const src = await readPostSource(join(dir, e.name))
      if (src) out.push({ slug, dir, src })
    }
  }
  return out
}

export async function buildAssetReport(): Promise<AssetReport> {
  const items: AssetEntry[] = []
  const byCategory: AssetReport['byCategory'] = []

  for (const cat of CATEGORIES) {
    const posts = await collectPosts(cat)
    let catBytes = 0
    let catCount = 0
    let catOrphans = 0

    for (const post of posts) {
      const assetsDir = join(post.dir, 'assets')
      const files = await walkImages(assetsDir)
      for (const full of files) {
        const fname = full.slice(assetsDir.length + 1)
        let size = 0
        try {
          const st = await stat(full)
          size = st.size
        } catch {
          // skip
        }
        const needles = [
          fname,
          `./assets/${fname}`,
          `assets/${fname}`,
          encodeURIComponent(fname)
        ]
        const referenced = needles.some((n) => post.src.includes(n))
        const relPath = relative(CONTENTS_ROOT, full)
        items.push({
          category: cat,
          postSlug: post.slug,
          filename: fname,
          relPath,
          sizeBytes: size,
          referenced,
          referencedBy: referenced ? [`${cat}/${post.slug}`] : []
        })
        catBytes += size
        catCount += 1
        if (!referenced) catOrphans += 1
      }
    }

    byCategory.push({ category: cat, bytes: catBytes, count: catCount, orphans: catOrphans })
  }

  const totalBytes = items.reduce((a, x) => a + x.sizeBytes, 0)
  const orphanBytes = items.filter((x) => !x.referenced).reduce((a, x) => a + x.sizeBytes, 0)
  items.sort((a, b) => b.sizeBytes - a.sizeBytes)

  return { totalBytes, orphanBytes, items, byCategory }
}

function safeAssetAbsPath(relPath: string): string {
  const abs = join(CONTENTS_ROOT, relPath)
  if (!abs.startsWith(CONTENTS_ROOT + sep)) {
    throw Object.assign(new Error('invalid path'), { code: 'EINVAL' })
  }
  return abs
}

export async function deleteAsset(relPath: string): Promise<void> {
  const abs = safeAssetAbsPath(relPath)
  const ext = extOf(abs)
  if (!IMAGE_EXT.has(ext)) {
    throw Object.assign(new Error('not an image'), { code: 'EINVAL' })
  }
  if (!abs.includes(`${sep}assets${sep}`)) {
    throw Object.assign(new Error('not under assets/'), { code: 'EINVAL' })
  }
  await rm(abs, { force: true })
}
