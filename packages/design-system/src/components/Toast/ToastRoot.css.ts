import { style } from '@vanilla-extract/css'

export const toastRootLayer = style({
  position: 'fixed',
  left: '50%',
  bottom: '1.5rem',
  transform: 'translateX(-50%)',
  maxWidth: '420px',
  transition: 'all 0.4s ease',
  zIndex: 1000,
  '@media': {
    '(max-width: 440px)': {
      maxWidth: '90vw',
      left: '5vw',
      right: '5vw',
      transform: 'none'
    }
  },
  selectors: {
    '&:hover': {
      transform: 'translate3d(0, -10px, 0) translateX(-50%)'
    }
  }
})

// 개별 토스트 아이템을 위한 스타일
export const toastItem = style({
  position: 'relative',
  selectors: {
    '&:not(:first-of-type)::after': {
      content: "''",
      position: 'absolute',
      left: 0,
      right: 0,
      top: 'calc(100% + 1px)',
      width: '100%',
      height: '20px',
      background: 'transparent'
    }
  }
})

// 토스트 스택 제한을 위한 스타일
export const toastStackLimit = style({
  selectors: {
    '&:nth-last-of-type(n + 4)': {
      opacity: '0 !important',
      pointerEvents: 'none'
    }
  }
})
