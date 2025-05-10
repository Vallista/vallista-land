// copy-layout.js
import fs from 'fs/promises'
import path from 'path'

async function copyLayout() {
  const srcLayoutPath = path.resolve('scripts/layout.html') // 개발용 layout.html 위치
  const distLayoutPath = path.resolve('dist/layout.html')

  try {
    await fs.copyFile(srcLayoutPath, distLayoutPath)
    console.log('📄 layout.html 복사 완료')
  } catch (err) {
    console.error('❌ layout.html 복사 실패:', err)
    process.exit(1)
  }
}

copyLayout()
