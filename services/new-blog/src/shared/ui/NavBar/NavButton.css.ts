import { COLOR_TOKENS } from '@vallista/design-system'
import { style } from '@vanilla-extract/css'

import { DEFINE_NAVBAR_ITEM_HEIGHT, DEFINE_NAVBAR_ITEM_WIDTH } from '@shared/constants/layout'
import { responsive } from '@shared/styles/breakpoints'

// ============================================================================
// NavBar Button
// ============================================================================
const desktopNavButtonStyles = {
  display: 'flex' as const,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
  height: `${DEFINE_NAVBAR_ITEM_HEIGHT}px`,
  cursor: 'pointer' as const,
  border: 'none',
  background: 'transparent',
  padding: 0,
  // 테마 전환 시 색상 변경을 빠르게
  transition: 'background-color 0.08s ease, color 0.08s ease',
  color: 'currentcolor',
  selectors: {
    '&:hover': {
      backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5
    }
  }
}

export const navButton = style({
  ...desktopNavButtonStyles,
  ...responsive({
    mobile: {
      width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
      height: `${DEFINE_NAVBAR_ITEM_WIDTH}px`
    }
  })
})
