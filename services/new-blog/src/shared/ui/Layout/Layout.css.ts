import { COLOR_TOKENS } from '@vallista/design-system'
import { style } from '@vanilla-extract/css'

import { DEFINE_SIDEBAR_WIDTH, DEFINE_NAVBAR_WIDTH } from '../../constants/layout'
import { responsive } from '../../styles/breakpoints'

// ============================================================================
// Wrapper
// ============================================================================
export const wrapper = style({
  minHeight: '100vh',
  ...responsive({
    mobile: {
      width: '100%',
      overflow: 'hidden'
    }
  })
})

// ============================================================================
// Container
// ============================================================================
export const container = style({
  ...responsive({
    mobile: {
      width: '100%',
      marginLeft: 0,
      height: 'auto'
    }
  })
})

// ============================================================================
// Main Content Area (Desktop)
// ============================================================================
const desktopMainStyles = {
  position: 'relative' as const,
  display: 'flex' as const,
  flexDirection: 'column' as const,
  justifyContent: 'space-between' as const,
  width: `calc(100vw - ${DEFINE_NAVBAR_WIDTH + DEFINE_SIDEBAR_WIDTH}px)`,
  height: '100vh',
  marginLeft: `${DEFINE_NAVBAR_WIDTH + DEFINE_SIDEBAR_WIDTH}px`,
  overflowY: 'scroll' as const,
  WebkitOverflowScrolling: 'touch' as const
}

export const main = style({
  ...desktopMainStyles,
  ...responsive({
    mobile: {
      width: '100vw',
      marginLeft: 0,
      height: 'auto',
      paddingTop: '80px', // Header 높이만큼 공간 확보
      overflow: 'hidden',
      overflowY: 'auto' as const,
      position: 'relative' as const,
      justifyContent: 'flex-start' as const
    }
  })
})

// ============================================================================
// Main Content Area (Folded Sidebar - Desktop)
// ============================================================================
const desktopMainFoldedStyles = {
  position: 'relative' as const,
  display: 'flex' as const,
  flexDirection: 'column' as const,
  justifyContent: 'space-between' as const,
  width: `calc(100vw - ${DEFINE_NAVBAR_WIDTH}px)`,
  height: '100vh',
  marginLeft: `${DEFINE_NAVBAR_WIDTH}px`,
  overflowY: 'scroll' as const,
  WebkitOverflowScrolling: 'touch' as const
}

export const mainFolded = style({
  ...desktopMainFoldedStyles,
  ...responsive({
    mobile: {
      width: '100vw',
      marginLeft: 0,
      height: 'auto',
      paddingTop: '80px', // Header 높이만큼 공간 확보
      overflow: 'hidden',
      overflowY: 'auto' as const,
      position: 'relative' as const,
      justifyContent: 'flex-start' as const
    }
  })
})

// ============================================================================
// Article Container
// ============================================================================
export const article = style({
  boxSizing: 'border-box',
  margin: '0 auto',
  width: '100%',
  ...responsive({
    desktop: {
      width: '100%'
    },
    mobile: {
      width: '100%'
    }
  })
})

export const articleLink = style({
  cursor: 'pointer',
  borderBottom: `2px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`,
  fontWeight: 600,
  textDecoration: 'none',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  transition: 'all 0.1s ease-out'
})
