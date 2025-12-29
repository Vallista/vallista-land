#!/usr/bin/env node
/* eslint-env node */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ORIGINAL_BLOG_DIR = path.join(__dirname, '../../blog/contents/articles')
const NEW_BLOG_DIR = path.join(__dirname, '../../contents/articles')

function syncImages() {
  console.log('🔄 이미지 동기화 시작...')

  let totalSynced = 0
  let totalSkipped = 0

  // 원본 blog의 모든 assets 폴더 찾기
  const originalAssetsDirs = findAssetsDirectories(ORIGINAL_BLOG_DIR)

  for (const originalAssetsDir of originalAssetsDirs) {
    const relativePath = path.relative(ORIGINAL_BLOG_DIR, path.dirname(originalAssetsDir))
    const newAssetsDir = path.join(NEW_BLOG_DIR, relativePath, 'assets')

    // new-blog에 해당 폴더가 있는지 확인
    if (!fs.existsSync(path.dirname(newAssetsDir))) {
      console.log(`⚠️  폴더 없음: ${relativePath}`)
      continue
    }

    // new-blog에 assets 폴더가 없으면 생성
    if (!fs.existsSync(newAssetsDir)) {
      fs.mkdirSync(newAssetsDir, { recursive: true })
      console.log(`📁 폴더 생성: ${relativePath}/assets`)
    }

    // 원본 assets 폴더의 모든 파일 확인
    const originalFiles = fs.readdirSync(originalAssetsDir)
    let syncedCount = 0
    let skippedCount = 0

    for (const file of originalFiles) {
      if (file === '.DS_Store') continue

      const originalFile = path.join(originalAssetsDir, file)
      const newFile = path.join(newAssetsDir, file)

      // 파일이 디렉토리가 아닌 경우에만 처리
      if (fs.statSync(originalFile).isFile()) {
        let shouldCopy = true

        // new-blog에 파일이 있으면 크기와 수정 시간 비교
        if (fs.existsSync(newFile)) {
          const originalStat = fs.statSync(originalFile)
          const newStat = fs.statSync(newFile)

          if (originalStat.size === newStat.size && originalStat.mtime.getTime() === newStat.mtime.getTime()) {
            shouldCopy = false
            skippedCount++
          }
        }

        if (shouldCopy) {
          fs.copyFileSync(originalFile, newFile)
          syncedCount++
        }
      }
    }

    if (syncedCount > 0) {
      console.log(`📸 ${relativePath}: ${syncedCount}개 파일 동기화`)
    }

    totalSynced += syncedCount
    totalSkipped += skippedCount
  }

  console.log(`\n✅ 동기화 완료!`)
  console.log(`📸 동기화된 파일: ${totalSynced}개`)
  console.log(`⏭️  건너뛴 파일: ${totalSkipped}개`)
}

function findAssetsDirectories(dir) {
  const assetsDirs = []

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        if (item === 'assets') {
          assetsDirs.push(fullPath)
        } else {
          traverse(fullPath)
        }
      }
    }
  }

  traverse(dir)
  return assetsDirs
}

// 스크립트 실행
syncImages()
