#!/usr/bin/env node
// 각 article/note 폴더의 assets 디렉토리를 apps/blog/public/contents/<collection>/<slug>/assets/ 로
// 증분 복사한다. frontmatter image가 "assets/splash.jpg" 같은 상대경로로 들어있고,
// 런타임에 정적 서빙되어야 하므로 public으로 옮긴다.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const COLLECTIONS = [
  {
    name: 'articles',
    src: path.resolve(__dirname, '../../../contents/articles'),
    dst: path.resolve(__dirname, '../public/contents/articles')
  },
  {
    name: 'notes',
    src: path.resolve(__dirname, '../../../contents/notes'),
    dst: path.resolve(__dirname, '../public/contents/notes')
  }
]

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  let copied = 0
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      copied += await copyDir(s, d)
      continue
    }
    if (!entry.isFile()) continue

    const sStat = await fs.stat(s)
    let same = false
    try {
      const dStat = await fs.stat(d)
      same = dStat.size === sStat.size && dStat.mtime.getTime() === sStat.mtime.getTime()
    } catch {
      same = false
    }
    if (!same) {
      await fs.copyFile(s, d)
      copied += 1
    }
  }
  return copied
}

async function syncCollection({ name, src, dst }) {
  if (!(await exists(src))) {
    console.warn(`[copy-article-assets] ${name} dir not found: ${src}`)
    return { slugs: 0, files: 0 }
  }
  const entries = await fs.readdir(src, { withFileTypes: true })
  let slugs = 0
  let files = 0
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const entrySrc = path.join(src, entry.name, 'assets')
    if (!(await exists(entrySrc))) continue
    const entryDst = path.join(dst, entry.name, 'assets')
    const copied = await copyDir(entrySrc, entryDst)
    if (copied > 0) {
      console.log(`[copy-article-assets] ${name}/${entry.name}: ${copied} files`)
    }
    files += copied
    slugs += 1
  }
  return { slugs, files }
}

async function main() {
  let totalSlugs = 0
  let totalCopied = 0
  for (const collection of COLLECTIONS) {
    const { slugs, files } = await syncCollection(collection)
    totalSlugs += slugs
    totalCopied += files
  }
  console.log(`[copy-article-assets] done. ${totalSlugs} slugs, ${totalCopied} files copied`)
}

main().catch((err) => {
  console.error('[copy-article-assets] failed:', err)
  process.exit(1)
})
