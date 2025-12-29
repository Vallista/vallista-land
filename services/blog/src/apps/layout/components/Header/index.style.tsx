import { style } from '@vanilla-extract/css'
import { DEFINE_HEADER_HEIGHT, DEFINE_SAFE_SCROLL_WIDTH } from './utils'
import { DEFINE_NAVBAR_WIDTH } from '../NavBar/utils'
import { COLOR_TOKENS } from '@vallista/design-system'

export const container = style({
  position: 'fixed',
  top: 0,
  left: 0,
  width: `calc(100vw - ${DEFINE_SAFE_SCROLL_WIDTH}px)`,
  height: `${DEFINE_HEADER_HEIGHT}px`,
  boxSizing: 'border-box',
  zIndex: 10,
  background: 'hsla(47, 33%, 89%, 0)',
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  '@media': {
    'screen and (max-width: 1024px)': {
      width: '100vw !important',
      height: `${DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_WIDTH}px`,
      padding: '0 16px'
    }
  }
})

export const wrapper = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
})

export const wrap = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '0 12px'
})

export const left = style({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& > div:last-of-type': {
          display: 'none'
        }
      }
    }
  }
})

export const leftFirst = style({
  width: `${DEFINE_NAVBAR_WIDTH}px`,
  '@media': {
    'screen and (max-width: 1024px)': {
      display: 'none'
    }
  }
})
