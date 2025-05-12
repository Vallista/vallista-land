import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

export function RouterProvider({ children }: { children: ReactNode }) {
  if (typeof window === 'undefined') {
    throw new Error('SSR에서는 StaticRouter를 사용하세요')
  }

  return <BrowserRouter>{children}</BrowserRouter>
}
