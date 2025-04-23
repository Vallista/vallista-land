import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Element } from 'hast'

const rehypeEnhanceImages: Plugin = () => {
  return (tree) => {
    let isFirstImage = true

    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img') {
        node.properties = node.properties || {}

        node.properties.loading = 'lazy'
        node.properties.decoding = 'async'

        if (isFirstImage) {
          node.properties.fetchpriority = 'high'
          isFirstImage = false
        }

        if (!node.properties.alt) {
          node.properties.alt = ''
        }

        // fade-in을 위한 클래스 추가
        const className = node.properties.className || []
        node.properties.className = Array.isArray(className)
          ? [...className, 'fade-image'].filter((v): v is string => typeof v === 'string')
          : typeof className === 'string'
            ? [className, 'fade-image']
            : ['fade-image']

        // fallback: style 직접 삽입
        if (!node.properties.style) {
          node.properties.style =
            'aspect-ratio: 2 / 1; display: block; width: 100%; object-fit: cover; opacity: 0; transition: opacity 0.8s ease;'
        } else if (typeof node.properties.style === 'string') {
          node.properties.style += '; opacity: 0; transition: opacity 0.8s ease;'
        }
      }
    })
  }
}

export default rehypeEnhanceImages
