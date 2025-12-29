const { build } = require('vite')
const { resolve } = require('path')

async function buildCSS() {
  try {
    await build({
      configFile: false,
      build: {
        lib: {
          entry: resolve(__dirname, '../src/design-system.css.ts'),
          name: 'DesignSystemCSS',
          fileName: 'design-system',
          formats: ['es']
        },
        outDir: 'dist',
        rollupOptions: {
          output: {
            assetFileNames: '[name].[ext]'
          }
        }
      },
      plugins: [require('@vanilla-extract/vite-plugin')()]
    })
    console.log('✅ CSS build completed successfully!')
  } catch (error) {
    console.error('❌ CSS build failed:', error)
    process.exit(1)
  }
}

buildCSS()
