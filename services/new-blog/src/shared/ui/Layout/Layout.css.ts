import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'
import { DEFINE_SIDEBAR_WIDTH, DEFINE_NAVBAR_WIDTH } from '../../constants/layout'

export const wrapper = style({
  minHeight: '100vh',
  '@media': {
    'screen and (max-width: 1024px)': {
      width: '100%'
    }
  }
})

export const container = style({
  '@media': {
    'screen and (max-width: 1024px)': {
      width: '100%',
      marginLeft: 0,
      height: 'auto'
    }
  }
})

export const main = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  width: `calc(100vw - ${DEFINE_NAVBAR_WIDTH + DEFINE_SIDEBAR_WIDTH}px)`,
  height: '100vh',
  marginLeft: `${DEFINE_NAVBAR_WIDTH + DEFINE_SIDEBAR_WIDTH}px`,
  overflowY: 'scroll',
  WebkitOverflowScrolling: 'touch'
})

export const mainFolded = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  width: `calc(100vw - ${DEFINE_NAVBAR_WIDTH}px)`,
  height: '100vh',
  marginLeft: `${DEFINE_NAVBAR_WIDTH}px`,
  overflowY: 'scroll',
  WebkitOverflowScrolling: 'touch'
})

export const article = style({
  boxSizing: 'border-box',
  margin: '0 auto',
  width: '100%',
  '@media': {
    'screen and (max-width: 1025px)': {
      width: '100%'
    }
  }
})

export const articleLink = style({
  cursor: 'pointer',
  borderBottom: `2px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`,
  fontWeight: 600,
  textDecoration: 'none',
  color: COLOR_TOKENS.PRIMARY.BLACK,
  transition: 'all 0.1s ease-out'
})
