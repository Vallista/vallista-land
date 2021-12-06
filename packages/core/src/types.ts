import '@emotion/react'
import type { BaseTheme } from './components/ThemeProvider'

declare module '@emotion/react' {
  // eslint-disable-next-line
  export interface Theme extends BaseTheme {}
}

export * from './index'
