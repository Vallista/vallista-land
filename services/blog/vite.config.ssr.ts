import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    svgr(), // SSR에서도 SVG import 대응
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [['@emotion', { sourceMap: false, autoLabel: 'never' }]]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  ssr: {
    noExternal: [
      '@emotion/react',
      '@emotion/styled'
      // 필요 시 추가
    ]
  }
})
