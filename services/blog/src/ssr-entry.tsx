import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@vallista/design-system'
import { GlobalProvider } from './context'
import '@vallista/design-system/design-system.css'

export function render(url: string) {
  const queryClient = new QueryClient()

  const app = (
    <MemoryRouter initialEntries={[url]}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider enableSystemTheme={false}>
          <GlobalProvider>
            <App />
          </GlobalProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )

  const html = renderToString(app)

  return { html }
}
