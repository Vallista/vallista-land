import { style } from '@vanilla-extract/css'
import { DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT, DEFINE_SIDEBAR_WIDTH } from '../utils'
import { DEFINE_NAVBAR_ITEM_HEIGHT } from '../../NavBar/utils'
import { DEFINE_HEADER_HEIGHT } from '../../Header/utils'
import { COLOR_TOKENS } from '@vallista/design-system'

export const wrap = style({
  height: '100%',
  borderRight: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
})

const TOP_BLANK = DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT + DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_ITEM_HEIGHT

export const listWrap = style({
  boxSizing: 'border-box',
  width: `${DEFINE_SIDEBAR_WIDTH}px`,
  height: `calc(100vh - ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT + DEFINE_HEADER_HEIGHT}px)`,
  padding: '16px 24px 32px',
  '@media': {
    'screen and (min-width: 1025px)': {
      overflowX: 'hidden',
      overflowY: 'hidden',
      selectors: {
        '&:hover': {
          overflowY: 'auto'
        },
        '&:hover > div:last-of-type': {
          marginRight: 0
        }
      }
    },
    'screen and (max-width: 1024px)': {
      width: '100%',
      height: `calc(100vh - ${TOP_BLANK}px)`,
      left: `-${DEFINE_SIDEBAR_WIDTH}px`,
      cursor: 'pointer',
      overflowY: 'scroll',
      touchAction: 'pan-y',
      WebkitOverflowScrolling: 'touch',
      overflowX: 'hidden',
      selectors: {
        '& > div:first-of-type': {
          left: `-${DEFINE_SIDEBAR_WIDTH}px`
        }
      }
    }
  }
})

export const padding = style({})

export const menuWrap = style({
  width: '100%'
})

export const headerWrap = style({
  display: 'flex',
  flexDirection: 'column',
  '@media': {
    'screen and (max-width: 1024px)': {
      left: `-${DEFINE_SIDEBAR_WIDTH}px`,
      selectors: {
        '& > div:first-of-type': {
          left: `-${DEFINE_SIDEBAR_WIDTH}px`
        }
      }
    }
  }
})

export const emptyWrap = style({
  width: `${DEFINE_SIDEBAR_WIDTH}px`,
  height: `calc(100vh - ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT + DEFINE_HEADER_HEIGHT}px)`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '@media': {
    'screen and (min-width: 1025px)': {
      paddingBottom: '120px',
      minHeight: '500px'
    },
    'screen and (max-width: 1024px)': {
      width: '100vw',
      height: `calc((var(--vh, 1vh) * 100) - ${DEFINE_NAVBAR_ITEM_HEIGHT + DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT + DEFINE_HEADER_HEIGHT}px)`
    }
  }
})

export const emptyContents = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px'
})
