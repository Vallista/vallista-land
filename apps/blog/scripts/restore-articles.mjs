#!/usr/bin/env node
// 원본 services/blog/content/posts 의 md를 현재 contents/articles 로 복구한다.
// - 기존 frontmatter.slug 는 보존 (URL 유지)
// - 2024년-회고 처럼 원본에 없는 글은 건드리지 않음
// - assets 폴더도 원본 기준으로 동기화 (없는 파일 추가)
// - 파일명은 macOS 파일시스템 정규화에 맞춰 NFC 기준으로 매칭
//
// 실행: node apps/blog/scripts/restore-articles.mjs
//   옵션 --dry-run : 실제 쓰기 없이 리포트만 출력

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ORIGINAL = path.resolve(
  __dirname,
  '../../../../vallista-land-dd771500165cf67751415cac3177f2a65dbea0b8/services/blog/content/posts'
)
const ORIGINAL_FROM_DOWNLOADS = '/Users/mgh/Downloads/vallista-land-dd771500165cf67751415cac3177f2a65dbea0b8/services/blog/content/posts'
const CURRENT = path.resolve(__dirname, '../../../contents/articles')

const DRY_RUN = process.argv.includes('--dry-run')

function nfc(s) {
  return s.normalize('NFC')
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

// frontmatter 간단 파서: --- 사이의 YAML 형태 key: value 추출
// 완전한 YAML 파싱은 불필요. slug 값만 뽑을 수 있으면 됨.
function extractSlug(mdText) {
  const match = mdText.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  if (!match) return null
  const body = match[1]
  const slugLine = body.split(/\r?\n/).find((l) => /^\s*slug\s*:/.test(l))
  if (!slugLine) return null
  const raw = slugLine.split(':').slice(1).join(':').trim()
  const unquoted = raw.replace(/^["']|["']$/g, '')
  return unquoted || null
}

// 원본 md에 기존 slug를 주입. 이미 slug 필드가 있으면 교체, 없으면 frontmatter 마지막 줄 앞에 추가.
function injectSlug(mdText, slug) {
  if (!slug) return mdText
  const fmMatch = mdText.match(/^(---\s*[\r\n]+)([\s\S]*?)(\r?\n---)/)
  if (!fmMatch) return mdText
  const [, open, body, close] = fmMatch
  const lines = body.split(/\r?\n/)
  const idx = lines.findIndex((l) => /^\s*slug\s*:/.test(l))
  const newSlugLine = `slug: "${slug}"`
  if (idx >= 0) {
    lines[idx] = newSlugLine
  } else {
    lines.push(newSlugLine)
  }
  return `${open}${lines.join('\n')}${close}${mdText.slice(fmMatch[0].length)}`
}

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  let added = 0
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      added += await copyDir(s, d)
      continue
    }
    if (!entry.isFile()) continue
    if (await exists(d)) continue
    if (!DRY_RUN) await fs.copyFile(s, d)
    added += 1
  }
  return added
}

async function main() {
  const origin = (await exists(ORIGINAL)) ? ORIGINAL : ORIGINAL_FROM_DOWNLOADS
  if (!(await exists(origin))) {
    console.error(`[restore-articles] original dir not found`)
    process.exit(1)
  }
  if (!(await exists(CURRENT))) {
    console.error(`[restore-articles] current dir not found: ${CURRENT}`)
    process.exit(1)
  }

  // 현재 폴더/파일 이름을 NFC 기준으로 매핑
  const currentEntries = await fs.readdir(CURRENT, { withFileTypes: true })
  const currentByNfc = new Map()
  for (const entry of currentEntries) {
    currentByNfc.set(nfc(entry.name), entry)
  }

  const originalEntries = await fs.readdir(origin, { withFileTypes: true })

  let restored = 0
  let skipped = 0
  let assetsAdded = 0
  const missingSlugs = []
  const onlyOriginal = []

  for (const orig of originalEntries) {
    const nfcName = nfc(orig.name)
    const curr = currentByNfc.get(nfcName)
    if (!curr) {
      onlyOriginal.push(nfcName)
      continue
    }

    // md 파일 (단일) vs 폴더(index.md)
    if (orig.isFile() && orig.name.endsWith('.md')) {
      const origPath = path.join(origin, orig.name)
      const currPath = path.join(CURRENT, curr.name)
      const currText = await fs.readFile(currPath, 'utf-8')
      const slug = extractSlug(currText)
      const origText = await fs.readFile(origPath, 'utf-8')
      const newText = injectSlug(origText, slug)
      if (!DRY_RUN) await fs.writeFile(currPath, newText)
      restored += 1
      if (!slug) missingSlugs.push(nfcName)
    } else if (orig.isDirectory()) {
      const origIndex = path.join(origin, orig.name, 'index.md')
      const currIndex = path.join(CURRENT, curr.name, 'index.md')
      if (!(await exists(origIndex))) {
        skipped += 1
        continue
      }
      const currText = (await exists(currIndex)) ? await fs.readFile(currIndex, 'utf-8') : ''
      const slug = extractSlug(currText)
      const origText = await fs.readFile(origIndex, 'utf-8')
      const newText = injectSlug(origText, slug)
      if (!DRY_RUN) await fs.writeFile(currIndex, newText)
      restored += 1
      if (!slug) missingSlugs.push(nfcName)

      // assets 동기화: 원본에 있고 현재에 없는 파일만 추가
      const origAssets = path.join(origin, orig.name, 'assets')
      const currAssets = path.join(CURRENT, curr.name, 'assets')
      if (await exists(origAssets)) {
        assetsAdded += await copyDir(origAssets, currAssets)
      }
    }
  }

  console.log('=== restore-articles report ===')
  console.log(`restored: ${restored}${DRY_RUN ? ' (dry-run)' : ''}`)
  console.log(`skipped: ${skipped}`)
  console.log(`new asset files added: ${assetsAdded}${DRY_RUN ? ' (dry-run)' : ''}`)
  console.log(`missing slug (injected none): ${missingSlugs.length}`)
  if (missingSlugs.length) console.log('  -', missingSlugs.join('\n  - '))
  console.log(`only-in-original (not restored): ${onlyOriginal.length}`)
  if (onlyOriginal.length) console.log('  -', onlyOriginal.join('\n  - '))
}

main().catch((e) => {
  console.error('[restore-articles] failed:', e)
  process.exit(1)
})
