import { COLOR_TOKENS } from '@vallista/design-system'
import { style } from '@vanilla-extract/css'

import {
  DEFINE_NAVBAR_WIDTH,
  DEFINE_HEADER_HEIGHT,
  DEFINE_CONTENTS_MIN_WIDTH,
  DEFINE_ICON_SIZE
} from '@shared/constants/layout'
import { responsive, BREAKPOINTS } from '@shared/styles/breakpoints'

// ============================================================================
// NavBar Container
// ============================================================================
const commonContainerStyles = {
  position: 'fixed' as const,
  left: 0
}

const responsiveStyles = responsive({
  mobile: {
    top: '40px', // Header 높이만큼 아래에 위치
    height: `${DEFINE_NAVBAR_WIDTH}px`,
    minWidth: `${DEFINE_CONTENTS_MIN_WIDTH}px`,
    width: '100vw',
    padding: '0 12px 0 16px',
    background: 'transparent',
    borderRight: 'none',
    // 모바일에서 스크롤 이벤트 방지
    touchAction: 'none',
    overscrollBehavior: 'none',
    WebkitOverflowScrolling: 'auto'
  },
  desktop: {
    top: `${DEFINE_HEADER_HEIGHT}px`,
    width: `${DEFINE_NAVBAR_WIDTH}px`,
    minWidth: `${DEFINE_NAVBAR_WIDTH}px`,
    height: '100vh',
    borderRight: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
    background: COLOR_TOKENS.PRIMARY.WHITE
  }
})

export const container = style({
  boxSizing: 'border-box' as const,
  // 테마 전환 시 색상 변경을 빠르게 하기 위해 명시적 transition 설정
  transition: 'background-color 0.08s ease, border-color 0.08s ease, color 0.08s ease',
  zIndex: 11,
  // iOS Safari에서 fixed 요소가 스크롤 시 함께 움직이는 문제 해결
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)',
  willChange: 'transform',
  ...commonContainerStyles,
  '@media': {
    ...responsiveStyles['@media'],
    '(prefers-reduced-motion: reduce)': {
      transition: 'none'
    }
  }
})

// ============================================================================
// NavBar Section
// ============================================================================
export const section = style({
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  ...responsive({
    mobile: {
      flexDirection: 'row',
      height: `${DEFINE_NAVBAR_WIDTH}px`
    },
    desktop: {
      flexDirection: 'column' as const,
      height: `calc(100vh - ${DEFINE_HEADER_HEIGHT}px)`
    }
  })
})

// ============================================================================
// NavBar Wrapper
// ============================================================================
export const wrapper = style({
  display: 'flex' as const,
  ...responsive({
    mobile: {
      flexDirection: 'row'
    },
    desktop: {
      flexDirection: 'column' as const,
      selectors: {
        '&:last-of-type': {
          justifyContent: 'flex-end'
        }
      }
    }
  })
})

// category 스타일은 NavButton으로 대체됨

export const categoryIcon = style({
  width: `${DEFINE_ICON_SIZE}px`,
  height: `${DEFINE_ICON_SIZE}px`
})

// ============================================================================
// Category Active Indicator
// ============================================================================
const activeIndicatorBase = {
  content: "''",
  position: 'absolute' as const,
  background: COLOR_TOKENS.HIGHLIGHT.RED
}

export const categoryActive = style({
  position: 'relative',
  '@media': {
    [`screen and (max-width: ${BREAKPOINTS.MOBILE_MAX})`]: {
      selectors: {
        '&::after': {
          ...activeIndicatorBase,
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px'
        }
      }
    },
    [`screen and (min-width: ${BREAKPOINTS.DESKTOP_MIN})`]: {
      selectors: {
        '&::before': {
          ...activeIndicatorBase,
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px'
        }
      }
    }
  }
})
