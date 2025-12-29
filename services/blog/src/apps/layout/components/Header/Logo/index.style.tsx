import { style } from '@vanilla-extract/css'
import { DEFINE_HEADER_HEIGHT } from '../utils'
import { DEFINE_SIDEBAR_WIDTH } from '../../Sidebar/utils'
import { COLOR_TOKENS } from '@vallista/design-system'

export const wrap = style({
  display: 'flex',
  alignItems: 'center',
  width: `${DEFINE_SIDEBAR_WIDTH}px`,
  height: `${DEFINE_HEADER_HEIGHT}px`,
  padding: '0 28px',
  borderBottom: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  cursor: 'pointer',
  selectors: {
    '& > p': {
      borderBottom: '3px solid transparent',
      borderTop: '3px solid transparent',
      transition: 'border-bottom 0.2s ease'
    },
    '&:hover > p': {
      borderBottom: `3px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      padding: 0,
      borderBottom: 'none',
      width: 'auto'
    }
  }
})
