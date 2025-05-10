import fs from 'fs'
import path from 'path'

async function generate404Html() {
  const distDir = path.resolve('dist')
  const indexPath = path.join(distDir, 'index.html')
  const notFoundPath = path.join(distDir, '404.html')

  try {
    let indexHtml = fs.readFileSync(indexPath, 'utf-8')

    const notFoundRedirectScript = `
    <script>
      (function() {
        const pathname = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;
        const target = '/index.html?redirect=' + encodeURIComponent(pathname + search + hash);
        window.location.replace(target);
      })();
    </script>
    `

    const modifiedHtml = indexHtml.replace('</head>', `${notFoundRedirectScript}\n</head>`)
    fs.writeFileSync(notFoundPath, modifiedHtml)
    console.log('📄 404.html 생성 완료 (SPA 리디렉션 지원)')
  } catch (err) {
    console.error('❌ 404.html 생성 실패:', err)
    process.exit(1)
  }
}

generate404Html()
