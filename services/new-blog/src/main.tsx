import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@app/App'
// CSS import - workspace:* 호환성을 위해 여러 경로 시도
import '@vallista/design-system/global.css'
import '@vallista/design-system/design-system.css'
// 전역 스타일 (root font-size 등)
import '@shared/styles/global.css'

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
