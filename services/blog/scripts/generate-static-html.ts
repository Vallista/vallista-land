import fs from 'fs/promises'
import path from 'path'
import { render } from '../src/ssr-entry'

const distDir = path.resolve('dist')
const contentsSourceDir = path.resolve('contents')
const outputBaseDir = path.resolve('public/contents')
const rootOutputDir = path.resolve('public')

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
  const mainEntry = Object.values(manifest).find((m: any) => m.isEntry)
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
  const result: Record<string, any> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue
    const [keyPart, ...valueParts] = trimmed.split(':')
    const key = keyPart.trim()
    const rawValue = valueParts.join(':').trim()
    let value: any = rawValue
    if (value === 'null') value = null
    else if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (!isNaN(Date.parse(value))) value = value
    else if (!isNaN(Number(value))) value = Number(value)
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
      title = meta.title || actualSlug
      description = meta.description || generateDescriptionFromContent(contentRaw)
      isPost = meta.isPost || false
      imagePath = meta.image ? `https://vallista.kr/contents/${actualSlug}/${meta.image}` : imagePath
    }

    const finalPathname = isRoot ? '/' : '/contents' + '/' + slugPathSegments.join('/')
    const headHtml = createSeoHead({ name: title, description, image: imagePath, isPost, pathname: finalPathname })
    const { html: mainContent, styleTags } = render(finalPathname)

    const finalHtml = layoutTemplate
      .replace(/<!--\s*\{\{head\}\}\s*-->/, headHtml + '\n' + styleTags)
      .replace(/<!--\s*\{\{content\}\}\s*-->/, mainContent)

    // const scriptTagMatch = finalHtml.match(/<script type="module"[\s\S]*?<\/script>/)
    // if (scriptTagMatch) {
    //   const scriptTag = scriptTagMatch[0]
    //   finalHtml = finalHtml.replace(scriptTag, '')
    //   finalHtml = finalHtml.includes('</body>')
    //     ? finalHtml.replace('</body>', `${scriptTag}\n</body>`)
    //     : finalHtml + scriptTag
    // }

    const targetDir = isRoot ? rootOutputDir : path.join(outputBaseDir, ...slugPathSegments)
    await fs.mkdir(targetDir, { recursive: true })
    await fs.writeFile(path.join(targetDir, 'index.html'), finalHtml)

    console.log(`✅ Generated: ${finalPathname}`)
  }

  console.log('🎉 All static HTML files generated!')
}

generateStaticHtml()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
