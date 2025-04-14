import '@emotion/react'
import type { BaseTheme } from './components/ThemeProvider'

declare module '@emotion/react' {
  // eslint-disable-next-line
  export interface Theme extends BaseTheme {}
}

declare module 'react' {
  export interface CSSProperties {
    '--loading-dots-size'?: string
  }
}
