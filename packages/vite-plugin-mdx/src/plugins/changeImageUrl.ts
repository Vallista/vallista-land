import { Plugin } from 'unified'
import { Node } from 'unist'
import { visit } from 'unist-util-visit'

export const changeImageUrl = (path: string, slug: string): Plugin<[], Node> => {
  return () => {
    return (tree: Node) => {
      visit(tree, 'image', (node: any) => {
        if (node.url.startsWith('http')) return
        node.url = `${path.split(slug)[0] + slug}/${node.url.replace(/^\.\/?/, '')}`
      })
    }
  }
}
