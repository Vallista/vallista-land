/* eslint-env node */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function extractFrontmatterAndBody(content) {
  const match = content.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  if (match) {
    const frontmatter = match[0]
    const body = content.slice(match[0].length).replace(/^\s*/, '')
    return { frontmatter, body }
  }
  return { frontmatter: '', body: content }
}

function normalizeBody(body) {
  if (!body) return body
  let normalized = body.replace(/\r\n/g, '\n')
  // Trim trailing spaces/tabs per line
  normalized = normalized
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
  // Collapse 3+ consecutive newlines into 2 (i.e., keep at most one blank line)
  normalized = normalized.replace(/\n{3,}/g, '\n\n')
  // Ensure file ends with a single newline
  if (!normalized.endsWith('\n')) normalized += '\n'
  return normalized
}

function walk(dir, onFile) {
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      walk(full, onFile)
    } else if (item.endsWith('.md')) {
      onFile(full)
    }
  }
}

function main() {
  const contentsDir = path.join(__dirname, '../contents/articles')
  let processed = 0
  let changed = 0

  walk(contentsDir, (file) => {
    try {
      const original = fs.readFileSync(file, 'utf-8')
      const { frontmatter, body } = extractFrontmatterAndBody(original)
      const normalizedBody = normalizeBody(body)
      const rebuilt = (frontmatter ? frontmatter + '\n\n' : '') + normalizedBody
      processed++
      if (rebuilt !== original) {
        fs.writeFileSync(file, rebuilt, 'utf-8')
        changed++
        console.log(`✨ 정리됨: ${path.relative(contentsDir, file)}`)
      }
    } catch (e) {
      console.error(`❌ 실패: ${file}`, e.message)
    }
  })

  console.log('\n✅ 공백 정규화 완료')
  console.log(`📄 처리 파일: ${processed}개`)
  console.log(`🛠 변경 파일: ${changed}개`)
}

main()



