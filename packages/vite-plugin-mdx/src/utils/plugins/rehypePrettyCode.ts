import { Options } from 'rehype-pretty-code'

export const rehypePrettyCodeOptions: Options = {
  theme: 'one-dark-pro',
  keepBackground: false,

  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }]
    }
  },

  onVisitHighlightedLine(node) {
    node.properties.className ??= []
    node.properties.className.push('highlighted')
  },

  onVisitHighlightedChars(node) {
    node.properties.className ??= []
    node.properties.className.push('word')
  }
}
