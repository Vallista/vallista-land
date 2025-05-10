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

    indexHtml = indexHtml.replace('<head>', `<head>\n${seoMeta}\n`)

    await fs.writeFile(indexPath, indexHtml)
    console.log('✅ dist/index.html SEO 메타 패치 완료!')
  } catch (err) {
    console.error('❌ index.html SEO 패치 실패:', err)
    process.exit(1)
  }
}

patchIndexSeo()
