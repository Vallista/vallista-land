// scripts/generate-rss.js
import fs from 'fs/promises'
import path from 'path'

const contentsDir = path.resolve('contents')
const distDir = path.resolve('dist')
const baseUrl = 'https://vallista.kr'
const blogTitle = 'vallista.dev'
const blogDescription = 'vallista의 기술 블로그'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toUTCString()
}

function escapeXml(unsafe = '') {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Frontmatter + Body 분리
function parseMdxFrontmatterAndBody(mdx) {
  const match = mdx.match(/^---\s*([\s\S]*?)\s*---\s*/)
  if (!match) return { meta: {}, body: mdx.trim() }

  const raw = match[1]
  const meta = {}
  raw.split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length) {
      meta[key.trim()] = rest.join(':').trim()
    }
  })

  const body = mdx.slice(match[0].length).trim()
  return { meta, body }
}

// 본문 요약 추출
function extractSummary(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // 이미지 제거
    .replace(/\[.*?\]\(.*?\)/g, '') // 링크 제거
    .replace(/#+\s.*\n/g, '') // 제목 제거
    .replace(/`{3}[\s\S]*?`{3}/g, '') // 코드블럭 제거
    .replace(/`.*?`/g, '') // 인라인 코드 제거
    .replace(/<\/?[^>]+(>|$)/g, '') // HTML 태그 제거
    .replace(/\n+/g, ' ') // 줄바꿈 제거
    .trim()
    .slice(0, 200) // 200자 제한
}

// contents 폴더 스캔
async function walkContents(dir) {
  let results = []
  const list = await fs.readdir(dir, { withFileTypes: true })

  for (const file of list) {
    const filePath = path.join(dir, file.name)

    if (file.isDirectory()) {
      const deeper = await walkContents(filePath)
      results = results.concat(deeper)
    } else if (/\.(md|mdx)$/.test(file.name)) {
      const slug = path
        .relative(contentsDir, filePath)
        .replace(/\.(md|mdx)$/, '')
        .replace(/\\/g, '/')
      const mdx = await fs.readFile(filePath, 'utf-8')
      const { meta, body } = parseMdxFrontmatterAndBody(mdx)
      results.push({ slug, meta, body })
    }
  }

  return results
}

// RSS 생성 메인
async function generateRSS() {
  const posts = await walkContents(contentsDir)

  const items = posts
    .filter((post) => post.meta?.date)
    .sort((a, b) => new Date(b.meta.date) - new Date(a.meta.date))
    .map((post) => {
      const url = `${baseUrl}/contents/${post.slug}/`
      const description = post.meta.description || extractSummary(post.body)
      return `
        <item>
          <title>${escapeXml(post.meta.title || post.slug)}</title>
          <link>${url}</link>
          <description>${escapeXml(description)}</description>
          <pubDate>${formatDateKST(post.meta.date)}</pubDate>
          <guid>${url}</guid>
        </item>
        `
    })
    .join('\n')

  const rssContent = `
  <?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${blogTitle}</title>
      <link>${baseUrl}</link>
      <description>${blogDescription}</description>
      <language>ko</language>
      <lastBuildDate>${formatDateKST(new Date())}</lastBuildDate>
  ${items}
    </channel>
  </rss>
    `.trim()

  await fs.writeFile(path.join(distDir, 'rss.xml'), rssContent)
  console.log('✅ rss.xml 생성 완료 (KST 시간 적용 완료)!')
}

function formatDateKST(dateStr) {
  const date = new Date(dateStr)

  // 한국 시간(KST)으로 9시간 더하기
  date.setHours(date.getHours() + 9)

  // RFC 822 포맷으로 반환
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const dayName = dayNames[date.getUTCDay()]
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = monthNames[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  // GMT+0900 (KST)
  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} +0900`
}

// 실행
generateRSS()
