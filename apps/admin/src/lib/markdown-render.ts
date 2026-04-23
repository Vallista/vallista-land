import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import { remarkAdminAssets } from './remark-admin-assets'

export type RenderContext = {
  mediaBase?: string
}

export function renderMarkdown(source: string, ctx: RenderContext = {}): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)

  if (ctx.mediaBase) {
    processor.use(remarkAdminAssets, { mediaBase: ctx.mediaBase })
  }

  processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'append' })
    .use(rehypeStringify, { allowDangerousHtml: true })

  const file = processor.processSync(source || '')
  return String(file)
}
