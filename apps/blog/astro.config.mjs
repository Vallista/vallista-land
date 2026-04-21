import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'

export default defineConfig({
  site: 'https://vallista.kr',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'append' }]]
  },
  vite: {
    plugins: [vanillaExtractPlugin()],
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js']
      }
    }
  }
})
