import { Plugin } from 'unified'
import { Node } from 'unist'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'
import yaml from 'yaml'

// 'yaml' 노드 타입 정의 (remark-frontmatter가 추가함)
interface YamlNode extends Node {
  type: 'yaml'
  value: string
}

export const extractFrontmatter: Plugin<[], Node> = () => {
  return (tree: Node, file: VFile) => {
    visit(tree, 'yaml', (node: YamlNode) => {
      const parsed = yaml.parse(node.value)
      file.data.frontmatter = parsed
    })
  }
}
