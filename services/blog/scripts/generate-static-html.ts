import fs from 'fs/promises'
import path from 'path'

const distDir = path.join(process.cwd(), 'dist')
const contentsSourceDir = path.join(process.cwd(), 'contents')

function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function loadEntryJsPath() {
  const manifestPath = path.join(distDir, '.vite', 'manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
  const mainEntry = Object.values(manifest).find((m: unknown) => (m as { isEntry?: boolean }).isEntry) as
    | { file: string }
    | undefined
  if (!mainEntry) throw new Error('❌ Main entry not found in manifest.json')
  return mainEntry.file
}

function createSeoHead(meta: {
  name: string
  description: string
  image: string
  isPost?: boolean
  siteUrl?: string
  pathname?: string
}) {
  const { name, description, image, isPost = false, siteUrl = 'https://vallista.kr', pathname = '' } = meta
  const url = siteUrl + pathname
  const ogType = isPost ? 'article' : 'website'

  return `
  <meta charset="UTF-8">
  <title>${escapeHtml(name)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${escapeHtml(name)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(name)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="google-site-verification" content="wPI09aIL9InuxJwKlMkLE-4mzzfbNhQqRCJ760C-8nQ">
  `.trim()
}

function parseFrontmatter(text: string) {
  const match = text.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  if (!match) return null
  const lines = match[1].split(/\r?\n/)
  const result: Record<string, unknown> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue
    const [keyPart, ...valueParts] = trimmed.split(':')
    const key = keyPart.trim()
    const rawValue = valueParts.join(':').trim()
    let value: unknown = rawValue
    if (value === 'null') value = null
    else if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (!isNaN(Date.parse(value as string))) {
      // value is already a valid date string, keep it as is
    } else if (!isNaN(Number(value))) value = Number(value)
    result[key] = value
  }
  return result
}

function generateDescriptionFromContent(raw: string) {
  return raw
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^!\[[^\]]*\]\([^)]*\)\s*/, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)
}

async function walkEntries(dir: string) {
  let results: {
    slug: string
    trail: string[]
    slugPathSegments: string[]
    contentPath: string
  }[] = []

  const list = await fs.readdir(dir, { withFileTypes: true })

  for (const file of list) {
    const filePath = path.join(dir, file.name)

    if (file.isDirectory()) {
      results = results.concat(await walkEntries(filePath))
    } else if (/\.(md|mdx)$/.test(file.name)) {
      const relative = path.relative(contentsSourceDir, filePath).replace(/\\/g, '/')
      const clean = relative.replace(/\.(md|mdx)$/, '')
      const slug = clean.endsWith('/index') ? path.basename(path.dirname(clean)) : path.basename(clean)
      const trail = clean
        .split('/')
        .slice(0, -1)
        .filter((s) => s !== slug)

      results.push({
        slug,
        trail,
        slugPathSegments: [...trail, slug],
        contentPath: filePath
      })
    }
  }

  return results
}

async function generateStaticHtml() {
  const layoutPath = path.join(distDir, 'layout.html')
  const layoutRaw = await fs.readFile(layoutPath, 'utf-8')
  const entryJsPath = await loadEntryJsPath()
  const layoutTemplate = layoutRaw.replace('{{entry}}', entryJsPath)

  const entries = await walkEntries(contentsSourceDir)
  entries.unshift({ slug: 'index', trail: [], slugPathSegments: [], contentPath: '' })

  for (const entry of entries) {
    const { slug, trail, contentPath } = entry
    let actualSlug = slug
    let slugPathSegments = [...trail, actualSlug]
    const isRoot = !contentPath && slug === 'index'

    let title = 'vallista.dev'
    let description = 'vallista.dev는 프론트엔드 개발과 기술을 다루는 블로그입니다.'
    let isPost = false
    let imagePath = 'https://vallista.kr/profile.png'

    if (contentPath) {
      const contentRaw = await fs.readFile(contentPath, 'utf-8')
      const meta = parseFrontmatter(contentRaw) || {}
      if (typeof meta.slug === 'string' && meta.slug.trim()) {
        actualSlug = meta.slug.trim()
        slugPathSegments = [...trail, actualSlug]
      }
      title = (meta.title as string) || actualSlug
      description = (meta.description as string) || generateDescriptionFromContent(contentRaw)
      isPost = (meta.isPost as boolean) || false
      imagePath = meta.image ? `https://vallista.kr/contents/${actualSlug}/${meta.image}` : imagePath
    }

    const finalPathname = isRoot ? '/' : '/contents' + '/' + slugPathSegments.join('/')
    const headHtml = createSeoHead({ name: title, description, image: imagePath, isPost, pathname: finalPathname })

    // SSR을 비활성화하고 기본 HTML만 생성
    const finalHtml = layoutTemplate
      .replace(/<!--\s*\{\{head\}\}\s*-->/, headHtml)
      .replace(/<!--\s*\{\{style\}\}\s*-->/, '')

    const outputPath = path.join(distDir, 'public', 'files', 'contents', 'articles', actualSlug, 'index.html')
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, finalHtml)

    console.log(`✅ Generated: ${outputPath}`)
  }
}

generateStaticHtml().catch(console.error)
