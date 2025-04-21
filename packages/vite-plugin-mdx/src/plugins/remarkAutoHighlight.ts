import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Code } from 'mdast'

/**
 * 모든 코드 블럭에 기본 하이라이트 옵션 `{1}` 자동 삽입
 */
export const remarkAutoHighlight: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      if (node.meta) return // 이미 하이라이트 지시자가 있다면 스킵
      node.meta = '{1}' // 기본값으로 첫 줄 하이라이트
    })
  }
}
