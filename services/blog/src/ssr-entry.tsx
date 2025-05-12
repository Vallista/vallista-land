import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@vallista/design-system'

import { CacheProvider } from '@emotion/react'
import createEmotionCache from './libs/createEmotionCache'
import createEmotionServer from '@emotion/server/create-instance'

export function render(url: string) {
  const queryClient = new QueryClient()
  const emotionCache = createEmotionCache()
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(emotionCache)

  const app = (
    <CacheProvider value={emotionCache}>
      <StaticRouter location={url}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </QueryClientProvider>
      </StaticRouter>
    </CacheProvider>
  )

  const html = renderToString(app)
  const emotionChunks = extractCriticalToChunks(html)
  const styleTags = constructStyleTagsFromChunks(emotionChunks)

  return { html, styleTags } // ← 이제 styleTags를 외부에서 <head>에 삽입할 수 있음
}
