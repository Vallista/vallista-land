import path from 'node:path'
import { visit } from 'unist-util-visit'

// md 본문의 ./assets/xxx / assets/xxx 이미지 참조를 실제 정적 URL로 변환.
// contents/articles/<slug>/index.md 또는 contents/articles/<slug>.md 에서 사용.
// 변환 규칙:
//   assets/foo.png       → /contents/articles/<slug>/assets/foo.png
//   ./assets/foo.png     → 동일
//   http(s):// 또는 /   → 그대로
//
// slug는 vfile.path 에서 contents/articles/ 다음 세그먼트로 추출한다.

const ARTICLES_MARKER = `${path.sep}contents${path.sep}articles${path.sep}`

function slugFromPath(filePath) {
  if (!filePath) return null
  const normalized = filePath.replace(/\\/g, path.sep)
  const idx = normalized.indexOf(ARTICLES_MARKER)
  if (idx < 0) return null
  const rest = normalized.slice(idx + ARTICLES_MARKER.length)
  const parts = rest.split(path.sep)
  if (parts.length === 0) return null
  // 폴더형: "2021년-회고/index.md" → "2021년-회고"
  // 단일: "BNF-Backus-Naur-Form.md" → "BNF-Backus-Naur-Form"
  const head = parts[0]
  if (!head) return null
  return head.endsWith('.md') ? head.slice(0, -3) : head
}

function encodeSegment(s) {
  return s.split('/').map(encodeURIComponent).join('/')
}

export function remarkArticleAssets() {
  return function transformer(tree, file) {
    const slug = slugFromPath(file.path ?? file.history?.[0] ?? '')
    if (!slug) return

    function rewrite(url) {
      if (typeof url !== 'string' || url.length === 0) return url
      if (/^https?:\/\//i.test(url) || url.startsWith('/') || url.startsWith('//')) return url
      // 모든 상대경로를 글 assets 폴더 기준 절대경로로 치환.
      //   "./assets/x" | "assets/x" | "x.png" 모두 대상.
      // Astro의 빌드타임 image resolver를 우회해야 빌드 실패를 막을 수 있다.
      const trimmed = url.replace(/^\.\//, '')
      if (trimmed.startsWith('assets/')) {
        const rest = trimmed.slice('assets/'.length)
        return `/contents/articles/${encodeSegment(slug)}/assets/${encodeSegment(rest)}`
      }
      return `/contents/articles/${encodeSegment(slug)}/${encodeSegment(trimmed)}`
    }

    // image 노드를 raw HTML figure 카드로 치환.
    // Astro의 content-assets resolver는 markdown image 노드만 자동 import하므로
    // html 노드로 바꾸면 build 타임 resolve를 완전히 우회할 수 있다.
    // figure.img-card: 고정 높이 + 회색 배경 + onload fade-in (next/image 스타일)
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

    // 인라인 HTML로 적힌 <img src="assets/...">도 처리
    visit(tree, 'html', (node) => {
      if (typeof node.value !== 'string') return
      node.value = node.value.replace(
        /(<img\s+[^>]*?src=["'])([^"']+)(["'])/gi,
        (match, pre, url, post) => `${pre}${rewrite(url)}${post}`
      )
    })
  }
}
