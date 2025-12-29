import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@vallista/design-system'
import { GlobalProvider } from './context'
import { Layout } from './apps/layout'

const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider enableSystemTheme={false}>
        <GlobalProvider>
          <BrowserRouter>
            <Layout />
          </BrowserRouter>
        </GlobalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
