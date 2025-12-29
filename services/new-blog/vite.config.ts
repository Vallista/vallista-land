import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { resolve } from 'path'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [vanillaExtractPlugin(), react(), svgr()],
  resolve: {
    alias: [
      { find: /^@\/(.*)/, replacement: resolve(__dirname, 'src/$1') },
      { find: /^@configs\/(.*)/, replacement: resolve(__dirname, 'configs/$1') },
      { find: /^@shared\/(.*)/, replacement: resolve(__dirname, 'src/shared/$1') },
      { find: /^@entities\/(.*)/, replacement: resolve(__dirname, 'src/entities/$1') },
      { find: /^@features\/(.*)/, replacement: resolve(__dirname, 'src/features/$1') },
      { find: /^@widgets\/(.*)/, replacement: resolve(__dirname, 'src/widgets/$1') },
      { find: /^@pages\/(.*)/, replacement: resolve(__dirname, 'src/pages/$1') },
      { find: /^@app\/(.*)/, replacement: resolve(__dirname, 'src/app/$1') },
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '@configs', replacement: resolve(__dirname, 'configs') },
      { find: '@shared', replacement: resolve(__dirname, 'src/shared') },
      { find: '@entities', replacement: resolve(__dirname, 'src/entities') },
      { find: '@features', replacement: resolve(__dirname, 'src/features') },
      { find: '@widgets', replacement: resolve(__dirname, 'src/widgets') },
      { find: '@pages', replacement: resolve(__dirname, 'src/pages') },
      { find: '@app', replacement: resolve(__dirname, 'src/app') }
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.json']
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.FORCE_COLOR': '"0"',
    'process.browser': 'true',
    global: 'globalThis'
  },
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'design-system': ['@vallista/design-system'],
          router: ['react-router', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          utils: ['zustand', 'gray-matter']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@vallista/design-system'],
    exclude: ['rehype-pretty-code']
  },
  assetsInclude: ['**/*.md']
})
