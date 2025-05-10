import fs from 'fs/promises'
import { transformMdxToHTML, removeFrontmatter } from '../utils'
import { Node } from './buildTree'

/**
 * 트리 구조를 순회하며 각 콘텐츠 노드의 `.mdx` 파일을 HTML 문자열로 변환합니다.
 * - `html` 필드를 각 콘텐츠 노드에 추가한 새로운 트리를 반환합니다.
 *
 * @param tree 콘텐츠 트리 (`Node` 타입, DirectoryNode 또는 ContentNode)
 * @returns HTML이 포함된 새로운 트리
 */
export async function createTreeToHTML(tree: Node): Promise<Node> {
  if (tree.type === 'directory') {
    // 하위 디렉토리 순회하여 재귀적으로 HTML 트리 생성
    const children = await Promise.all(tree.children.map(createTreeToHTML))
    return { ...tree, children }
  }

  // 콘텐츠 노드: MDX 파일을 읽고 HTML로 변환
  const mdx = await fs.readFile(tree.mdxFilePath, 'utf-8')
  const contentOnly = removeFrontmatter(mdx)
  const html = await transformMdxToHTML(contentOnly, tree.folderTrail, tree.frontmatter.slug)

  return {
    ...tree,
    html
  }
}
