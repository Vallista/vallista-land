import { visit } from 'unist-util-visit'
import type { Root, Image, Html } from 'mdast'

export type AdminAssetsOptions = {
  mediaBase: string
}

function encodeSegments(s: string): string {
  return s.split('/').map((p) => encodeURIComponent(p)).join('/')
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// blog의 remark-article-assets.mjs와 동일한 변환을 admin 프리뷰에 적용.
// mediaBase 는 호출부가 구성 — /api/media/:category/:slug 또는 /api/drafts/:id/media.
export function remarkAdminAssets(options: AdminAssetsOptions) {
  const base = options.mediaBase.replace(/\/$/, '')

  function rewrite(url: string): string {
    if (!url) return url
    if (/^https?:\/\//i.test(url) || url.startsWith('/') || url.startsWith('//') || url.startsWith('data:')) {
      return url
    }
    const trimmed = url.replace(/^\.\//, '')
    return `${base}/${encodeSegments(trimmed)}`
  }

  return function transformer(tree: Root): void {
    visit(tree, 'image', (node: Image, index, parent) => {
      if (!parent || typeof index !== 'number') return
      const url = typeof node.url === 'string' ? rewrite(node.url) : ''
      const alt = typeof node.alt === 'string' ? node.alt : ''
      const title = typeof node.title === 'string' ? node.title : ''
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
      const captionHtml = alt
        ? `<figcaption class="img-card__caption">${escapeAttr(alt)}</figcaption>`
        : ''
      const html: Html = {
        type: 'html',
        value: `<figure class="img-card"><img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}"${titleAttr} loading="lazy" decoding="async" onload="this.closest('.img-card').classList.add('is-loaded')" onerror="this.closest('.img-card').classList.add('is-error')" />${captionHtml}</figure>`
      }
      parent.children[index] = html
    })

    visit(tree, 'html', (node: Html) => {
      if (typeof node.value !== 'string') return
      node.value = node.value.replace(
        /(<img\s+[^>]*?src=["'])([^"']+)(["'])/gi,
        (_match: string, pre: string, url: string, post: string) => `${pre}${rewrite(url)}${post}`
      )
    })
  }
}
