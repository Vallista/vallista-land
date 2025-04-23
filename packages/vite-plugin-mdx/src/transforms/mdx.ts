import rehypeStringify from 'rehype-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { extractFrontmatter } from '../plugins/extractFrontmatter'
import { changeImageUrl } from '../plugins/changeImageUrl'
import { remarkAutoHighlight } from '../plugins/remarkAutoHighlight'
import rehypePrettyCode from 'rehype-pretty-code'
import { rehypePrettyCodeOptions } from '../plugins'
import rehypeEnhanceImages from '../plugins/rehypeEnhanceImages'

/**
 * Convert MDX(MD) to HTML
 *
 * @param {string} mdx - 컨버트 할 mdx 파일을 넣습니다.
 */
async function mdxToHTML(mdx: string, path: string, slug: string) {
  const file = await unified()
    .use(remarkParse)
    .use(changeImageUrl(path, slug))
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkAutoHighlight)
    .use(remarkRehype)
    .use(rehypePrettyCode, rehypePrettyCodeOptions)
    .use(rehypeEnhanceImages)
    .use(rehypeStringify)
    .process(mdx)

  return String(file)
}

export async function mdxFrontMatterToJson(slug: string, category: string, path: string, mdx: string) {
  const frontmatterOnly = mdx.split('---').slice(0, 3).join('---')
  const file = new VFile({ value: frontmatterOnly })

  const processor = await unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(extractFrontmatter)

  const tree = processor.parse(frontmatterOnly)
  await processor.run(tree, file)

  const url = path.split(slug)[0] + slug

  return {
    slug,
    path: `/files${path}`,
    url,
    category,
    ...(file.data.frontmatter as Record<string, unknown>)
  } as Record<string, unknown>
}

/**
 * Convert MDX(MD) to HTML
 *
 * @param {string} mdx - 컨버트 할 mdx 파일을 넣습니다.
 */
export async function transformMdx(mdx: string, path: string, slug: string) {
  return await mdxToHTML(mdx, path, slug)
}

export async function transformMdxFrontMatterJson(slug: string, category: string, path: string, mdx: string) {
  return await mdxFrontMatterToJson(slug, category, path, mdx)
}
