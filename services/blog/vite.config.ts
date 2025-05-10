import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginMdx from '@vallista/vite-plugin-mdx'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// NOTE: mdx 파일이 있는 콘텐츠 폴더 경로
export const CONTENTS_PATH = `${process.cwd()}/contents`
// NOTE: 변환된  파일을 저장할 폴더 경로
export const RESULT_PATH = `${process.cwd()}/public`

// https://vite.dev/config/
export default defineConfig({
  build: {
    manifest: true
  },
  server: {
    host: '0.0.0.0', // 또는 '192.168.0.123'로 직접 지정
    port: 5173
  },
  preview: {
    host: true, // ✅ 외부 접속 허용
    allowedHosts: ['8495-211-117-64-79.ngrok-free.app'], // ✅ 어떤 도메인이든 허용
    port: 4173 // (선택) 포트 고정
  },
  plugins: [
    svgr(),
    vitePluginMdx({
      contentPath: CONTENTS_PATH,
      resultPath: RESULT_PATH
    }),
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
