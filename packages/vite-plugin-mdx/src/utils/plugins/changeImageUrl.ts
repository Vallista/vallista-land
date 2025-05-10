import { Plugin } from 'unified'
import { Node } from 'unist'
import { visit } from 'unist-util-visit'

export const changeImageUrl = (trail: string[], slug: string): Plugin<[], Node> => {
  return () => {
    return (tree: Node) => {
      visit(tree, 'image', (node: any) => {
        if (!node.url || typeof node.url !== 'string') return
        if (node.url.startsWith('http')) return

        // "/files/contents/articles/foo-slug/example.png" 형태로 변환
        const segments = ['/files', ...trail, slug, node.url.replace(/^\.\/?/, '')]
        node.url = segments.join('/')
      })
    }
  }
}
