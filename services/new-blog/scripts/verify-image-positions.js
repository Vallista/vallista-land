/* eslint-env node */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function extractBodyWithoutCenter(content) {
  const fm = content.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  let body = fm ? content.slice(fm[0].length) : content
  // normalize newlines
  body = body.replace(/\r\n/g, '\n')
  // remove <center>...</center>
  body = body.replace(/<center>[\s\S]*?<\/center>/g, '')
  return body.trim()
}

function findImagesByLine(body) {
  const lines = body.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/!\[([^\]]*)\]\(([^)]+)\)/)
    if (m) {
      out.push({ line: i + 1, alt: m[1], url: m[2] })
    }
  }
  return out
}

function compareArticle(slug) {
  const blogPath = path.join(__dirname, '../../blog/contents/articles', slug, 'index.md')
  const newPath = path.join(__dirname, '../contents/articles', slug, 'index.md')

  if (!fs.existsSync(blogPath) || !fs.existsSync(newPath)) {
    console.log(`⚠️  경로 없음: ${slug}`)
    return
  }

  const blog = fs.readFileSync(blogPath, 'utf-8')
  const nw = fs.readFileSync(newPath, 'utf-8')

  const blogBody = extractBodyWithoutCenter(blog)
  const newBody = extractBodyWithoutCenter(nw)

  const bImgs = findImagesByLine(blogBody)
  const nImgs = findImagesByLine(newBody)

  console.log(`\n=== ${slug} ===`)
  console.log(`blog 이미지: ${bImgs.length}, new-blog 이미지: ${nImgs.length}`)
  const max = Math.max(bImgs.length, nImgs.length)
  let mismatches = 0
  for (let i = 0; i < max; i++) {
    const b = bImgs[i]
    const n = nImgs[i]
    if (!b || !n) {
      console.log(`${String(i + 1).padStart(2)} | blog: ${b ? `${b.line} ${b.url}` : '-'} | new: ${n ? `${n.line} ${n.url}` : '-'}`)
      mismatches++
      continue
    }
    const sameLine = b.line === n.line
    const sameUrl = b.url === n.url
    const mark = sameLine ? '✅' : '❌'
    console.log(`${String(i + 1).padStart(2)} ${mark} line blog:${b.line} new:${n.line} | url blog:${b.url} new:${n.url}${sameUrl ? '' : ' (url diff)'}')
    `)
    if (!sameLine) mismatches++
  }
  if (mismatches === 0) {
    console.log('→ 라인 위치 완전 일치')
  } else {
    console.log(`→ 불일치: ${mismatches}건`)
  }
}

function main() {
  const targets = [
    '2021년-회고',
    '2020년-상반기-회고',
  ]
  targets.forEach(compareArticle)
}

main()



