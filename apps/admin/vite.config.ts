import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import devServer from '@hono/vite-dev-server'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@server': fileURLToPath(new URL('./src/server', import.meta.url))
    }
  },
  plugins: [
    react(),
    devServer({
      entry: 'src/server/index.ts',
      // /api/* 만 Hono 에 위임. 그 외 경로는 Vite 가 처리 (SPA index.html)
      exclude: [/^\/(?!api(\/|$)).*/]
    })
  ],
  server: {
    port: 5977,
    strictPort: true
  }
})
