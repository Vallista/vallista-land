/* eslint-env node */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Frontmatter 제외하고 본문만 추출 (center 태그 제거)
function extractBodyNoCenter(content) {
  const frontmatterMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  let body = frontmatterMatch ? content.slice(frontmatterMatch[0].length).trim() : content
  
  // center 태그 제거
  body = body.replace(/<center>.*?<\/center>/g, '')
  
  return body
}

// Frontmatter 제외하고 본문만 추출 (center 유지)
function extractBodyRaw(content) {
  const frontmatterMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  return frontmatterMatch ? content.slice(frontmatterMatch[0].length).trim() : content
}

// 라인별로 이미지 위치 찾기
function findImagesByLine(body) {
  const lines = body.split('\n')
  const images = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
    if (imageMatch) {
      images.push({
        lineNumber: i + 1,
        alt: imageMatch[1],
        url: imageMatch[2],
        fullLine: line
      })
    }
  }
  
  return images
}


// 본문 내 공백 정규화: 3줄 이상 연속 빈 줄을 1줄로 축약, 라인 끝 공백 제거
function normalizeBody(body) {
  if (!body) return body
  // 통일된 개행 처리
  let normalized = body.replace(/\r\n/g, '\n')
  // 라인 끝 공백 제거
  normalized = normalized
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
  // 3줄 이상 빈 줄을 1줄(= 공백 라인 1개)로 축약 => 즉, 연속 개행 3개 이상은 2개로 변경
  normalized = normalized.replace(/\n{3,}/g, '\n\n')
  return normalized
}



// 이미지 위치 수정
function fixImagePositionsForArticle(blogContent, newBlogContent) {
  // 1. Frontmatter 제외하고 본문 추출: 비교용(center 제거) + 수정용(center 유지)
  const blogBody = extractBodyNoCenter(blogContent)
  const newBlogBodyForCompare = extractBodyNoCenter(newBlogContent)
  const newBlogBodyForEdit = extractBodyRaw(newBlogContent)
  
  // 2. 라인별로 이미지 위치 찾기
  const blogImages = findImagesByLine(blogBody)
  const newBlogImages = findImagesByLine(newBlogBodyForCompare)
  
  // 3. 이미지 개수 확인
  if (blogImages.length !== newBlogImages.length) {
    return { needsFix: true, reason: `이미지 개수 불일치: blog(${blogImages.length}) vs new-blog(${newBlogImages.length})` }
  }
  
  // 4. 이미지 개수만 확인 (파일명은 무시)
  // 이미지 개수가 같으면 위치 확인
  
  // 5. 위치가 정확히 같은지 확인
  let positionsMatch = true
  for (let i = 0; i < blogImages.length; i++) {
    const blogImage = blogImages[i]
    const newBlogImage = newBlogImages[i]
    
    if (blogImage.lineNumber !== newBlogImage.lineNumber) {
      positionsMatch = false
      break
    }
  }
  
  // 위치가 정확히 같으면 수정 불필요
  if (positionsMatch) {
    return { needsFix: false }
  }
  
  // 6. 위치가 다르면 수정
  const newBlogLines = newBlogBodyForEdit.split('\n')
  
  // 이미지가 있는 라인들을 제거하고 새로 배치
  let cleanNewBlogLines = newBlogLines.filter(line => !line.match(/!\[([^\]]*)\]\(([^)]+)\)/))
  
  // 도우미: 이미지가 아닌 라인의 누적 개수 계산
  function countNonImageBefore(lines, endExclusiveIndex) {
    let count = 0
    for (let idx = 0; idx < endExclusiveIndex; idx++) {
      const line = lines[idx]
      if (!line.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
        count++
      }
    }
    return count
  }

  // 도우미: 비-이미지 라인 카운트가 동일한 위치 인덱스 찾기
  function findInsertionIndexByNonImageCount(lines, targetNonImageCount) {
    let count = 0
    for (let idx = 0; idx < lines.length; idx++) {
      // 삽입 지점은 현재 라인 이전까지의 비-이미지 라인 수가 타겟과 같을 때
      if (count === targetNonImageCount) return idx
      const line = lines[idx]
      if (!line.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
        count++
      }
    }
    // 끝까지 못 찾으면 맨 끝에 삽입
    return lines.length
  }

  // blog의 이미지 순서대로 정확히 배치 (비-이미지 라인 기준 동기화, 공백은 변경하지 않음)
  const blogLinesNoCenter = blogBody.split('\n')
  for (let i = 0; i < blogImages.length; i++) {
    const blogImage = blogImages[i]
    const blogTargetIndexZeroBased = blogImage.lineNumber - 1
    const nonImageCountBefore = countNonImageBefore(blogLinesNoCenter, blogTargetIndexZeroBased)
    const insertionIndex = findInsertionIndexByNonImageCount(cleanNewBlogLines, nonImageCountBefore)
    cleanNewBlogLines.splice(insertionIndex, 0, blogImage.fullLine)
  }
  
  // 7. 수정된 본문과 원본 frontmatter 합치기
  const frontmatterMatch = newBlogContent.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)
  const frontmatter = frontmatterMatch ? frontmatterMatch[0] : ''
  let updatedBody = cleanNewBlogLines.join('\n')
  
  return {
    needsFix: true,
    reason: '이미지 위치 불일치',
    updatedContent: frontmatter + '\n\n' + updatedBody
  }
}

// 메인 함수
function fixImagePositions() {
  console.log('🔧 이미지 위치 검증 및 수정 작업 시작...')

  const contentsDir = path.join(__dirname, '../../../contents')
  const blogDir = path.join(__dirname, '../../blog/contents/articles')
  let totalIssues = 0
  let fixedCount = 0

  if (!fs.existsSync(blogDir)) {
    console.log('⚠️  Blog 디렉토리를 찾을 수 없습니다.')
    return
  }

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

          // slug 추출 (파일 경로에서)
          const relativePath = path.relative(blogDir, fullPath)
          const slug = relativePath.replace(/\.md$/, '').replace(/\/index$/, '')

          blogArticles.set(slug, {
            content,
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

          if (blogArticle) {
            // 이미지 위치 수정
            const result = fixImagePositionsForArticle(blogArticle.content, content)
            
            if (result.needsFix) {
              totalIssues++
              console.log(`🔍 ${slug}: ${result.reason || '이미지 없음'}`)
              
              if (result.updatedContent) {
                // 파일 업데이트
                fs.writeFileSync(fullPath, result.updatedContent, 'utf-8')
                fixedCount++
                console.log(`✅ ${slug}: 이미지 위치 수정 완료`)
              }
            } else {
              console.log(`✅ ${slug}: 이미지 위치 정상`)
            }
          }
        } catch (error) {
          console.error(`❌ New-blog 아티클 처리 실패: ${fullPath}`, error.message)
        }
      }
    }
  }

  processNewBlogArticles(newBlogDir)

  console.log(`\n🎉 이미지 위치 검증 및 수정 완료!`)
  console.log(`📊 총 문제: ${totalIssues}개`)
  console.log(`🔧 수정된 파일: ${fixedCount}개`)
}

// 스크립트 실행
fixImagePositions()
