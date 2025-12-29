/* eslint-env node */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 컨텐츠 파싱 함수
function parseContent(content) {
  const frontmatterMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content }
  }

  const frontmatterStr = frontmatterMatch[1]
  const body = content.slice(frontmatterMatch[0].length).trim()

  const frontmatter = {}
  const lines = frontmatterStr.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue

    const [keyPart, ...valueParts] = trimmed.split(':')
    const key = keyPart.trim()
    const rawValue = valueParts.join(':').trim()

    let value = rawValue.replace(/^["']|["']$/g, '')

    // 타입 변환
    if (value === 'null') value = null
    else if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (!isNaN(Number(value))) value = Number(value)
    else if (key === 'tags' && rawValue.startsWith('[') && rawValue.endsWith(']')) {
      try {
        value = JSON.parse(rawValue)
      } catch {
        value = []
      }
    }

    frontmatter[key] = value
  }

  return { frontmatter, body }
}



// 설명 생성 함수
function generateDescription(body) {
  // 마크다운 이미지 태그 제거 (![alt](url) 형태)
  let text = body.replace(/!\[([^\]]*)\]\([^)]*\)/g, '')

  // HTML 이미지 태그 제거 (<img> 형태)
  text = text.replace(/<img[^>]*>/g, '')

  // 마크다운 링크 태그 제거 ([text](url) 형태)
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  // 마크다운 강조 태그 제거 (**text**, *text*, `text` 등)
  text = text.replace(/[#*`]/g, '')

  // HTML 태그 제거
  text = text.replace(/<[^>]*>/g, '')

  // 여러 줄바꿈을 공백으로 변환
  text = text.replace(/\n+/g, ' ')

  // 여러 공백을 하나로 변환
  text = text.replace(/\s+/g, ' ')

  // 앞뒤 공백 제거
  text = text.trim()

  // 길이 제한 (150자)
  return text.length > 150 ? text.substring(0, 150) + '...' : text
}

// 읽기 시간 계산 함수
function formatReadingTime(content) {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// 마크다운에서 첫 번째 이미지 URL 찾기
function findFirstImage(body) {
  // ![alt](url) 형태의 마크다운 이미지 찾기
  const markdownMatch = body.match(/!\[([^\]]*)\]\(([^)]+)\)/)
  if (markdownMatch) {
    return markdownMatch[2]
  }

  // <img src="url"> 형태의 HTML 이미지 찾기
  const htmlMatch = body.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/)
  if (htmlMatch) {
    return htmlMatch[1]
  }

  return null
}

// 최적의 썸네일 찾기 함수
function findOptimalThumbnail(assetsDir) {
  const priorityOrder = ['splash', '0', '1', '2', '3']
  
  for (const name of priorityOrder) {
    // 다양한 확장자 확인
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    for (const ext of extensions) {
      const filePath = path.join(assetsDir, `${name}${ext}`)
      if (fs.existsSync(filePath)) {
        return `${name}${ext}`
      }
    }
  }
  
  return null
}

// 썸네일 경로 생성 함수
function getThumbnailPath(imagePath, filePath) {
  const assetsDir = path.dirname(filePath)
  
  // 최적의 썸네일 찾기
  const optimalThumbnail = findOptimalThumbnail(assetsDir)
  if (optimalThumbnail) {
    return `assets/${optimalThumbnail}`
  }
  
  // 최적의 썸네일이 없으면 원본 이미지 사용
  const imageName = imagePath.replace(/^\.?\/?assets\//, '')
  return `assets/${imageName}`
}

// 썸네일 동기화 함수
function syncThumbnail(frontmatter, body, filePath) {
  const firstImage = findFirstImage(body)
  
  if (!firstImage) {
    return { changed: false, shouldRemoveFirstImage: false }
  }

  // 경로 정규화 함수
  function normalizePath(imagePath) {
    // 상대 경로를 assets/ 형태로 변환
    if (imagePath.startsWith('./')) {
      return imagePath.substring(2)
    }
    if (imagePath.startsWith('/')) {
      return imagePath.substring(1)
    }
    return imagePath
  }

  const normalizedFirstImage = normalizePath(firstImage)
  const normalizedFrontmatterImage = normalizePath(frontmatter.image)

  // frontmatter에 image가 없고 첫 번째 이미지가 있으면 추가
  if (!frontmatter.image && normalizedFirstImage) {
    const thumbnailPath = getThumbnailPath(normalizedFirstImage, filePath)
    frontmatter.image = thumbnailPath
    console.log(`📸 썸네일 추가: ${path.basename(filePath)} -> ${thumbnailPath}`)
    return { changed: true, shouldRemoveFirstImage: true }
  }

  // frontmatter의 image와 첫 번째 이미지가 다르면 frontmatter 업데이트
  if (frontmatter.image && normalizedFirstImage && normalizedFrontmatterImage !== normalizedFirstImage) {
    const thumbnailPath = getThumbnailPath(normalizedFirstImage, filePath)
    console.log(`🔄 썸네일 동기화: ${path.basename(filePath)}`)
    console.log(`   기존: ${frontmatter.image}`)
    console.log(`   새로운: ${thumbnailPath}`)
    frontmatter.image = thumbnailPath
    return { changed: true, shouldRemoveFirstImage: true }
  }

  // frontmatter의 image와 첫 번째 이미지가 같으면 첫 번째 이미지 제거
  if (frontmatter.image && normalizedFirstImage && normalizedFrontmatterImage === normalizedFirstImage) {
    return { changed: false, shouldRemoveFirstImage: true }
  }

  return { changed: false, shouldRemoveFirstImage: false }
}

// 업데이트된 frontmatter로 마크다운 파일 내용 생성
function generateUpdatedContent(frontmatter, body) {
  const frontmatterLines = []

  // frontmatter를 YAML 형태로 변환
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === null) {
      frontmatterLines.push(`${key}: null`)
    } else if (typeof value === 'boolean') {
      frontmatterLines.push(`${key}: ${value}`)
    } else if (typeof value === 'number') {
      frontmatterLines.push(`${key}: ${value}`)
    } else if (Array.isArray(value)) {
      frontmatterLines.push(`${key}: ${JSON.stringify(value)}`)
    } else {
      // 문자열은 따옴표로 감싸기
      const escapedValue = String(value).replace(/"/g, '\\"')
      frontmatterLines.push(`${key}: "${escapedValue}"`)
    }
  }

  return `---\n${frontmatterLines.join('\n')}\n---\n\n${body}`
}

