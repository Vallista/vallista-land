import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'

import { changeImageUrl, rehypePrettyCodeOptions, rehypeEnhanceImages, remarkAutoHighlight } from '../plugins'

/**
 * MDX(MD) 파일을 HTML로 변환합니다.
 * @param {string} mdx - 변환할 MDX 문자열
 * @param {string} trail - 상위 폴더 경로들의 배열
 * @param {string} slug - 슬러그
 */
export async function transformMdxToHTML(mdx: string, trail: string[], slug: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(changeImageUrl(trail, slug))
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
