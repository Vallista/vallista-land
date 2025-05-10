import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'
import yaml from 'yaml'
import { Node } from 'unist'

interface YamlNode extends Node {
  type: 'yaml'
  value: string
}

export interface Frontmatter {
  title: string
  slug: string
  date: string
  tags?: string[] | null
  description?: string
  draft?: boolean
  info?: boolean
  series?: string
  seriesPriority?: number
}

/**
 * frontmatter를 mdx로부터 추출합니다.
 * @param {string} mdx - 변환할 MDX 문자열
 */
export async function frontmatterToJSON(mdx: string): Promise<Frontmatter> {
  const frontmatterOnly = mdx.split('---').slice(0, 3).join('---')
  const file = new VFile({ value: frontmatterOnly })

  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(() => (tree: Node, file: VFile) => {
      visit(tree, 'yaml', (node: YamlNode) => {
        const parsed = yaml.parse(node.value)
        file.data.frontmatter = parsed
      })
    })

  const tree = processor.parse(frontmatterOnly)
  await processor.run(tree, file)

  return file.data.frontmatter as Frontmatter
}
