// scripts/patch-index-seo.js
import fs from 'fs/promises'
import path from 'path'

const distDir = path.resolve('dist')
const indexPath = path.join(distDir, 'index.html')

async function patchIndexSeo() {
  try {
    let indexHtml = await fs.readFile(indexPath, 'utf-8')

    const seoMeta = `
<title>vallista.dev - 프론트엔드 개발자의 기술 블로그</title>

<meta name="description" content="vallista.dev는 프론트엔드 개발과 기술을 다루는 블로그입니다. 최신 트렌드, 심층적인 아키텍처, 개발 경험을 공유합니다.">
<meta name="image" content="https://vallista.kr/profile.png">

<meta property="og:url" content="https://vallista.kr/">
<meta property="og:type" content="website">
<meta property="og:title" content="vallista.dev - 프론트엔드 개발자의 기술 블로그">
<meta property="og:description" content="vallista.dev는 프론트엔드 개발과 기술을 다루는 블로그입니다. 최신 트렌드, 심층적인 아키텍처, 개발 경험을 공유합니다.">
<meta property="og:image" content="https://vallista.kr/profile.png">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="vallista.dev - 프론트엔드 개발자의 기술 블로그">
<meta name="twitter:description" content="vallista.dev는 프론트엔드 개발과 기술을 다루는 블로그입니다. 최신 트렌드, 심층적인 아키텍처, 개발 경험을 공유합니다.">
<meta name="twitter:image" content="https://vallista.kr/profile.png">

<meta name="google-site-verification" content="wPI09aIL9InuxJwKlMkLE-4mzzfbNhQqRCJ760C-8nQ">
`.trim()
    // ✅ 메타 삽입
    indexHtml = indexHtml.replace('<head>', `<head>\n${seoMeta}\n`)

    // ✅ <head> 내부에 잘못 들어간 script 추출 및 <body> 맨 끝으로 이동
    const headScriptRegex = /<head>([\s\S]*?)<\/head>/
    const headMatch = indexHtml.match(headScriptRegex)

    if (headMatch) {
      const originalHead = headMatch[1]

      // 스크립트 추출
      const scriptRegex = /<script\s+type="module"[\s\S]*?<\/script>/g
      const scriptsInHead = originalHead.match(scriptRegex) || []

      // head에서 스크립트 제거
      const cleanedHead = originalHead.replace(scriptRegex, '').trim()

      // 전체 HTML에서 치환
      indexHtml = indexHtml.replace(headScriptRegex, `<head>\n${cleanedHead}\n</head>`)

      // body 끝에 스크립트 삽입
      const combinedScripts = scriptsInHead.join('\n')
      indexHtml = indexHtml.replace('</body>', `${combinedScripts}\n</body>`)
    }

    await fs.writeFile(indexPath, indexHtml)
    console.log('✅ dist/index.html SEO 메타 + 스크립트 위치 패치 완료!')
  } catch (err) {
    console.error('❌ index.html SEO 패치 실패:', err)
    process.exit(1)
  }
}

patchIndexSeo()
