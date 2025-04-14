import '@emotion/react'
import type { BaseTheme } from '@vallista/design-system'

declare module '@emotion/react' {
  export interface Theme extends BaseTheme {}
}
