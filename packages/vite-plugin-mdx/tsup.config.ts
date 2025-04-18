import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'], // Vite 플러그인은 ESM이어야 함
  target: 'node18',
  splitting: false,
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'yaml',
    'vite',
    'path',
    'url',
    'fs',
    'chalk',
    'chokidar',
    '@mdx-js/rollup',
    '@mdx-js/react',
    'remark-frontmatter',
    'remark-mdx-frontmatter',
    'rehype-pretty-code',
    'remark-gfm',
    'remark-parse',
    'shiki',
    'unist-util-visit',
    'estree-util-value-to-estree'
  ]
})
