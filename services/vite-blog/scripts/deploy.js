const TOKEN = process.argv[2] || null

import ghpages from 'gh-pages'
import fs from 'node:fs'
import path from 'node:path'

console.log('🚀 GitHub Pages 배포 시작...')

// 1. dist/index.html → dist/404.html 복사
const distDir = path.resolve('dist')
const indexPath = path.join(distDir, 'index.html')
const notFoundPath = path.join(distDir, '404.html')

try {
  fs.copyFileSync(indexPath, notFoundPath)
  console.log('📄 404.html 생성 완료')
} catch (err) {
  console.error('❌ 404.html 생성 실패:', err)
  process.exit(1)
}

ghpages.publish(
  'dist', // ✅ public → dist
  {
    branch: 'main',
    repo: TOKEN
      ? `https://vallista:${TOKEN}@github.com/Vallista/vallista.github.io.git`
      : 'https://github.com/Vallista/vallista.github.io.git'
  },
  function (err) {
    if (err) {
      console.error('❌ 배포 실패:', err)
      process.exit(1)
    } else {
      console.log('✅ 배포 성공!')
    }
  }
)
