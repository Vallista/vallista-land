import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import devServer from '@hono/vite-dev-server'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ mode }) => {
  // .env / .env.local 을 process.env 에 주입. @hono/vite-dev-server 로 동작하는
  // 서버 코드(src/server/*)는 process.env 를 읽으므로, Vite 기본 동작(import.meta.env)
  // 만으로는 부족해서 명시적으로 병합한다.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }

  return {
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
  }
})
