#!/usr/bin/env node
// 기존에 생성된 assets/_remote/*.svg placeholder 를 "맥락 있는" 디자인으로 재생성한다.
// - 글 제목을 2줄로 wrap
// - 태그 1~2개를 칩으로 표시
// - 시드(파일명 hash)로 5종 패턴 중 하나 선택 (grid/stripes/dots/blocks/lines)
// - Paper Light 팔레트(accent blue)만 사용

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ARTICLES = path.resolve(__dirname, '../../../contents/articles')

const ACCENT = '#2b6cff'
const ACCENT_TINT = '#eff4ff'
const INK = '#0b1220'
const INK2 = '#3a4255'
const INK4 = '#9aa1b4'
const LINE = '#e6e8ee'

function hashCode(s) {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function pickPattern(seed) {
  const kinds = ['grid', 'stripes', 'dots', 'blocks', 'lines']
  return kinds[seed % kinds.length]
}

function patternSvg(kind, seed) {
  switch (kind) {
    case 'stripes':
      return `<g fill="${ACCENT}" opacity="0.22">
        ${Array.from({ length: 20 }, (_, i) => `<rect x="${i * 40 - 20}" y="-50" width="18" height="500" transform="rotate(25 ${i * 40} 225)"/>`).join('')}
      </g>`
    case 'dots':
      return `<g fill="${ACCENT}" opacity="0.3">
        ${Array.from({ length: 16 }, (_, x) => Array.from({ length: 9 }, (_, y) => `<circle cx="${25 + x * 48}" cy="${25 + y * 48}" r="3"/>`).join('')).join('')}
      </g>`
    case 'blocks':
      return `<g fill="${ACCENT}">
        <rect x="40" y="60" width="200" height="150" rx="8" opacity="0.15"/>
        <rect x="140" y="110" width="240" height="150" rx="8" opacity="0.3"/>
        <rect x="280" y="80" width="260" height="180" rx="8" opacity="0.5"/>
      </g>`
    case 'lines':
      return `<g stroke="${ACCENT}" fill="none" stroke-width="2">
        <path d="M30 330 L200 240" opacity="0.35"/>
        <path d="M200 240 L380 180" opacity="0.55"/>
        <path d="M380 180 L560 90" opacity="0.75"/>
        <path d="M30 380 L770 380" opacity="0.2"/>
        <path d="M30 100 L770 100" opacity="0.15"/>
      </g>`
    case 'grid':
    default:
      return `<g opacity="0.2">
        ${Array.from({ length: 42 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="450" stroke="${ACCENT}" stroke-width="0.6"/>`).join('')}
        ${Array.from({ length: 24 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="800" y2="${i * 20}" stroke="${ACCENT}" stroke-width="0.6"/>`).join('')}
      </g>
      <circle cx="${560 + (seed % 60)}" cy="${140 + (seed % 40)}" r="70" fill="${ACCENT}" opacity="0.25"/>
      <rect x="${120 + (seed % 40)}" y="${240 + (seed % 30)}" width="130" height="110" rx="12" fill="${ACCENT}" opacity="0.4"/>`
  }
}

function wrapLines(text, maxChars) {
  const words = text.split(/(\s+)/)
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + w).length > maxChars && line.trim().length > 0) {
      lines.push(line.trim())
      line = w.trimStart()
    } else {
      line += w
    }
    if (lines.length === 1 && line.length > maxChars) break
  }
  if (line.trim().length > 0) lines.push(line.trim())
  // 최대 2줄. 잘리면 말줄임.
  if (lines.length > 2) {
    const truncated = lines[1].slice(0, maxChars - 1) + '…'
    return [lines[0], truncated]
  }
  return lines
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function buildSvg({ title, tags, seed }) {
  const kind = pickPattern(seed)
  const titleLines = wrapLines(title, 26)
  const shownTags = (tags || []).slice(0, 2)

  const titleSvg = titleLines
    .map((line, i) => `<text x="48" y="${320 + i * 48}" font-family="'Pretendard Variable', 'Pretendard', -apple-system, sans-serif" font-size="36" font-weight="700" fill="${INK}" letter-spacing="-0.5">${escapeXml(line)}</text>`)
    .join('')

  const tagsSvg = shownTags
    .map((t, i) => {
      const label = escapeXml(t)
      const estWidth = Math.max(60, label.length * 14 + 24)
      const x = 48 + i * (estWidth + 8)
      return `<g transform="translate(${x} 48)">
        <rect width="${estWidth}" height="26" rx="13" fill="${ACCENT_TINT}"/>
        <text x="${estWidth / 2}" y="17" text-anchor="middle" font-family="'Pretendard Variable', sans-serif" font-size="12" font-weight="500" fill="${ACCENT}" letter-spacing="0.02em">${label}</text>
      </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
  <rect width="800" height="450" fill="${ACCENT_TINT}"/>
  ${patternSvg(kind, seed)}
  ${tagsSvg}
  ${titleSvg}
  <rect x="48" y="406" width="24" height="2" fill="${ACCENT}"/>
  <text x="80" y="412" font-family="'JetBrains Mono', monospace" font-size="10" fill="${INK4}" letter-spacing="0.12em">COVER · PLACEHOLDER</text>
</svg>`
}

function extractFrontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!m) return { title: '', tags: [] }
  const fm = m[1]
  const titleLine = fm.split(/\r?\n/).find((l) => /^\s*title\s*:/.test(l))
  let title = titleLine ? titleLine.split(':').slice(1).join(':').trim() : ''
  title = title.replace(/^["']|["']$/g, '')

  // tags: yaml list or inline
  const tags = []
  const tagsLineIdx = fm.split(/\r?\n/).findIndex((l) => /^\s*tags\s*:/.test(l))
  if (tagsLineIdx >= 0) {
    const lines = fm.split(/\r?\n/)
    const tagLine = lines[tagsLineIdx]
    const inline = tagLine.split(':').slice(1).join(':').trim()
    if (inline && inline.startsWith('[')) {
      // [a, b, c]
      inline
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((x) => x.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
        .forEach((t) => tags.push(t))
    } else {
      // yaml list below
      for (let i = tagsLineIdx + 1; i < lines.length; i += 1) {
        const l = lines[i]
        const m2 = l.match(/^\s*-\s*(.+?)\s*$/)
        if (!m2) break
        tags.push(m2[1].replace(/^["']|["']$/g, ''))
      }
    }
  }
  return { title, tags }
}

async function* walkArticleDirs(root) {
  const entries = await fs.readdir(root, { withFileTypes: true })
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const articleDir = path.join(root, e.name)
    const indexMd = path.join(articleDir, 'index.md')
    const remoteDir = path.join(articleDir, 'assets', '_remote')
    try {
      await fs.access(indexMd)
      await fs.access(remoteDir)
    } catch {
      continue
    }
    yield { articleDir, indexMd, remoteDir, slug: e.name }
  }
}

async function main() {
  let regenerated = 0
  let touched = 0
  for await (const { indexMd, remoteDir, slug } of walkArticleDirs(ARTICLES)) {
    const text = await fs.readFile(indexMd, 'utf-8')
    const { title, tags } = extractFrontmatter(text)
    const files = await fs.readdir(remoteDir)
    const svgs = files.filter((f) => f.endsWith('.svg'))
    if (svgs.length === 0) continue
    touched += 1
    for (const f of svgs) {
      const seed = hashCode(slug + ':' + f)
      const svg = buildSvg({ title, tags, seed })
      await fs.writeFile(path.join(remoteDir, f), svg)
      regenerated += 1
    }
    console.log(`${slug}: ${svgs.length} placeholder regenerated`)
  }
  console.log(`\n=== done. articles touched: ${touched}, svgs: ${regenerated}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
