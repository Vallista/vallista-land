import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@vallista/design-system'
import { ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'

import { NavProvider } from '@shared/context/NavContext'
import { SearchProvider } from '@shared/context/SearchContext'
import { SidebarProvider } from '@shared/context/SidebarContext'

import { ErrorBoundary } from '../ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider enableSystemTheme={true}>
            <BrowserRouter>
              <SidebarProvider>
                <NavProvider>
                  <SearchProvider>{children}</SearchProvider>
                </NavProvider>
              </SidebarProvider>
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}
