import { COLOR_TOKENS } from '@vallista/design-system'
import { style } from '@vanilla-extract/css'

import { DEFINE_HEADER_HEIGHT, DEFINE_SAFE_SCROLL_WIDTH, DEFINE_SIDEBAR_WIDTH } from '../../constants/layout'
import { responsive } from '../../styles/breakpoints'

// ============================================================================
// Header Container
// ============================================================================
const desktopContainerStyles = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: `calc(100vw - ${DEFINE_SAFE_SCROLL_WIDTH}px)`,
  height: `${DEFINE_HEADER_HEIGHT}px`,
  boxSizing: 'border-box' as const,
  zIndex: 10,
  background: 'hsla(47, 33%, 89%, 0)',
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
}

export const container = style({
  ...desktopContainerStyles,
  // iOS Safari에서 fixed 요소가 스크롤 시 함께 움직이는 문제 해결
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)',
  willChange: 'transform',
  ...responsive({
    mobile: {
      position: 'fixed' as const,
      width: '100vw !important',
      height: '80px',
      padding: '0 10px',
      top: 0,
      left: 0
    }
  })
})

// ============================================================================
// Header Wrapper
// ============================================================================
const desktopWrapperStyles = {
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  height: '100%',
  padding: '0 16px 0 40px'
}

export const wrapper = style({
  ...desktopWrapperStyles,
  ...responsive({
    mobile: {
      alignItems: 'flex-start',
      padding: '10px 12px'
    }
  })
})

// ============================================================================
// Header Wrap (Logo Container)
// ============================================================================
const desktopWrapStyles = {
  display: 'flex' as const,
  alignItems: 'center' as const,
  padding: '0 16px',
  cursor: 'pointer' as const,
  border: 'none',
  background: 'transparent'
}

export const wrap = style({
  ...desktopWrapStyles,
  ...responsive({
    mobile: {
      padding: 0
    }
  })
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

// ============================================================================
// Header Left Section - Last Child (Desktop Only)
// ============================================================================
export const leftLastChild = style({
  ...responsive({
    mobile: {
      display: 'none'
    }
  })
})

// ============================================================================
// Header Left Section - First (Sidebar Width)
// ============================================================================
export const leftFirst = style({
  width: `${DEFINE_SIDEBAR_WIDTH}px`,
  ...responsive({
    mobile: {
      // 모바일에서는 사이드바가 오버레이로 표시되므로 width 유지
    }
  })
})
