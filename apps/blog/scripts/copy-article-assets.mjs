#!/usr/bin/env node
// 각 article 폴더의 assets 디렉토리를 apps/blog/public/contents/articles/<slug>/assets/ 로
// 증분 복사한다. frontmatter image가 "assets/splash.jpg" 같은 상대경로로 들어있고,
// 런타임에 정적 서빙되어야 하므로 public으로 옮긴다.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ARTICLES_DIR = path.resolve(__dirname, '../../../contents/articles')
const OUT_BASE = path.resolve(__dirname, '../public/contents/articles')

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

async function main() {
  if (!(await exists(ARTICLES_DIR))) {
    console.warn(`[copy-article-assets] articles dir not found: ${ARTICLES_DIR}`)
    return
  }
  const entries = await fs.readdir(ARTICLES_DIR, { withFileTypes: true })
  let totalCopied = 0
  let totalSlugs = 0

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const src = path.join(ARTICLES_DIR, entry.name, 'assets')
    if (!(await exists(src))) continue
    const dst = path.join(OUT_BASE, entry.name, 'assets')
    const copied = await copyDir(src, dst)
    if (copied > 0) {
      console.log(`[copy-article-assets] ${entry.name}: ${copied} files`)
    }
    totalCopied += copied
    totalSlugs += 1
  }

  console.log(`[copy-article-assets] done. ${totalSlugs} slugs, ${totalCopied} files copied`)
}

main().catch((err) => {
  console.error('[copy-article-assets] failed:', err)
  process.exit(1)
})
