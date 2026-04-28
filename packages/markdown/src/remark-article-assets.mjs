import path from 'node:path'
import { visit } from 'unist-util-visit'

// md 본문의 ./assets/xxx / assets/xxx 이미지 참조를 실제 정적 URL로 변환.
// contents/(articles|notes)/<slug>/index.md 또는 contents/(articles|notes)/<slug>.md 에서 사용.
// 변환 규칙:
//   assets/foo.png       → /contents/<collection>/<slug>/assets/foo.png
//   ./assets/foo.png     → 동일
//   http(s):// 또는 /   → 그대로
//
// collection + slug는 vfile.path 에서 contents/<collection>/ 다음 세그먼트로 추출한다.

const COLLECTIONS = ['articles', 'notes']

function parsePath(filePath) {
  if (!filePath) return null
  const normalized = filePath.replace(/\\/g, path.sep)
  for (const collection of COLLECTIONS) {
    const marker = `${path.sep}contents${path.sep}${collection}${path.sep}`
    const idx = normalized.indexOf(marker)
    if (idx < 0) continue
    const rest = normalized.slice(idx + marker.length)
    const parts = rest.split(path.sep)
    if (parts.length === 0) return null
    const head = parts[0]
    if (!head) return null
    const slug = head.endsWith('.md') ? head.slice(0, -3) : head
    return { collection, slug }
  }
  return null
}

function encodeSegment(s) {
  return s.split('/').map(encodeURIComponent).join('/')
}

export function remarkArticleAssets() {
  return function transformer(tree, file) {
    const parsed = parsePath(file.path ?? file.history?.[0] ?? '')
    if (!parsed) return
    const { collection, slug } = parsed

    function rewrite(url) {
      if (typeof url !== 'string' || url.length === 0) return url
      if (/^https?:\/\//i.test(url) || url.startsWith('/') || url.startsWith('//')) return url
      const trimmed = url.replace(/^\.\//, '')
      if (trimmed.startsWith('assets/')) {
        const rest = trimmed.slice('assets/'.length)
        return `/contents/${collection}/${encodeSegment(slug)}/assets/${encodeSegment(rest)}`
      }
      return `/contents/${collection}/${encodeSegment(slug)}/${encodeSegment(trimmed)}`
    }

    const frontmatter =
      (file.data && file.data.astro && file.data.astro.frontmatter) || {}
    if (frontmatter.image && Array.isArray(tree.children) && tree.children.length > 0) {
      const first = tree.children[0]
      if (
        first &&
        first.type === 'paragraph' &&
        Array.isArray(first.children) &&
        first.children.length > 0 &&
        first.children[0].type === 'image'
      ) {
        first.children.shift()
        while (
          first.children.length > 0 &&
          (first.children[0].type === 'break' ||
            first.children[0].type === 'softbreak' ||
            (first.children[0].type === 'text' &&
              first.children[0].value &&
              first.children[0].value.trim().length === 0))
        ) {
          first.children.shift()
        }
        if (first.children.length === 0) {
          tree.children.shift()
        }
      }
    }

    visit(tree, 'image', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      const url = typeof node.url === 'string' ? rewrite(node.url) : ''
      const alt = typeof node.alt === 'string' ? node.alt : ''
      const title = typeof node.title === 'string' ? node.title : ''
      const escape = (s) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const titleAttr = title ? ` title="${escape(title)}"` : ''
      const captionHtml = alt ? `<figcaption class="img-card__caption">${escape(alt)}</figcaption>` : ''
      parent.children[index] = {
        type: 'html',
        value: `<figure class="img-card"><img src="${escape(url)}" alt="${escape(alt)}"${titleAttr} loading="lazy" decoding="async" onload="this.closest('.img-card').classList.add('is-loaded')" onerror="this.closest('.img-card').classList.add('is-error')" />${captionHtml}</figure>`
      }
    })

    visit(tree, 'html', (node) => {
      if (typeof node.value !== 'string') return
      node.value = node.value.replace(
        /(<img\s+[^>]*?src=["'])([^"']+)(["'])/gi,
        (match, pre, url, post) => `${pre}${rewrite(url)}${post}`
      )
    })
  }
}
