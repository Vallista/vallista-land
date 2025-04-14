import rehypeStringify from 'rehype-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

/**
 * Convert MDX(MD) to HTML
 *
 * @param {string} mdx - 컨버트 할 mdx 파일을 넣습니다.
 */
async function mdxToHTML(mdx: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(mdx)

  return String(file)
}

/**
 * Convert MDX(MD) to HTML
 *
 * @param {string} mdx - 컨버트 할 mdx 파일을 넣습니다.
 */
export async function transformMdx(mdx: string) {
  return await mdxToHTML(mdx)
}
