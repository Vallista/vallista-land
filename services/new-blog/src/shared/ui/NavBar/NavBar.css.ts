import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'
import {
  DEFINE_NAVBAR_WIDTH,
  DEFINE_HEADER_HEIGHT,
  DEFINE_CONTENTS_MIN_WIDTH,
  DEFINE_ICON_SIZE
} from '@shared/constants/layout'

export const container = style({
  position: 'fixed',
  boxSizing: 'border-box',
  top: `${DEFINE_HEADER_HEIGHT}px`,
  left: 0,
  width: `${DEFINE_NAVBAR_WIDTH}px`,
  minWidth: `${DEFINE_NAVBAR_WIDTH}px`,
  height: '100vh',
  borderRight: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  zIndex: 11,
  background: COLOR_TOKENS.PRIMARY.WHITE,
  '@media': {
    'screen and (max-width: 1024px)': {
      top: `${DEFINE_NAVBAR_WIDTH - 1}px`,
      height: `${DEFINE_NAVBAR_WIDTH}px`,
      minWidth: `${DEFINE_CONTENTS_MIN_WIDTH}px`,
      width: '100vw',
      padding: '0 12px 0 16px',
      borderRight: 'none',
      background: 'transparent'
    },
    '(prefers-reduced-motion: reduce)': {
      transition: 'none'
    }
  }
})

export const section = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  '@media': {
    'screen and (min-width: 1025px)': {
      flexDirection: 'column',
      height: `calc(100vh - ${DEFINE_HEADER_HEIGHT}px)`
    },
    'screen and (max-width: 1024px)': {
      flexDirection: 'row',
      height: `${DEFINE_NAVBAR_WIDTH}px`
    }
  }
})

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  selectors: {
    '&:last-of-type': {
      justifyContent: 'flex-end'
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      flexDirection: 'row'
    }
  }
})

// category 스타일은 NavButton으로 대체됨

export const categoryIcon = style({
  width: `${DEFINE_ICON_SIZE}px`,
  height: `${DEFINE_ICON_SIZE}px`
})

export const categoryActive = style({
  position: 'relative',
  '@media': {
    'screen and (min-width: 1025px)': {
      selectors: {
        '&::before': {
          content: "''",
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: COLOR_TOKENS.HIGHLIGHT.RED
        }
      }
    },
    'screen and (max-width: 1024px)': {
      selectors: {
        '&::after': {
          content: "''",
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: COLOR_TOKENS.HIGHLIGHT.RED
        }
      }
    }
  }
})
