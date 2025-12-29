import { defineConfig } from 'vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    dts({
      insertTypesEntry: true,
      rollupTypes: false, // rollupTypes를 false로 설정
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
      outDir: 'dist',
      tsconfigPath: 'tsconfig.json'
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        // CSS 파일 엔트리 포인트 추가
        'design-system.css': resolve(__dirname, 'src/design-system.css.ts'),
        'global.css': resolve(__dirname, 'src/design-system.css.ts'),
        // 개별 컴포넌트 엔트리 포인트들
        'Badge/index': resolve(__dirname, 'src/components/Badge/index.tsx'),
        'Button/index': resolve(__dirname, 'src/components/Button/index.tsx'),
        'Capacity/index': resolve(__dirname, 'src/components/Capacity/index.tsx'),
        'Checkbox/index': resolve(__dirname, 'src/components/Checkbox/index.ts'),
        'Collapse/index': resolve(__dirname, 'src/components/Collapse/index.tsx'),
        'Container/index': resolve(__dirname, 'src/components/Container/index.tsx'),
        'Footer/index': resolve(__dirname, 'src/components/Footer/index.tsx'),
        'Icon/index': resolve(__dirname, 'src/components/Icon/index.tsx'),
        'Image/index': resolve(__dirname, 'src/components/Image/index.tsx'),
        'Input/index': resolve(__dirname, 'src/components/Input/index.ts'),
        'LoadingDots/index': resolve(__dirname, 'src/components/LoadingDots/index.tsx'),
        'Modal/index': resolve(__dirname, 'src/components/Modal/index.ts'),
        'Note/index': resolve(__dirname, 'src/components/Note/index.tsx'),
        'Progress/index': resolve(__dirname, 'src/components/Progress/index.tsx'),
        'Radio/index': resolve(__dirname, 'src/components/Radio/index.ts'),
        'Select/index': resolve(__dirname, 'src/components/Select/index.tsx'),
        'ShowMore/index': resolve(__dirname, 'src/components/ShowMore/index.tsx'),
        'Snippet/index': resolve(__dirname, 'src/components/Snippet/index.tsx'),
        'Spacer/index': resolve(__dirname, 'src/components/Spacer/index.tsx'),
        'Spinner/index': resolve(__dirname, 'src/components/Spinner/index.tsx'),
        'Switch/index': resolve(__dirname, 'src/components/Switch/index.ts'),
        'Tabs/index': resolve(__dirname, 'src/components/Tabs/index.tsx'),
        'Tag/index': resolve(__dirname, 'src/components/Tag/index.tsx'),
        'Tags/index': resolve(__dirname, 'src/components/Tags/index.tsx'),
        'Text/index': resolve(__dirname, 'src/components/Text/index.ts'),
        'ThemeProvider/index': resolve(__dirname, 'src/components/ThemeProvider/index.ts'),
        'Toast/index': resolve(__dirname, 'src/components/Toast/index.tsx'),
        'Toggle/index': resolve(__dirname, 'src/components/Toggle/index.tsx'),
        'Tooltip/index': resolve(__dirname, 'src/components/Tooltip/index.tsx'),
        'Video/index': resolve(__dirname, 'src/components/Video/index.ts'),
        // Hooks
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
        // Theme
        'theme/index': resolve(__dirname, 'src/theme/index.ts'),
        // Utils
        'utils/index': resolve(__dirname, 'src/utils/index.ts')
      },
      name: 'VallistaDesignSystem',
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'clsx', '@emotion/react', '@emotion/styled'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          clsx: 'clsx',
          '@emotion/react': 'emotionReact',
          '@emotion/styled': 'emotionStyled'
        },
        // 각 컴포넌트별로 폴더 구조로 생성
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name].[ext]'
      }
    },
    sourcemap: true
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
