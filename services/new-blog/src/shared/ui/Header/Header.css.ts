import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'
import { DEFINE_HEADER_HEIGHT, DEFINE_SAFE_SCROLL_WIDTH, DEFINE_SIDEBAR_WIDTH } from '../../constants/layout'

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
      height: '80px',
      padding: '0 10px'
    }
  }
})

export const wrapper = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: '100%',
  padding: '0 16px 0 40px',
  '@media': {
    'screen and (max-width: 1024px)': {
      alignItems: 'flex-start',
      padding: '10px 12px'
    }
  }
})

export const wrap = style({
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  '@media': {
    'screen and (max-width: 1024px)': {
      padding: 0
    }
  }
})

export const sidebarToggle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  borderRadius: '4px',
  transition: 'all 0.2s ease'
})

export const defaultIcon = style({
  color: COLOR_TOKENS.PRIMARY.GRAY_400,
  transition: 'color 0.2s ease',
  selectors: {
    [`${sidebarToggle}:hover &`]: {
      color: COLOR_TOKENS.PRIMARY.GRAY_600
    }
  }
})

export const activeIcon = style({
  color: COLOR_TOKENS.HIGHLIGHT.PINK,
  transition: 'color 0.2s ease',
  selectors: {
    [`${sidebarToggle}:hover &`]: {
      color: COLOR_TOKENS.HIGHLIGHT.RED
    }
  }
})

export const logoText = style({
  borderBottom: '3px solid transparent',
  borderTop: '3px solid transparent',
  transition: 'border-bottom 0.2s ease',
  selectors: {
    [`${wrap}:hover &`]: {
      borderBottom: `3px solid ${COLOR_TOKENS.HIGHLIGHT.RED}`
    }
  }
})

export const left = style({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center'
})

export const leftLastChild = style({
  '@media': {
    'screen and (max-width: 1024px)': {
      display: 'none'
    }
  }
})

export const leftFirst = style({
  width: `${DEFINE_SIDEBAR_WIDTH}px`,
  '@media': {
    'screen and (max-width: 1024px)': {
      // display: 'none'
    }
  }
})
