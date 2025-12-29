#!/usr/bin/env node
/* eslint-env node */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SITE_URL = 'https://vallista.kr'
const DIST_DIR = path.join(__dirname, '../dist')
const CONTENTS_DIR = path.join(__dirname, '../contents')

async function generateSitemap() {
  console.log(chalk.blue('🔍 Generating sitemap...'))

  const articles = await getArticles()
  const pages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/resume', priority: '0.8', changefreq: 'monthly' },
    ...articles.map((article) => ({
      url: `/articles/${article.slug}`,
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: article.date
    }))
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap)
  console.log(chalk.green('✅ Sitemap generated'))
}

async function generateRobots() {
  console.log(chalk.blue('🤖 Generating robots.txt...'))

  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`

  await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), robots)
  console.log(chalk.green('✅ Robots.txt generated'))
}

async function generateRSS() {
  console.log(chalk.blue('📡 Generating RSS feed...'))

  const articles = await getArticles()
  const latestArticles = articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vallista Blog</title>
    <description>Vallista의 기술 블로그</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${latestArticles
  .map(
    (article) => `    <item>
      <title>${escapeXml(article.title)}</title>
      <description>${escapeXml(article.description)}</description>
      <link>${SITE_URL}/articles/${article.slug}</link>
      <guid>${SITE_URL}/articles/${article.slug}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`

  await fs.writeFile(path.join(DIST_DIR, 'rss.xml'), rss)
  console.log(chalk.green('✅ RSS feed generated'))
}

async function injectSEOIntoHTML() {
  console.log(chalk.blue('🔧 Injecting SEO into HTML files...'))

  const articles = await getArticles()

  // 메인 페이지 SEO
  const mainSEO = `
    <title>Vallista Blog - 기술과 개발에 대한 생각을 나누는 공간</title>
    <meta name="description" content="Vallista의 기술 블로그입니다. 프론트엔드 개발, React, TypeScript 등에 대한 글을 공유합니다." />
    <meta property="og:title" content="Vallista Blog" />
    <meta property="og:description" content="Vallista의 기술 블로그입니다. 프론트엔드 개발, React, TypeScript 등에 대한 글을 공유합니다." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Vallista Blog" />
    <meta name="twitter:description" content="Vallista의 기술 블로그입니다. 프론트엔드 개발, React, TypeScript 등에 대한 글을 공유합니다." />
  `

  // About 페이지 SEO (사용하지 않음 - 주석 처리)
  // const aboutSEO = `
  //   <title>소개 - Vallista Blog</title>
  //   <meta name="description" content="Vallista에 대한 소개입니다. 프론트엔드 개발자로서의 경험과 기술 스택을 소개합니다." />
  //   <meta property="og:title" content="소개 - Vallista Blog" />
  //   <meta property="og:description" content="Vallista에 대한 소개입니다. 프론트엔드 개발자로서의 경험과 기술 스택을 소개합니다." />
  //   <meta property="og:type" content="website" />
  //   <meta property="og:url" content="${SITE_URL}/about" />
  //   <meta name="twitter:card" content="summary" />
  //   <meta name="twitter:title" content="소개 - Vallista Blog" />
  //   <meta name="twitter:description" content="Vallista에 대한 소개입니다. 프론트엔드 개발자로서의 경험과 기술 스택을 소개합니다." />
  // `

  // Resume 페이지 SEO (사용하지 않음 - 주석 처리)
  // const resumeSEO = `
  //   <title>이력서 - Vallista Blog</title>
  //   <meta name="description" content="Vallista의 이력서입니다. 경력과 기술 스택을 확인할 수 있습니다." />
  //   <meta property="og:title" content="이력서 - Vallista Blog" />
  //   <meta property="og:description" content="Vallista의 이력서입니다. 경력과 기술 스택을 확인할 수 있습니다." />
  //   <meta property="og:type" content="website" />
  //   <meta property="og:url" content="${SITE_URL}/resume" />
  //   <meta name="twitter:card" content="summary" />
  //   <meta name="twitter:title" content="이력서 - Vallista Blog" />
  //   <meta name="twitter:description" content="Vallista의 이력서입니다. 경력과 기술 스택을 확인할 수 있습니다." />
  // `

  // index.html 수정 (메인 페이지)
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (await fileExists(indexPath)) {
    let html = await fs.readFile(indexPath, 'utf-8')
    html = html.replace(/<title>.*?<\/title>/, mainSEO)
    await fs.writeFile(indexPath, html)
    console.log(chalk.green('✅ Main page SEO injected'))
  }

  // 각 글 페이지별 HTML 생성 (간단한 버전)
  for (const article of articles) {
    // 메인 index.html을 기반으로 SEO만 교체
    const mainHtmlPath = path.join(DIST_DIR, 'index.html')
    let articleHTML = await fs.readFile(mainHtmlPath, 'utf-8')

    // SEO 메타데이터 교체
    articleHTML = articleHTML.replace(
      /<title>.*?<\/title>/,
      `<title>${escapeXml(article.title)} - Vallista Blog</title>`
    )
    articleHTML = articleHTML.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${escapeXml(article.description)}" />`
    )
    articleHTML = articleHTML.replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${escapeXml(article.title)} - Vallista Blog" />`
    )
    articleHTML = articleHTML.replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${escapeXml(article.description)}" />`
    )
    articleHTML = articleHTML.replace(
      /<meta property="og:type" content=".*?" \/>/,
      `<meta property="og:type" content="article" />`
    )
    articleHTML = articleHTML.replace(
      /<meta property="og:url" content=".*?" \/>/,
      `<meta property="og:url" content="${SITE_URL}/articles/${article.slug}" />`
    )
    articleHTML = articleHTML.replace(
      /<meta name="twitter:title" content=".*?" \/>/,
      `<meta name="twitter:title" content="${escapeXml(article.title)} - Vallista Blog" />`
    )
    articleHTML = articleHTML.replace(
      /<meta name="twitter:description" content=".*?" \/>/,
      `<meta name="twitter:description" content="${escapeXml(article.description)}" />`
    )

    // 중복된 메타데이터 제거 (메인 페이지용 메타데이터)
    const duplicateMetaPattern =
      /<meta name="description" content="Vallista의 기술 블로그입니다\. 프론트엔드 개발, React, TypeScript 등에 대한 글을 공유합니다\." \/>\n {4}<meta property="og:title" content="Vallista Blog" \/>\n {4}<meta property="og:description" content="Vallista의 기술 블로그입니다\. 프론트엔드 개발, React, TypeScript 등에 대한 글을 공유합니다\." \/>\n {4}<meta property="og:type" content="website" \/>\n {4}<meta property="og:url" content="https:\/\/vallista\.kr" \/>\n {4}<meta name="twitter:card" content="summary_large_image" \/>\n {4}<meta name="twitter:title" content="Vallista Blog" \/>\n {4}<meta name="twitter:description" content="Vallista의 기술 블로그입니다\. 프론트엔드 개발, React, TypeScript 등에 대한 글을 공유합니다\." \/>\n/g
    articleHTML = articleHTML.replace(duplicateMetaPattern, '')

    // article:published_time 추가
    const headEndIndex = articleHTML.indexOf('</head>')
    const publishedTimeMeta = `    <meta property="article:published_time" content="${article.date}" />\n`
    articleHTML = articleHTML.slice(0, headEndIndex) + publishedTimeMeta + articleHTML.slice(headEndIndex)

    // HTML과 같은 레벨에 meta.json 파일 생성
    const articleDirPath = path.join(DIST_DIR, 'contents', 'articles', article.slug)
    const jsonFilePath = path.join(articleDirPath, 'meta.json')

    // 디렉토리 생성
    await fs.mkdir(articleDirPath, { recursive: true })

    const articleData = {
      title: article.title,
      description: article.description,
      date: article.date,
      tags: article.tags || [],
      image: article.image,
      slug: article.slug,
      url: article.url,
      contentType: article.contentType,
      author: article.author,
      readingTime: article.readingTime,
      content: ''
    }

    // JSON 파일에서 content 읽기
    try {
      const originalJsonPath = path.join(__dirname, '../public/contents/articles', article.slug, 'index.json')
      const jsonData = JSON.parse(await fs.readFile(originalJsonPath, 'utf-8'))
      articleData.content = jsonData.content || ''

      // 썸네일 경로를 slug 기반으로 수정
      if (jsonData.image && jsonData.image.includes('articles/')) {
        const parts = jsonData.image.split('/')
        if (parts.length >= 3) {
          const oldSlug = parts[1]
          if (oldSlug !== article.slug) {
            articleData.image = jsonData.image.replace(`articles/${oldSlug}/`, `articles/${article.slug}/`)
          } else {
            articleData.image = jsonData.image
          }
        }
      } else {
        articleData.image = jsonData.image
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not read JSON file for ${article.slug}:`, error.message))
    }

    // meta.json 파일 생성
    await fs.writeFile(jsonFilePath, JSON.stringify(articleData, null, 2))

    const articleDir = path.join(DIST_DIR, 'contents', 'articles', article.slug)
    await fs.mkdir(articleDir, { recursive: true })
    await fs.writeFile(path.join(articleDir, 'index.html'), articleHTML)

    // 이미지 파일 복사 (contents/articles에서 직접 복사)
    const sourceDir = path.join(CONTENTS_DIR, 'articles', article.slug)
    await copyImages(sourceDir, articleDir)
  }

  console.log(chalk.green('✅ HTML SEO injection completed'))
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// 이미지 파일 복사 함수
async function copyImages(sourceDir, targetDir) {
  try {
    if (!(await fileExists(sourceDir))) {
      return
    }

    // assets 폴더가 있는지 확인
    const assetsDir = path.join(sourceDir, 'assets')
    if (!(await fileExists(assetsDir))) {
      return
    }

    // 타겟 디렉토리 생성
    const targetAssetsDir = path.join(targetDir, 'assets')
    await fs.mkdir(targetAssetsDir, { recursive: true })

    // assets 폴더의 모든 파일 복사 (변경된 파일만)
    const assetsFiles = await fs.readdir(assetsDir)
    let copiedCount = 0

    for (const file of assetsFiles) {
      if (file === '.DS_Store') continue // macOS 시스템 파일 무시

      const sourceFile = path.join(assetsDir, file)
      const targetFile = path.join(targetAssetsDir, file)

      const sourceStat = await fs.stat(sourceFile)
      if (sourceStat.isFile()) {
        // 파일이 변경되었는지 확인
        let shouldCopy = true
        try {
          const targetStat = await fs.stat(targetFile)

          // 파일 크기와 수정 시간이 같으면 복사하지 않음
          if (sourceStat.size === targetStat.size && sourceStat.mtime.getTime() === targetStat.mtime.getTime()) {
            shouldCopy = false
          }
        } catch {
          // 타겟 파일이 없으면 복사
          shouldCopy = true
        }

        if (shouldCopy) {
          await fs.copyFile(sourceFile, targetFile)
          copiedCount++
        }
      }
    }

    // 요약 로그만 출력
    if (copiedCount > 0) {
      console.log(chalk.blue(`📁 이미지 복사: ${copiedCount}개 파일`))
    }
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not copy images from ${sourceDir}:`, error.message))
  }
}

