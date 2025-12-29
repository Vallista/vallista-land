/* eslint-env node */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 마크다운 파싱 함수
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

// 슬러그 생성 함수
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
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

// 마크다운에서 이미지 찾기
function findImagesInMarkdown(content) {
  const images = []

  // ![alt](url) 형태의 마크다운 이미지 찾기
  const markdownMatches = content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)
  for (const match of markdownMatches) {
    images.push({
      type: 'markdown',
      alt: match[1],
      url: match[2],
      fullMatch: match[0]
    })
  }

  // <img src="url"> 형태의 HTML 이미지 찾기
  const htmlMatches = content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)
  for (const match of htmlMatches) {
    images.push({
      type: 'html',
      url: match[1],
      fullMatch: match[0]
    })
  }

  return images
}

// 이미지 경로 정규화
function normalizeImagePath(imagePath) {
  // 상대 경로를 assets/ 형태로 변환
  if (imagePath.startsWith('./')) {
    return imagePath.substring(2)
  }
  if (imagePath.startsWith('/')) {
    return imagePath.substring(1)
  }
  return imagePath
}

// 아티클 내용에서 이미지 추가
function addMissingImages(newBlogContent, blogImages) {
  let result = newBlogContent

  for (const blogImage of blogImages) {
    const normalizedPath = normalizeImagePath(blogImage.url)

    // new-blog에 해당 이미지가 없는지 확인
    const imageExists = result.includes(normalizedPath) ||
                       result.includes(blogImage.fullMatch)

    if (!imageExists) {
      // 이미지가 없으면 추가
      if (blogImage.type === 'markdown') {
        const imageMarkdown = `![${blogImage.alt}](${normalizedPath})`

        // 적절한 위치에 이미지 추가 (첫 번째 섹션 제목 다음)
        const sectionMatch = result.match(/^##\s+(.+)$/m)
        if (sectionMatch) {
          const sectionTitle = sectionMatch[0]
          const insertPosition = result.indexOf(sectionTitle) + sectionTitle.length
          result = result.slice(0, insertPosition) + '\n\n' + imageMarkdown + '\n\n' + result.slice(insertPosition)
        } else {
          // 섹션 제목이 없으면 첫 번째 문단 다음에 추가
          const firstParagraphEnd = result.indexOf('\n\n')
          if (firstParagraphEnd !== -1) {
            result = result.slice(0, firstParagraphEnd + 2) + imageMarkdown + '\n\n' + result.slice(firstParagraphEnd + 2)
          } else {
            // 문단이 없으면 맨 앞에 추가
            result = imageMarkdown + '\n\n' + result
          }
        }
      }
    }
  }

  return result
}

// 메인 초기화 함수
function initContent() {
  console.log('🚀 콘텐츠 초기화 작업 시작...')

  const contentsDir = path.join(__dirname, '../../contents')
  const blogDir = path.join(__dirname, '../../blog/contents/articles')
  const flagFile = path.join(__dirname, '../.init-content-completed')
  let setupCount = 0
  let restoreCount = 0

  // 이미 실행 완료되었는지 확인
  const isAlreadyCompleted = fs.existsSync(flagFile)

  // 1단계: 기본 설정 작업
  console.log('\n📋 1단계: 기본 설정 작업...')

  const contentTypes = ['articles', 'notes', 'projects']

  for (const contentType of contentTypes) {
    const typeDir = path.join(contentsDir, contentType)
    
    if (!fs.existsSync(typeDir)) {
      console.log(`📁 ${contentType} 디렉토리가 없습니다.`)
      continue
    }

    const files = findMarkdownFiles(typeDir)
    console.log(`📚 ${contentType}에서 ${files.length}개 파일 처리 중...`)

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const { frontmatter, body } = parseContent(content)
        let hasChanges = false

        // 1. slug가 없으면 제목에서 생성
        if (!frontmatter.slug) {
          frontmatter.slug = generateSlug(frontmatter.title || path.basename(filePath, '.md'))
          hasChanges = true
          console.log(`🏷️  slug 추가: ${path.basename(filePath)} -> ${frontmatter.slug}`)
        }

        // 2. tags가 null이면 빈 배열로 설정
        if (frontmatter.tags === null) {
          frontmatter.tags = []
          hasChanges = true
          console.log(`🏷️  tags 수정: ${path.basename(filePath)} -> []`)
        }

        // 3. 최적의 썸네일로 설정 (우선순위: splash > 0 > 1 > 2 > 3)
        const assetsDir = path.join(path.dirname(filePath), 'assets')
        const optimalThumbnail = findOptimalThumbnail(assetsDir)
        
        if (optimalThumbnail) {
          const optimalImage = `assets/${optimalThumbnail}`
          
          // 현재 이미지와 최적 이미지가 다르면 업데이트
          if (frontmatter.image !== optimalImage) {
            frontmatter.image = optimalImage
            hasChanges = true
            console.log(`🖼️  썸네일 최적화: ${path.basename(filePath)}`)
            console.log(`   기존: ${frontmatter.image || '없음'}`)
            console.log(`   최적: ${optimalImage}`)
          }
        }

        // 4. 변경사항이 있으면 파일 업데이트
        if (hasChanges) {
          const updatedContent = generateUpdatedContent(frontmatter, body)
          fs.writeFileSync(filePath, updatedContent, 'utf-8')
          setupCount++
        }

      } catch (error) {
        console.error(`❌ 파일 처리 실패: ${filePath}`, error.message)
      }
    }
  }

  // 2단계: 이미지 복원 작업 (1회만 실행)
  if (isAlreadyCompleted) {
    console.log('\n🖼️ 2단계: 이미지 복원 작업...')
    console.log('✅ 이미 실행 완료됨 - 건너뜀')
  } else {
    console.log('\n🖼️ 2단계: 이미지 복원 작업...')

    if (!fs.existsSync(blogDir)) {
      console.log('⚠️  Blog 디렉토리를 찾을 수 없어 이미지 복원을 건너뜁니다.')
    } else {
    // Blog의 모든 아티클 읽기
    const blogArticles = new Map()

    function readBlogArticles(dir) {
      const items = fs.readdirSync(dir)

      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          readBlogArticles(fullPath)
        } else if (item.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            const images = findImagesInMarkdown(content)

            // slug 추출 (파일 경로에서)
            const relativePath = path.relative(blogDir, fullPath)
            const slug = relativePath.replace(/\.md$/, '').replace(/\/index$/, '')

            blogArticles.set(slug, {
              content,
              images,
              path: fullPath
            })
          } catch (error) {
            console.error(`❌ Blog 아티클 읽기 실패: ${fullPath}`, error.message)
          }
        }
      }
    }

    readBlogArticles(blogDir)
    console.log(`📚 Blog 아티클 ${blogArticles.size}개 읽기 완료`)

    // New-blog 아티클과 비교
    const newBlogDir = path.join(contentsDir, 'articles')

    function processNewBlogArticles(dir) {
      const items = fs.readdirSync(dir)

      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          processNewBlogArticles(fullPath)
        } else if (item.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')

            // slug 추출 (파일 경로에서)
            const relativePath = path.relative(newBlogDir, fullPath)
            const slug = relativePath.replace(/\.md$/, '').replace(/\/index$/, '')

            // 해당하는 blog 아티클 찾기
            const blogArticle = blogArticles.get(slug)

            if (blogArticle && blogArticle.images.length > 0) {
              // new-blog의 현재 이미지 확인
              const newBlogImages = findImagesInMarkdown(content)

              // 누락된 이미지 찾기
              const missingImages = blogArticle.images.filter(blogImage => {
                const normalizedPath = normalizeImagePath(blogImage.url)
                return !newBlogImages.some(newImage =>
                  newImage.url === normalizedPath ||
                  newImage.url === blogImage.url ||
                  newImage.fullMatch === blogImage.fullMatch
                )
              })

              if (missingImages.length > 0) {
                console.log(`🔍 ${slug}: ${missingImages.length}개 이미지 누락`)

                // frontmatter와 body 분리
                const { frontmatter, body } = parseContent(content)
                
                // body에만 누락된 이미지 추가
                const updatedBody = addMissingImages(body, missingImages)
                
                // 전체 콘텐츠 재생성
                const updatedContent = generateUpdatedContent(frontmatter, updatedBody)

                // 파일 업데이트
                fs.writeFileSync(fullPath, updatedContent, 'utf-8')
                restoreCount++

                console.log(`✅ ${slug}: 이미지 복원 완료`)
              }
            }
          } catch (error) {
            console.error(`❌ New-blog 아티클 처리 실패: ${fullPath}`, error.message)
          }
        }
      }
    }

      processNewBlogArticles(newBlogDir)

      // 이미지 복원 완료 플래그 생성
      fs.writeFileSync(flagFile, new Date().toISOString())
      console.log('✅ 이미지 복원 완료 플래그 생성됨')
    }
  }

  console.log('\n🎉 콘텐츠 초기화 완료!')
  console.log(`📊 설정 작업: ${setupCount}개 파일`)
  console.log(`🖼️  이미지 복원: ${restoreCount}개 파일`)
  
  if (!isAlreadyCompleted && restoreCount > 0) {
    console.log('\n💡 이미지 복원이 완료되었습니다. 이제 "npm run generate-content"를 실행하여 JSON을 생성하세요.')
  } else if (isAlreadyCompleted) {
    console.log('\n💡 이미 초기화가 완료되었습니다. "npm run generate-content"를 실행하여 JSON을 생성하세요.')
  } else {
    console.log('\n💡 이제 "npm run generate-content"를 실행하여 JSON을 생성하세요.')
  }
}

// 스크립트 실행
initContent()
