import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'

import { ThemeProvider } from '@vallista/design-system'
import App from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ThemeProvider>
  </StrictMode>
)
