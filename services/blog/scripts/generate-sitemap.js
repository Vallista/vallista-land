import fs from 'fs/promises'
import path from 'path'

// dist/public 디렉토리를 기준으로 (generate-static-html.ts가 dist/public에 생성)
const distDir = path.resolve('dist', 'public')
const baseUrl = 'https://vallista.kr'

async function generateSitemap() {
  // dist/public/contents 또는 dist/public/files/contents 중 실제 존재하는 경로 확인
  const contentsDir = path.join(distDir, 'contents')
  const filesContentsDir = path.join(distDir, 'files', 'contents')
  
  let targetDir = contentsDir
  try {
    await fs.access(contentsDir)
  } catch {
    // contents가 없으면 files/contents 확인
    try {
      await fs.access(filesContentsDir)
      targetDir = filesContentsDir
    } catch {
      // 둘 다 없으면 contents 사용 (하위 경로에서 files 제외)
      targetDir = contentsDir
    }
  }
  
  // 디렉토리가 존재하는지 확인
  try {
    await fs.access(targetDir)
  } catch (error) {
    console.warn(`⚠️  디렉토리가 없습니다: ${targetDir}`)
    console.warn('⚠️  빈 sitemap을 생성합니다.')
    await fs.writeFile(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`)
    return
  }
  
  const urls = await walkContents(targetDir, targetDir)

  const sitemapContent = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${baseUrl}${url}</loc>
  </url>`
  )
  .join('\n')}
</urlset>
`.trim()

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapContent)
  console.log('✅ sitemap.xml 생성 완료!')
}

async function walkContents(dir, baseDir) {
  let results = []
  
  try {
    const list = await fs.readdir(dir, { withFileTypes: true })

    for (const file of list) {
      const filePath = path.join(dir, file.name)

      if (file.isDirectory()) {
        const deeper = await walkContents(filePath, baseDir)
        results = results.concat(deeper)
      } else if (file.name === 'index.html') {
        // baseDir 기준으로 상대 경로 계산
        const relative = path.relative(baseDir, path.dirname(filePath)).replace(/\\/g, '/')
        // files/contents인 경우 files 제거
        const cleanRelative = relative.startsWith('files/') ? relative.replace(/^files\//, '') : relative
        results.push(`/contents/${cleanRelative}/`)
      }
    }
  } catch (error) {
    console.error(`❌ 디렉토리 읽기 실패: ${dir}`, error.message)
  }

  return results
}

generateSitemap()
