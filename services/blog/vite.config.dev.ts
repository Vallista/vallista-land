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
    'process.env.NODE_ENV': '"development"',
    'process.env.FORCE_COLOR': '"1"',
    'process.platform': '"browser"',
    'process.browser': 'true',
    global: 'globalThis'
  },
  server: {
    port: 3000,
    host: true,
    open: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@vallista/design-system']
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'design-system': ['@vallista/design-system'],
          router: ['react-router', 'react-router-dom'],
          query: ['@tanstack/react-query']
        }
      }
    }
  }
})
