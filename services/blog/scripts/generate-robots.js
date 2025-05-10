// scripts/generate-robots.js
import fs from 'fs/promises'
import path from 'path'

const distDir = path.resolve('dist')
const baseUrl = 'https://vallista.kr'

async function generateRobots() {
  const robotsContent = `
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
  `.trim()

  await fs.writeFile(path.join(distDir, 'robots.txt'), robotsContent)
  console.log('✅ robots.txt 생성 완료!')
}

generateRobots()
