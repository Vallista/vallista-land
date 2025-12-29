import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { resolve } from 'path'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [vanillaExtractPlugin(), react(), svgr()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@configs': resolve(__dirname, 'configs'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@features': resolve(__dirname, 'src/features'),
      '@widgets': resolve(__dirname, 'src/widgets'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@app': resolve(__dirname, 'src/app')
    }
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
