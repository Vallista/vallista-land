import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import RouterClient from './RouterClient'

const rootEl = document.getElementById('root')!

try {
  hydrateRoot(
    rootEl,
    <StrictMode>
      <RouterClient />
    </StrictMode>
  )
} catch (err) {
  console.error('❌ Hydration failed. Fallback to client render:', err)
  createRoot(rootEl).render(
    <StrictMode>
      <RouterClient />
    </StrictMode>
  )
}
