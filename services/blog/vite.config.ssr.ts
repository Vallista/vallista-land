import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vanillaExtractPlugin(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.FORCE_COLOR': '"0"',
    'process.browser': 'true',
    global: 'globalThis'
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      external: ['react', 'react-dom']
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@vallista/design-system']
  }
})
