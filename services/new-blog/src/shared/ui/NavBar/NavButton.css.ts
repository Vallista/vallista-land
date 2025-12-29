import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'
import { DEFINE_NAVBAR_ITEM_HEIGHT, DEFINE_NAVBAR_ITEM_WIDTH } from '@shared/constants/layout'

export const navButton = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
  height: `${DEFINE_NAVBAR_ITEM_HEIGHT}px`,
  cursor: 'pointer',
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
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
      height: `${DEFINE_NAVBAR_ITEM_WIDTH}px`
    }
  }
})
