import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { remarkArticleAssets } from './remark-article-assets.mjs'

export const remarkPlugins = [remarkGfm, remarkArticleAssets]
export const rehypePlugins = [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'append' }]]
