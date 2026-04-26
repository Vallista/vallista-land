#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { ulid } from 'ulid'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..')
const contentsDir = join(repoRoot, 'contents')

const isDryRun = process.argv.includes('--dry-run')

async function walk(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

function decideState(collection, data) {
  if (collection === 'articles') {
    return data.draft === true ? 'draft' : 'published'
  }
  return 'sprout'
}

async function migrateOne(file, collection, stats) {
  const raw = await readFile(file, 'utf8')
  const parsed = matter(raw)
  const data = { ...parsed.data }
  const before = { id: data.id, state: data.state }

  let modified = false

  if (typeof data.id !== 'string' || data.id.length === 0) {
    data.id = ulid()
    modified = true
  }

  if (typeof data.state !== 'string' || data.state.length === 0) {
    data.state = decideState(collection, data)
    modified = true
  }

  const rel = relative(contentsDir, file)
  if (!modified) {
    stats.unchanged += 1
    return
  }

  stats.changed += 1
  const detail = `id=${before.id ? '(kept)' : data.id} state=${before.state ? '(kept)' : data.state}`
  if (isDryRun) {
    console.log(`[DRY] ${rel}  ${detail}`)
    return
  }
  const next = matter.stringify(parsed.content, data)
  await writeFile(file, next, 'utf8')
  console.log(`UPD ${rel}  ${detail}`)
}

async function migrate() {
  const groups = [
    { collection: 'articles', dir: join(contentsDir, 'articles') },
    { collection: 'notes', dir: join(contentsDir, 'notes') }
  ]

  const stats = { changed: 0, unchanged: 0, errors: 0 }

  for (const { collection, dir } of groups) {
    const files = await walk(dir)
    console.log(`\n# ${collection} (${files.length} files)`)
    for (const file of files) {
      try {
        await migrateOne(file, collection, stats)
      } catch (err) {
        stats.errors += 1
        console.error(`ERR ${file}: ${err.message}`)
      }
    }
  }

  console.log(
    `\n${isDryRun ? '[DRY RUN] ' : ''}done — ${stats.changed} changed, ${stats.unchanged} unchanged, ${stats.errors} errors`
  )
  if (isDryRun) {
    console.log('Re-run without --dry-run to apply.')
  }
  if (stats.errors > 0) process.exitCode = 1
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
