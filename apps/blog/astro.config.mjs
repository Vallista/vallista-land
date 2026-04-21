import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'

import { remarkArticleAssets } from './src/lib/remark-article-assets.mjs'

export default defineConfig({
  site: 'https://vallista.kr',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
    remarkPlugins: [remarkGfm, remarkArticleAssets],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'append' }]]
  },
  vite: {
    plugins: [vanillaExtractPlugin()],
    build: {
      // vanilla-extract CSS를 페이지별 chunk로 쪼개지 않고 단일 번들로 합침.
      // 모든 페이지가 동일한 CSS <link> 하나만 참조 → ClientRouter head swap
      // 시 CSS 교체 없이 부드럽게 전환.
      cssCodeSplit: false,
      rollupOptions: {
        external: ['/pagefind/pagefind.js']
      }
    }
  }
})
