import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { resolve } from 'path'

// https://vitejs.dev/config/
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
    'process.platform': '"browser"',
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
          query: ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@vallista/design-system']
  },
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    }
  }
})
