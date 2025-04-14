import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'], // 모든 API를 index.ts에서 re-export 해야 함
  format: ['esm'], // ESM만 생성 (필요하면 'cjs' 추가)
  dts: {
    entry: 'src/index.ts', // 타입 정의도 index 기준으로 생성
    resolve: true
  },
  sourcemap: true,
  clean: true,
  splitting: false, // 단일 entry이므로 splitting 필요 없음
  target: 'node18', // transpile 대상 (ES2022 ~ node18 수준 추천)
  outDir: 'dist',
  external: ['react', 'react-dom', '@emotion/react', '@emotion/styled'], // peerDependencies는 외부 모듈로 처리
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = '@emotion/react' // emotion JSX 지원
  }
})
