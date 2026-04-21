import fs from 'node:fs/promises'
import path from 'node:path'

import type { ResolvedConfig } from 'vite'

interface SeoPluginOptions {
  siteUrl?: string
  contentsDir?: string
  blogTitle?: string
  blogDescription?: string
}

interface Article {
  title: string
  description: string
  slug: string
  date: string
  tags?: string[]
  image?: string
  url?: string
  contentType?: string
  author?: string
  readingTime?: number
  draft?: boolean | string
}

const DEFAULT_SITE_URL = 'https://vallista.kr'
const DEFAULT_BLOG_TITLE = 'Vallista Blog'
const DEFAULT_BLOG_DESCRIPTION =
  'Vallista의 기술 블로그입니다. 프론트엔드 개발, React, TypeScript 등에 대한 글을 공유합니다.'

export function vallistaSeoPlugin(options: SeoPluginOptions = {}) {
  const siteUrl = options.siteUrl ?? DEFAULT_SITE_URL
  const blogTitle = options.blogTitle ?? DEFAULT_BLOG_TITLE
  const blogDescription = options.blogDescription ?? DEFAULT_BLOG_DESCRIPTION

  let outDir = ''
  let contentsDir = ''

  return {
    name: 'vallista-seo',
    apply: 'build' as const,

    configResolved(config: ResolvedConfig) {
      outDir = path.resolve(config.root, config.build.outDir)
      contentsDir = options.contentsDir
        ? path.resolve(config.root, options.contentsDir)
        : path.resolve(config.root, '../../contents')
    },

    async closeBundle() {
      const articles = await loadPublishedArticles(outDir)

      await Promise.all([
        writeSitemap(outDir, siteUrl, articles),
        writeRobots(outDir, siteUrl),
        writeRss(outDir, siteUrl, blogTitle, articles),
        writeRedirects(outDir)
      ])

      await injectHtmlMetadata(outDir, siteUrl, blogTitle, blogDescription, contentsDir, articles)

      await copyIndexTo404(outDir)
    }
  }
}

async function loadPublishedArticles(outDir: string): Promise<Article[]> {
  const indexPath = path.join(outDir, 'content-index.json')
  const raw = await fs.readFile(indexPath, 'utf-8')
  const parsed = JSON.parse(raw) as { articles?: Article[] }
  return (parsed.articles ?? []).filter((a) => !isDraft(a))
}

function isDraft(article: Article): boolean {
  return article.draft === true || article.draft === 'true'
}

