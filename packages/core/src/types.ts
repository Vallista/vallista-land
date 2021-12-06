import '@emotion/react'
import { BaseTheme } from 'src/components/ThemeProvider'

declare module '@emotion/react' {
  // eslint-disable-next-line
  export interface Theme extends BaseTheme {}
}

export * from './index'
