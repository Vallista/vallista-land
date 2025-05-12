import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@vallista/design-system'
import { CacheProvider } from '@emotion/react'
import createEmotionCache from './libs/createEmotionCache' // 경로는 상황에 맞게 조정
import App from './App'

const queryClient = new QueryClient()
const emotionCache = createEmotionCache()

export default function RouterClient() {
  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </CacheProvider>
  )
}
