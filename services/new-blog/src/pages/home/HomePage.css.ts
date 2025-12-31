import { style } from '@vanilla-extract/css'

import { DEFINE_HEADER_HEIGHT } from '@shared/constants/layout'
import { responsive } from '@shared/styles/breakpoints'

// ============================================================================
// Home Page Root
// ============================================================================
const desktopRootStyles = {
  width: '800px',
  padding: `${DEFINE_HEADER_HEIGHT}px 0 0`,
  margin: '0 auto' as const
}

export const root = style({
  ...desktopRootStyles,
  ...responsive({
    mobile: {
      width: 'auto',
      padding: '0 0 60px'
    }
  })
})

export const loadingContainer = style({
  textAlign: 'center',
  padding: '2rem'
})

export const articlesGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
})