// 첫 번째 이미지와 center 태그를 제거한 마크다운 본문 생성
function cleanMarkdownContent(body) {
  let result = body

  // 첫 번째 ![alt](url) 형태의 마크다운 이미지 제거
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/, '', 1)

  // 첫 번째 <img> 태그 형태의 HTML 이미지 제거
  result = result.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/, '', 1)

  // 첫 번째 <center> 태그 제거
  result = result.replace(/<center>[\s\S]*?<\/center>/, '', 1)

  // 앞뒤 공백 정리
  result = result.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '')

  return result
}

// 이미지 추가 함수 (이제 restore-images.js에서 처리하므로 간단하게 유지)
function addImagesForAllArticles(body) {
  // 이미지 복원은 restore-images.js에서 처리하므로 여기서는 추가 작업 없음
  return body
}

// 디렉토리에서 마크다운 파일들을 재귀적으로 찾는 함수
function findMarkdownFiles(dir) {
  const files = []

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (item.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

// 이미지 파일 복사 함수
function copyImages(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return
  }

  // assets 폴더가 있는지 확인
  const assetsDir = path.join(sourceDir, 'assets')
  if (!fs.existsSync(assetsDir)) {
    return
  }

  // 타겟 디렉토리 생성
  const targetAssetsDir = path.join(targetDir, 'assets')
  if (!fs.existsSync(targetAssetsDir)) {
    fs.mkdirSync(targetAssetsDir, { recursive: true })
  }

  // assets 폴더의 모든 파일 복사 (변경된 파일만)
  const assetsFiles = fs.readdirSync(assetsDir)
  let copiedCount = 0

  for (const file of assetsFiles) {
    if (file === '.DS_Store') continue // macOS 시스템 파일 무시

    const sourceFile = path.join(assetsDir, file)
    const targetFile = path.join(targetAssetsDir, file)

    if (fs.statSync(sourceFile).isFile()) {
      // 파일이 변경되었는지 확인
      let shouldCopy = true
      if (fs.existsSync(targetFile)) {
        const sourceStat = fs.statSync(sourceFile)
        const targetStat = fs.statSync(targetFile)

        // 파일 크기와 수정 시간이 같으면 복사하지 않음
        if (sourceStat.size === targetStat.size && sourceStat.mtime.getTime() === targetStat.mtime.getTime()) {
          shouldCopy = false
        }
      }

      if (shouldCopy) {
        fs.copyFileSync(sourceFile, targetFile)
        copiedCount++
      }
    }
  }

  // 요약 로그만 출력
  if (copiedCount > 0) {
    console.log(`📁 이미지 복사: ${copiedCount}개 파일`)
  }
}

// 메인 함수
function generateContent() {
  console.log('Generating content index...')

  const contentsDir = path.join(__dirname, '../contents')
  const outputDir = path.join(__dirname, '../public')
  const articlesDir = path.join(outputDir, 'contents', 'articles')

  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true })
  }

  const articles = []
  const notes = []
  const projects = []
  const tags = new Set()
  const categories = new Set()

  // 각 컨텐츠 타입별로 처리
  const contentTypes = ['articles', 'notes', 'projects']

  for (const contentType of contentTypes) {
    const typeDir = path.join(contentsDir, contentType)
    
    if (!fs.existsSync(typeDir)) {
      console.log(`Found 0 markdown files in ${contentType}`)
      continue
    }

    const files = findMarkdownFiles(typeDir)
    console.log(`Found ${files.length} markdown files in ${contentType}`)

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const { frontmatter, body } = parseContent(content)

        // slug는 setup-content.js에서 처리됨
        if (!frontmatter.slug) {
          console.warn(`⚠️  slug가 없는 파일: ${filePath}`)
          continue
        }

        const slug = frontmatter.slug

        // 콘텐츠 정리 및 이미지 추가
        let updatedBody = cleanMarkdownContent(body)
        updatedBody = addImagesForAllArticles(updatedBody)

        // 썸네일 동기화
        const syncResult = syncThumbnail(frontmatter, updatedBody, filePath)

        // 파일 업데이트가 필요한 경우
        let shouldUpdateFile = true

        // 썸네일이 변경되었거나 콘텐츠가 정리된 경우 파일 업데이트
        if (syncResult.changed || shouldUpdateFile) {
          const updatedContent = generateUpdatedContent(frontmatter, updatedBody)
          fs.writeFileSync(filePath, updatedContent, 'utf-8')
        }

        const description = frontmatter.description || generateDescription(updatedBody)
        const readingTime = formatReadingTime(updatedBody)
        const url = `/${contentType}/${slug}`

        const article = {
          title: frontmatter.title,
          description,
          date: frontmatter.date || new Date().toISOString(),
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
          image: frontmatter.image,
          slug,
          url,
          contentType,
          author: frontmatter.author || 'Vallista',
          readingTime,
          draft: frontmatter.draft === true || frontmatter.draft === 'true'
        }

        // 컨텐츠 타입에 따라 분류
        switch (contentType) {
          case 'articles':
            articles.push(article)
            break
          case 'notes':
            notes.push(article)
            break
          case 'projects':
            projects.push(article)
            break
        }

        // 개별 아티클 파일 생성 (폴더 안에 생성)
        const articleDir = path.join(articlesDir, slug)
        if (!fs.existsSync(articleDir)) {
          fs.mkdirSync(articleDir, { recursive: true })
        }

        // 1. index.json (전체 데이터)
        const articleJsonPath = path.join(articleDir, 'index.json')
        const articleData = {
          ...article,
          content: updatedBody,
          frontmatter
        }
        fs.writeFileSync(articleJsonPath, JSON.stringify(articleData, null, 2))

        // 2. meta.json (메타데이터만)
        const metaJsonPath = path.join(articleDir, 'meta.json')
        const metaData = {
          title: article.title,
          description: article.description,
          date: article.date,
          tags: article.tags,
          image: article.image,
          slug: article.slug,
          url: article.url,
          contentType: article.contentType,
          author: article.author,
          readingTime: article.readingTime,
          draft: article.draft
        }
        fs.writeFileSync(metaJsonPath, JSON.stringify(metaData, null, 2))

        // 3. index.html (정적 HTML)
        const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <meta name="description" content="${article.description}">
    <meta property="og:title" content="${article.title}">
    <meta property="og:description" content="${article.description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://vallista.kr${article.url}">
    ${article.image ? `<meta property="og:image" content="https://vallista.kr${article.image}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.title}">
    <meta name="twitter:description" content="${article.description}">
    ${article.image ? `<meta name="twitter:image" content="https://vallista.kr${article.image}">` : ''}
    <link rel="canonical" href="https://vallista.kr${article.url}">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
        const htmlPath = path.join(articleDir, 'index.html')
        fs.writeFileSync(htmlPath, htmlContent)

        // 이미지 파일 복사 (dist/contents/articles/{slug}/assets/ 형태로)
        const sourceDir = path.dirname(filePath)
        const targetDir = path.join(articlesDir, slug)
        copyImages(sourceDir, targetDir)

        // 태그와 카테고리 수집
        if (Array.isArray(frontmatter.tags)) {
          frontmatter.tags.forEach((tag) => tags.add(tag))
        }

        if (frontmatter.category) {
          categories.add(frontmatter.category)
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error)
      }
    }
  }

  // 날짜순으로 정렬 (최신순)
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  projects.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // 결과 객체 생성
  const contentIndex = {
    articles,
    notes,
    projects,
    tags: Array.from(tags),
    categories: Array.from(categories),
    generatedAt: new Date().toISOString()
  }

  // JSON 파일로 저장
  const outputPath = path.join(outputDir, 'content-index.json')
  fs.writeFileSync(outputPath, JSON.stringify(contentIndex, null, 2))

  console.log(`Content index generated: ${outputPath}`)
  console.log(`Articles: ${articles.length}`)
  console.log(`Notes: ${notes.length}`)
  console.log(`Projects: ${projects.length}`)
  console.log(`Tags: ${tags.size}`)
  console.log(`Categories: ${categories.size}`)
  console.log(`Individual article JSONs generated in: ${articlesDir}`)
}

// 스크립트 실행
generateContent()
