import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginMdx from '@vallista/vite-plugin-mdx'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// NOTE: mdx 파일이 있는 콘텐츠 폴더 경로
export const CONTENTS_PATH = `${process.cwd()}/contents`
// NOTE: 변환된 HTML 파일을 저장할 폴더 경로
export const RESULT_PATH = `${process.cwd()}/public/contents`

// https://vite.dev/config/
export default defineConfig({
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