async function getArticles() {
  try {
    // generate-content.js에서 생성된 JSON 데이터 사용
    const contentIndexPath = path.join(DIST_DIR, 'content-index.json')
    const contentIndex = JSON.parse(await fs.readFile(contentIndexPath, 'utf-8'))

    return contentIndex.articles || []
  } catch {
    console.warn(chalk.yellow('⚠️  Could not read content-index.json, falling back to direct parsing'))

    // 폴백: 직접 마크다운 파일 파싱
    const articles = []
    const articlesDir = path.join(CONTENTS_DIR, 'articles')

    try {
      const files = await fs.readdir(articlesDir, { withFileTypes: true })

      for (const file of files) {
        if (file.isDirectory()) {
          const indexPath = path.join(articlesDir, file.name, 'index.md')
          try {
            const content = await fs.readFile(indexPath, 'utf-8')
            const frontmatter = parseFrontmatter(content)
            if (frontmatter) {
              articles.push({
                title: frontmatter.title,
                description: frontmatter.description || '',
                slug: frontmatter.slug || file.name,
                date: frontmatter.date || new Date().toISOString()
              })
            }
          } catch {
            console.warn(chalk.yellow(`⚠️  Could not read ${indexPath}`))
          }
        }
      }
    } catch {
      console.warn(chalk.yellow('⚠️  No articles directory found'))
    }

    return articles
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  if (!match) return null

  const lines = match[1].split(/\r?\n/)
  const result = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue

    const [keyPart, ...valueParts] = trimmed.split(':')
    const key = keyPart.trim()
    const value = valueParts
      .join(':')
      .trim()
      .replace(/^["']|["']$/g, '')
    result[key] = value
  }

  return result
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function main() {
  try {
    console.log(chalk.cyan('🚀 Starting SEO generation...'))

    // Ensure dist directory exists
    await fs.mkdir(DIST_DIR, { recursive: true })

    await Promise.all([generateSitemap(), generateRobots(), generateRSS(), injectSEOIntoHTML()])

    console.log(chalk.green('🎉 SEO generation completed!'))
  } catch (err) {
    console.error(chalk.red('❌ SEO generation failed:'), err)
    process.exit(1)
  }
}

main()
