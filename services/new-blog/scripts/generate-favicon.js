#!/usr/bin/env node
/* eslint-env node */

/**
 * SVG를 favicon으로 변환하는 스크립트
 * 
 * 이 스크립트는 SVG를 PNG와 ICO 형식으로 변환합니다.
 * sharp 라이브러리가 필요합니다: pnpm add -D sharp
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SVG_PATH = path.join(__dirname, '../src/shared/assets/icons/logo.svg')
const PUBLIC_DIR = path.join(__dirname, '../public')
const FAVICON_DIR = path.join(PUBLIC_DIR, 'favicon')

async function generateFavicon() {
  try {
    // sharp가 설치되어 있는지 확인
    let sharp
    try {
      sharp = (await import('sharp')).default
    } catch {
      console.log('⚠️  sharp가 설치되어 있지 않습니다.')
      console.log('📦 설치하려면: pnpm add -D sharp')
      console.log('💡 SVG favicon만 사용하려면 현재 설정으로도 충분합니다.')
      return
    }

    console.log('🎨 Favicon 생성 중...')

    // favicon 디렉토리 생성
    await fs.mkdir(FAVICON_DIR, { recursive: true })

    // SVG 파일 읽기
    const svgBuffer = await fs.readFile(SVG_PATH)

    // SVG를 favicon 폴더로 복사
    await fs.copyFile(SVG_PATH, path.join(FAVICON_DIR, 'favicon.svg'))
    console.log('✅ favicon.svg 복사 완료')

    // 다양한 크기의 PNG 생성
    const sizes = [16, 32, 48, 180, 192, 512]
    
    for (const size of sizes) {
      const pngBuffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
      
      const outputPath = path.join(FAVICON_DIR, `favicon-${size}x${size}.png`)
      await fs.writeFile(outputPath, pngBuffer)
      console.log(`✅ ${size}x${size} PNG 생성 완료`)
    }

    // favicon.ico 생성 (32x32 PNG를 사용)
    const ico32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer()
    await fs.writeFile(path.join(FAVICON_DIR, 'favicon.ico'), ico32)
    console.log('✅ favicon.ico 생성 완료')

    // apple-touch-icon 생성 (180x180)
    const appleIcon = await sharp(svgBuffer).resize(180, 180).png().toBuffer()
    await fs.writeFile(path.join(FAVICON_DIR, 'apple-touch-icon.png'), appleIcon)
    console.log('✅ apple-touch-icon.png 생성 완료')

    // manifest.json 생성
    const manifest = {
      name: 'Vallista Blog',
      short_name: 'Vallista',
      description: 'Vallista의 기술 블로그',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/favicon/favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        },
        {
          src: '/favicon/favicon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon/favicon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
    
    await fs.writeFile(
      path.join(FAVICON_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    )
    console.log('✅ manifest.json 생성 완료')

    console.log('🎉 모든 favicon 생성 완료!')
  } catch (error) {
    console.error('❌ Favicon 생성 실패:', error.message)
    process.exit(1)
  }
}

generateFavicon()

