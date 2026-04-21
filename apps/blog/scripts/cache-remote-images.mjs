#!/usr/bin/env node
// 각 아티클 md 의 외부 이미지 참조(http/https) 를 로컬에 캐시한다.
//   - 성공: assets/_remote/<hash>.<ext> 로 저장 후 md 참조를 해당 로컬 경로로 교체
//   - 실패(HTTP 오류/타임아웃): assets/_remote/<hash>.svg 플레이스홀더 SVG 생성 +
//     md 참조를 로컬 SVG 로 교체
// md 가 이미 로컬 경로로 바뀌면 remark-article-assets 가 public 으로 복사해 서빙.

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ARTICLES = path.resolve(__dirname, '../../../contents/articles')

const EXT_BY_CT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif'
}

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}

function hashUrl(url) {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 12)
}

function extFromUrl(url) {
  try {
    const u = new URL(url)
    const m = u.pathname.match(/\.([a-z0-9]{2,5})$/i)
    if (m) return m[1].toLowerCase()
  } catch {}
  return null
}

function placeholderSvg(labelRaw) {
  const label = labelRaw.length > 40 ? labelRaw.slice(0, 37) + '…' : labelRaw
  const safe = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
  <defs>
    <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#eff4ff"/>
      <circle cx="10" cy="10" r="1" fill="#2b6cff" opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="800" height="450" fill="url(#p)"/>
  <g fill="none" stroke="#2b6cff" stroke-width="1" opacity="0.35">
    <line x1="0" y1="100" x2="800" y2="100"/>
    <line x1="0" y1="350" x2="800" y2="350"/>
  </g>
  <text x="400" y="220" text-anchor="middle" font-family="'Pretendard Variable', -apple-system, sans-serif" font-size="18" fill="#6b7389" font-weight="600">외부 이미지 대체</text>
  <text x="400" y="248" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" fill="#9aa1b4">${safe}</text>
</svg>`
}

async function downloadOnce(url, { timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        // wp/d2 hotlink 차단 우회를 위해 UA + Referer 지정
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8'
      }
    })
    if (!res.ok) return { ok: false, status: res.status }
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!ct.startsWith('image/')) return { ok: false, status: `ct=${ct || 'unknown'}` }
    const buf = Buffer.from(await res.arrayBuffer())
    const ext = EXT_BY_CT[ct] ?? extFromUrl(url) ?? 'bin'
    return { ok: true, ext, buf }
  } catch (e) {
    return { ok: false, status: e?.name === 'AbortError' ? 'timeout' : String(e?.message ?? e) }
  } finally {
    clearTimeout(t)
  }
}

const EXT_URL_RE = /(!\[[^\]]*\]\()(https?:\/\/[^)\s]+|\/\/[^)\s]+)(\))/g
const EXT_IMG_RE = /(<img[^>]+src=["'])(https?:\/\/[^"']+|\/\/[^"']+)(["'])/gi

async function processFile(filePath, articleDir) {
  const text = await fs.readFile(filePath, 'utf-8')
  const tasks = []

  const queue = (full, pre, url, post) => {
    tasks.push({ match: full, pre, url, post })
  }

  let m
  while ((m = EXT_URL_RE.exec(text))) queue(m[0], m[1], m[2], m[3])
  while ((m = EXT_IMG_RE.exec(text))) queue(m[0], m[1], m[2], m[3])

  if (tasks.length === 0) return { changed: false, saved: 0, placeholder: 0 }

  const remoteDir = path.join(articleDir, 'assets', '_remote')
  await fs.mkdir(remoteDir, { recursive: true })

  const relFromMd = (localPath) => {
    // markdown 파일 위치 기준 상대경로.
    const rel = path.relative(path.dirname(filePath), localPath)
    return rel.split(path.sep).join('/')
  }

  const rewrites = new Map()
  let saved = 0
  let placeholder = 0

  for (const t of tasks) {
    const url = t.url.startsWith('//') ? `https:${t.url}` : t.url
    const hash = hashUrl(url)
    if (rewrites.has(t.url)) continue

    const existing = (await fs.readdir(remoteDir, { withFileTypes: true }).catch(() => []))
      .find((e) => e.isFile() && e.name.startsWith(hash + '.'))

    if (existing) {
      rewrites.set(t.url, relFromMd(path.join(remoteDir, existing.name)))
      continue
    }

    const r = await downloadOnce(url)
    if (r.ok) {
      const outPath = path.join(remoteDir, `${hash}.${r.ext}`)
      await fs.writeFile(outPath, r.buf)
      rewrites.set(t.url, relFromMd(outPath))
      saved += 1
      console.log(`  ✓ ${url.slice(0, 70)} → ${r.ext}`)
    } else {
      const outPath = path.join(remoteDir, `${hash}.svg`)
      await fs.writeFile(outPath, placeholderSvg(url))
      rewrites.set(t.url, relFromMd(outPath))
      placeholder += 1
      console.log(`  ✗ ${url.slice(0, 70)} (${r.status}) → placeholder`)
    }
  }

  let newText = text
  for (const [orig, local] of rewrites) {
    // 참조가 여러 번 있을 수 있으니 전역 치환
    const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    newText = newText.replace(new RegExp(escaped, 'g'), local)
  }

  if (newText !== text) {
    await fs.writeFile(filePath, newText)
    return { changed: true, saved, placeholder }
  }
  return { changed: false, saved, placeholder }
}

async function main() {
  const entries = await fs.readdir(ARTICLES, { withFileTypes: true })
  let filesTouched = 0
  let totalSaved = 0
  let totalPlaceholder = 0

  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.md')) {
      const filePath = path.join(ARTICLES, e.name)
      const stem = e.name.replace(/\.md$/, '')
      const articleDir = path.join(ARTICLES, stem)
      const indexPath = path.join(articleDir, 'index.md')
      // 외부 이미지를 로컬에 저장하려면 폴더형 글로 승격해야 함.
      // contents/articles/foo.md → contents/articles/foo/index.md 로 이동.
      // Content Collection 의 glob loader id 는 그대로 "foo" 유지.
      const hasExternal = /!\[[^\]]*\]\(https?:\/\/|<img[^>]+src=["']https?:\/\//i.test(
        await fs.readFile(filePath, 'utf-8')
      )
      let targetPath = filePath
      let targetDir = articleDir
      if (hasExternal) {
        await fs.mkdir(articleDir, { recursive: true })
        await fs.rename(filePath, indexPath)
        targetPath = indexPath
        targetDir = articleDir
      }
      const r = await processFile(targetPath, targetDir)
      if (r.changed) filesTouched += 1
      totalSaved += r.saved
      totalPlaceholder += r.placeholder
      if (r.saved || r.placeholder) console.log(`${e.name}: saved ${r.saved}, placeholder ${r.placeholder}`)
    } else if (e.isDirectory()) {
      const idx = path.join(ARTICLES, e.name, 'index.md')
      if (await exists(idx)) {
        const r = await processFile(idx, path.join(ARTICLES, e.name))
        if (r.changed) filesTouched += 1
        totalSaved += r.saved
        totalPlaceholder += r.placeholder
        if (r.saved || r.placeholder) console.log(`${e.name}/: saved ${r.saved}, placeholder ${r.placeholder}`)
      }
    }
  }

  console.log(`\n=== done. files: ${filesTouched}, saved: ${totalSaved}, placeholder: ${totalPlaceholder}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
