const TOKEN = process.argv[2] || null

import ghpages from 'gh-pages'

console.log('🚀 GitHub Pages 배포 시작...')
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
