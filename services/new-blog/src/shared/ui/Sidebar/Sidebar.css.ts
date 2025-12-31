import { COLOR_TOKENS } from '@vallista/design-system'
import { style } from '@vanilla-extract/css'

import { DEFINE_SIDEBAR_LEFT_POSITION, DEFINE_SIDEBAR_WIDTH, DEFINE_HEADER_HEIGHT } from '@shared/constants/layout'
import { responsive } from '@shared/styles/breakpoints'

// ============================================================================
// Sidebar Base Styles
// ============================================================================
const desktopBaseStyles = {
  position: 'fixed' as const,
  zIndex: 10,
  transform: 'translate3d(0, 0, 1)',
  boxSizing: 'border-box' as const,
  height: `calc(100vh - ${DEFINE_HEADER_HEIGHT}px)`,
  // 테마 전환 시 색상 변경을 빠르게 하기 위해 명시적 transition 설정
  transition: 'left 0.15s ease, background-color 0.08s ease, color 0.08s ease, border-color 0.08s ease'
}

export const base = style({
  ...desktopBaseStyles,
  ...responsive({
    mobile: {
      height: 'calc(100vh - 80px)'
    }
  })
})

// ============================================================================
// Sidebar Wrap (Desktop - Open)
// ============================================================================
export const wrap = style({
  top: `${DEFINE_HEADER_HEIGHT}px`,
  left: `${DEFINE_SIDEBAR_LEFT_POSITION}px`,
  width: `${DEFINE_SIDEBAR_WIDTH}px`
})

// ============================================================================
// Sidebar Wrap (Desktop - Folded)
// ============================================================================
export const wrapFolded = style({
  top: `${DEFINE_HEADER_HEIGHT}px`,
  left: `-${DEFINE_SIDEBAR_WIDTH}px`,
  width: `${DEFINE_SIDEBAR_WIDTH}px`
})

// ============================================================================
// Sidebar Visible (Mobile - Overlay)
// ============================================================================
const mobileVisibleStyles = {
  width: '100vw',
  top: `${DEFINE_HEADER_HEIGHT + 20}px`,
  height: `calc(100vh - ${DEFINE_HEADER_HEIGHT + 20}px)`,
  left: 0,
  background: 'hsla(47, 33%, 89%, 0)',
  backdropFilter: 'blur(10px)'
}

export const visible = style({
  ...responsive({
    mobile: mobileVisibleStyles
  })
})

export const invisible = style({
  display: 'none'
})

export const content = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  borderRight: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  // 테마 전환 시 border 색상 변경을 빠르게
  transition: 'border-color 0.08s ease'
})

export const header = style({
  padding: '12px 16px',
  flexShrink: 0,
  marginBottom: '0'
})

export const searchContainer = style({
  flexShrink: 0,
  marginBottom: '16px'
})

export const list = style({
  flex: 1,
  overflowY: 'scroll',
  minHeight: 0,
  scrollbarWidth: 'thin',
  selectors: {
    '&::-webkit-scrollbar': {
      width: '8px'
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      background: COLOR_TOKENS.PRIMARY.GRAY_300,
      borderRadius: '4px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: COLOR_TOKENS.PRIMARY.GRAY_500
    }
  }
})

export const item = style({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 16px',
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'inherit',
  // 테마 전환 시 색상 변경을 빠르게
  transition: 'background-color 0.08s ease, color 0.08s ease',
  overflow: 'hidden',
  gap: '8px',
  selectors: {
    '&:hover': {
      backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50
    },
    '&:last-of-type': {
      marginBottom: '32px'
    }
  }
})

export const itemActive = style({
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50,
  position: 'relative',
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
})

export const itemText = style({
  display: 'block',
  width: '100%',
  fontSize: '14px',
  lineHeight: '1.4',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  // 테마 전환 시 색상 변경을 빠르게
  transition: 'color 0.08s ease',
  selectors: {
    [`${itemActive} &`]: {
      color: COLOR_TOKENS.HIGHLIGHT.PINK
    }
  }
})

export const itemIcon = style({
  flexShrink: 0,
  width: '16px',
  height: '16px',
  color: COLOR_TOKENS.PRIMARY.GRAY_400,
  // 테마 전환 시 색상 변경을 빠르게
  transition: 'color 0.08s ease',
  selectors: {
    [`${itemActive} &`]: {
      color: COLOR_TOKENS.HIGHLIGHT.PINK
    }
  }
})
