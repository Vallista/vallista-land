import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  clearScreen: false,
  server: {
    port: 5977,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5978,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: false,
  },
});