async function writeSitemap(outDir: string, siteUrl: string, articles: Article[]): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const entries = [
    { url: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
    { url: '/about', priority: '0.8', changefreq: 'monthly', lastmod: today },
    { url: '/resume', priority: '0.8', changefreq: 'monthly', lastmod: today },
    ...articles.map((article) => ({
      url: `/articles/${article.slug}`,
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: article.date || today
    }))
  ]

  const body = entries
    .map(
      (e) => `  <url>
    <loc>${siteUrl}${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`

  await fs.writeFile(path.join(outDir, 'sitemap.xml'), xml)
}

async function writeRobots(outDir: string, siteUrl: string): Promise<void> {
  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`
  await fs.writeFile(path.join(outDir, 'robots.txt'), robots)
}

async function writeRss(outDir: string, siteUrl: string, title: string, articles: Article[]): Promise<void> {
  const latest = [...articles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)

  const items = latest
    .map(
      (a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <description>${escapeXml(a.description)}</description>
      <link>${siteUrl}/articles/${a.slug}</link>
      <guid>${siteUrl}/articles/${a.slug}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
    </item>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>Vallista의 기술 블로그</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  await fs.writeFile(path.join(outDir, 'rss.xml'), xml)
}

async function writeRedirects(outDir: string): Promise<void> {
  const body = `# /contents/articles/xxx → /articles/xxx (색인 URL 통일)
/contents/articles/*  /articles/:splat  301
`
  await fs.writeFile(path.join(outDir, '_redirects'), body.trim())
}

async function injectHtmlMetadata(
  outDir: string,
  siteUrl: string,
  blogTitle: string,
  blogDescription: string,
  contentsDir: string,
  articles: Article[]
): Promise<void> {
  const indexPath = path.join(outDir, 'index.html')
  if (!(await fileExists(indexPath))) {
    throw new Error(`[vallista-seo] index.html not found at ${indexPath}`)
  }

  const mainHead = `
    <title>${escapeXml(blogTitle)} - 기술과 개발에 대한 생각을 나누는 공간</title>
    <meta name="description" content="${escapeXml(blogDescription)}" />
    <meta property="og:title" content="${escapeXml(blogTitle)}" />
    <meta property="og:description" content="${escapeXml(blogDescription)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${siteUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(blogTitle)}" />
    <meta name="twitter:description" content="${escapeXml(blogDescription)}" />
  `

  let mainHtml = await fs.readFile(indexPath, 'utf-8')
  mainHtml = mainHtml.replace(/<title>.*?<\/title>/, mainHead)
  await fs.writeFile(indexPath, mainHtml)

  for (const article of articles) {
    const baseHtml = await fs.readFile(indexPath, 'utf-8')
    const articleHtml = buildArticleHtml(baseHtml, siteUrl, blogTitle, blogDescription, article)

    await writeArticleArtifacts(outDir, contentsDir, siteUrl, article, articleHtml)
  }
}

function buildArticleHtml(
  baseHtml: string,
  siteUrl: string,
  blogTitle: string,
  blogDescription: string,
  article: Article
): string {
  let html = baseHtml
  const fullTitle = `${article.title} - ${blogTitle}`

  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeXml(fullTitle)}</title>`)
  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${escapeXml(article.description)}" />`
  )
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${escapeXml(fullTitle)}" />`
  )
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${escapeXml(article.description)}" />`
  )
  html = html.replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="article" />`)
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${siteUrl}/articles/${article.slug}" />`
  )
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${escapeXml(fullTitle)}" />`
  )
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${escapeXml(article.description)}" />`
  )

  const escapedBlogTitle = escapeRegex(blogTitle)
  const escapedBlogDescription = escapeRegex(blogDescription)
  const escapedSiteUrl = escapeRegex(siteUrl)
  const duplicatePattern = new RegExp(
    `<meta name="description" content="${escapedBlogDescription}" />\\n {4}<meta property="og:title" content="${escapedBlogTitle}" />\\n {4}<meta property="og:description" content="${escapedBlogDescription}" />\\n {4}<meta property="og:type" content="website" />\\n {4}<meta property="og:url" content="${escapedSiteUrl}" />\\n {4}<meta name="twitter:card" content="summary_large_image" />\\n {4}<meta name="twitter:title" content="${escapedBlogTitle}" />\\n {4}<meta name="twitter:description" content="${escapedBlogDescription}" />\\n`,
    'g'
  )
  html = html.replace(duplicatePattern, '')

  const headEnd = html.indexOf('</head>')
  const extra = `    <link rel="canonical" href="${siteUrl}/articles/${article.slug}" />\n    <meta property="article:published_time" content="${article.date}" />\n`
  html = html.slice(0, headEnd) + extra + html.slice(headEnd)

  return html
}

async function writeArticleArtifacts(
  outDir: string,
  contentsDir: string,
  siteUrl: string,
  article: Article,
  articleHtml: string
): Promise<void> {
  const metaDir = path.join(outDir, 'contents', 'articles', article.slug)
  await fs.mkdir(metaDir, { recursive: true })

  const meta = await buildArticleMeta(outDir, article)
  await fs.writeFile(path.join(metaDir, 'meta.json'), JSON.stringify(meta, null, 2))

  const htmlDir = path.join(outDir, 'articles', article.slug)
  await fs.mkdir(htmlDir, { recursive: true })
  await fs.writeFile(path.join(htmlDir, 'index.html'), articleHtml)

  const articleSourceDir = path.join(contentsDir, 'articles', article.slug)
  await copyAssets(articleSourceDir, metaDir)

  // siteUrl은 추후 확장(예: og:image 절대 URL 생성)을 위해 인자로 유지
  void siteUrl
}

async function buildArticleMeta(outDir: string, article: Article): Promise<Article & { content: string }> {
  const base: Article & { content: string } = {
    title: article.title,
    description: article.description,
    date: article.date,
    tags: article.tags ?? [],
    image: article.image,
    slug: article.slug,
    url: article.url,
    contentType: article.contentType,
    author: article.author,
    readingTime: article.readingTime,
    content: ''
  }

  try {
    const jsonPath = path.join(outDir, 'contents', 'articles', article.slug, 'index.json')
    const raw = await fs.readFile(jsonPath, 'utf-8')
    const jsonData = JSON.parse(raw) as { content?: string; image?: string }

    base.content = jsonData.content ?? ''

    if (jsonData.image?.includes('articles/')) {
      const parts = jsonData.image.split('/')
      if (parts.length >= 3) {
        const oldSlug = parts[1]
        base.image =
          oldSlug !== article.slug
            ? jsonData.image.replace(`articles/${oldSlug}/`, `articles/${article.slug}/`)
            : jsonData.image
      }
    } else if (jsonData.image) {
      base.image = jsonData.image
    }
  } catch {
    // index.json이 없거나 읽을 수 없으면 content는 빈 문자열로 유지
  }

  return base
}

async function copyAssets(sourceDir: string, targetDir: string): Promise<void> {
  const assetsSource = path.join(sourceDir, 'assets')
  if (!(await fileExists(assetsSource))) return

  const assetsTarget = path.join(targetDir, 'assets')
  await fs.mkdir(assetsTarget, { recursive: true })

  const entries = await fs.readdir(assetsSource)
  for (const entry of entries) {
    if (entry === '.DS_Store') continue

    const src = path.join(assetsSource, entry)
    const dst = path.join(assetsTarget, entry)
    const stat = await fs.stat(src)
    if (!stat.isFile()) continue

    let shouldCopy = true
    try {
      const dstStat = await fs.stat(dst)
      if (stat.size === dstStat.size && stat.mtime.getTime() === dstStat.mtime.getTime()) {
        shouldCopy = false
      }
    } catch {
      shouldCopy = true
    }

    if (shouldCopy) await fs.copyFile(src, dst)
  }
}

async function copyIndexTo404(outDir: string): Promise<void> {
  const indexPath = path.join(outDir, 'index.html')
  const notFoundPath = path.join(outDir, '404.html')
  await fs.copyFile(indexPath, notFoundPath)
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

function escapeXml(text = ''): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
