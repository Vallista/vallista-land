import fs from 'fs/promises'
import path from 'path'

const distDir = path.resolve('public')
const baseUrl = 'https://vallista.kr'

async function generateSitemap() {
  const urls = await walkContents(path.join(distDir, 'contents'))

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

async function walkContents(dir) {
  let results = []
  const list = await fs.readdir(dir, { withFileTypes: true })

  for (const file of list) {
    const filePath = path.join(dir, file.name)

    if (file.isDirectory()) {
      const deeper = await walkContents(filePath)
      results = results.concat(deeper)
    } else if (file.name === 'index.html') {
      const relative = path.relative(path.join(distDir, 'contents'), path.dirname(filePath)).replace(/\\/g, '/')
      results.push(`/contents/${relative}/`)
    }
  }

  return results
}

generateSitemap()
