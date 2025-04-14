import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from '@vallista/design-system'
import App from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme='LIGHT'>
      <App />
    </ThemeProvider>
  </StrictMode>
)
