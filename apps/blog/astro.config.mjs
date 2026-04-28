import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { remarkPlugins, rehypePlugins } from '@vallista/markdown/plugins-astro'

export default defineConfig({
  site: 'https://vallista.kr',
  integrations: [mdx(), sitemap()],
  build: {
    // 모든 스타일을 external <link>로 고정. ClientRouter 가 head swap 할 때
    // inline <style> 교체에 따른 flash 를 없애기 위함.
    inlineStylesheets: 'never'
  },
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
    remarkPlugins,
    rehypePlugins
  },
  vite: {
    plugins: [vanillaExtractPlugin()],
    build: {
      // vanilla-extract CSS 를 단일 번들로 — 모든 페이지가 같은 link 하나만 참조.
      cssCodeSplit: false,
      rollupOptions: {
        external: ['/pagefind/pagefind.js']
      }
    }
  }
})
