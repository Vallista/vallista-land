import { style } from '@vanilla-extract/css'
import { DEFINE_SIDEBAR_LEFT_POSITION, DEFINE_SIDEBAR_WIDTH } from './utils'
import { DEFINE_HEADER_HEIGHT } from '../Header/utils'
import { DEFINE_NAVBAR_ITEM_HEIGHT } from '../NavBar/utils'

export const wrap = style({
  position: 'fixed',
  top: `${DEFINE_HEADER_HEIGHT}px`,
  left: `${DEFINE_SIDEBAR_LEFT_POSITION}px`,
  width: `${DEFINE_SIDEBAR_WIDTH}px`,
  height: '100vh',
  transform: 'translate3d(0, 0, 1)',
  boxSizing: 'border-box',
  zIndex: 10,

  '@media': {
    'screen and (max-width: 1024px)': {
      width: '100vw',
      left: 0,
      background: 'hsla(47, 33%, 89%, 0)',
      backdropFilter: 'blur(10px)',
      top: `${DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_ITEM_HEIGHT}px`,
      height: `calc((var(--vh, 1vh) * 100) - ${DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_ITEM_HEIGHT}px)`
    }
  }
})

export const wrapFolded = style({
  position: 'fixed',
  top: `${DEFINE_HEADER_HEIGHT}px`,
  left: `-${DEFINE_SIDEBAR_WIDTH}px`,
  width: `${DEFINE_SIDEBAR_WIDTH}px`,
  height: '100vh',
  transform: 'translate3d(0, 0, 1)',
  boxSizing: 'border-box',
  zIndex: 10,

  selectors: {
    '& > div:first-of-type': {
      left: `-${DEFINE_SIDEBAR_WIDTH}px`
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      width: '100vw',
      left: 0,
      background: 'hsla(47, 33%, 89%, 0)',
      backdropFilter: 'blur(10px)',
      top: `${DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_ITEM_HEIGHT}px`,
      height: `calc((var(--vh, 1vh) * 100) - ${DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_ITEM_HEIGHT}px)`
    }
  }
})

export const wrapHidden = style({
  '@media': {
    'screen and (max-width: 1024px)': {
      display: 'none'
    }
  }
})
