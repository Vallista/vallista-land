const TOKEN = process.argv[2] || null

import ghpages from 'gh-pages'
import fs from 'node:fs'
import path from 'node:path'

console.log('🚀 GitHub Pages 배포 시작...')

// 1. index.html → 404.html 생성 (SPA 리디렉션 스크립트 삽입)
const distDir = path.resolve('dist')
const indexPath = path.join(distDir, 'index.html')
const notFoundPath = path.join(distDir, '404.html')

try {
  let indexHtml = fs.readFileSync(indexPath, 'utf-8')

  // 리디렉트 스크립트 정의
  const redirectScript = `
    <script>
      const u = new URLSearchParams(window.location.search);
      const r = u.get('redirect');
      if (r) history.replaceState(null, '', r);
    </script>
  `

  const notFoundRedirectScript = `
    <script>
      const pathname = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      const newUrl = '/index.html?redirect=' + pathname + search + hash;
      window.location.replace(newUrl);
    </script>
  `

  // index.html에 리디렉트 삽입 → 404.html로 저장
  const modifiedHtml = indexHtml.replace('</head>', `${notFoundRedirectScript}\n</head>`)
  fs.writeFileSync(notFoundPath, modifiedHtml)
  console.log('📄 404.html 생성 완료 (SPA 라우팅 지원)')
} catch (err) {
  console.error('❌ 404.html 생성 실패:', err)
  process.exit(1)
}

// 2. gh-pages 퍼블리시
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
