import { style } from '@vanilla-extract/css'
import { DEFINE_NAVBAR_ITEM_HEIGHT, DEFINE_NAVBAR_ITEM_WIDTH, DEFINE_NAVBAR_WIDTH } from './utils'
import { DEFINE_HEADER_HEIGHT } from '../Header/utils'
import { DEFINE_CONTENTS_MIN_WIDTH, DEFINE_ICON_SIZE } from '@/utils/constant'
import { COLOR_TOKENS } from '@vallista/design-system'

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
      top: `${DEFINE_HEADER_HEIGHT - 1}px`,
      height: `${DEFINE_NAVBAR_WIDTH}px`,
      minWidth: `${DEFINE_CONTENTS_MIN_WIDTH}px`,
      width: '100vw',
      padding: '0 6px 0 18px',
      borderRight: 'none',
      borderBottom: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
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

export const category = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
  height: `${DEFINE_NAVBAR_ITEM_HEIGHT}px`,
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  textDecoration: 'none',
  outline: 'none',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  selectors: {
    '& > svg': {
      width: `${DEFINE_ICON_SIZE}px`,
      height: `${DEFINE_ICON_SIZE}px`
    },
    '&:hover': {
      background: COLOR_TOKENS.PRIMARY.GRAY_50
    },
    '&:focus': {
      outline: `2px solid ${COLOR_TOKENS.PRIMARY.GRAY_500}`
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
      height: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
      selectors: {
        '& > figure': {
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          overflow: 'hidden'
        },
        '& > svg': {
          width: `${DEFINE_ICON_SIZE}px`,
          height: `${DEFINE_ICON_SIZE}px`
        }
      }
    }
  }
})

export const categoryActive = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
  height: `${DEFINE_NAVBAR_ITEM_HEIGHT}px`,
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  textDecoration: 'none',
  outline: 'none',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  background: COLOR_TOKENS.PRIMARY.GRAY_50,
  selectors: {
    '& > svg': {
      width: `${DEFINE_ICON_SIZE}px`,
      height: `${DEFINE_ICON_SIZE}px`
    },
    '&::before': {
      content: "''",
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '4px',
      background: COLOR_TOKENS.HIGHLIGHT.RED
    }
  },
  '@media': {
    'screen and (max-width: 1024px)': {
      width: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
      height: `${DEFINE_NAVBAR_ITEM_WIDTH}px`,
      selectors: {
        '& > figure': {
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          overflow: 'hidden'
        },
        '& > svg': {
          width: `${DEFINE_ICON_SIZE}px`,
          height: `${DEFINE_ICON_SIZE}px`
        },
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
