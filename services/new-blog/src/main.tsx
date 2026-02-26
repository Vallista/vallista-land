import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@app/App'
// CSS import
import '@vallista/design-system/global.css'
// 전역 스타일 (root font-size 등)
import '@shared/styles/global.css'

// 구글 색인용: /contents/articles/xxx → /articles/xxx 로 리다이렉트 (기존 URL 정리)
const pathname = window.location.pathname
const contentsMatch = pathname.match(/^\/contents\/articles\/([^/]+)\/?$/)
if (contentsMatch) {
  window.location.replace(`/articles/${contentsMatch[1]}`)
} else {
  const container = document.getElementById('root')
  if (!container) {
    throw new Error('Root element not found')
  }

  const root = createRoot(container)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
