import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { primaryAccent4 } from '../../../theme/colors.css'

import {
  FadeIn,
  FadeInMobile,
  FadeInWithDown,
  FadeOut,
  FadeOutMobile,
  FadeOutWithUp,
  SlideBottomUp,
  SlideTopDown
} from './Modal.animation.css'

const animationOption = '0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards'

export const modalWrap = style({
  // visibility: hidden when idle is handled by conditional rendering
})

export const modalBackdrop = recipe({
  base: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    height: 'calc(var(--vh, 1vh) * 100)',
    width: '100%',
    opacity: 0,
    pointerEvents: 'none',
    animation: 'none',
    zIndex: 'var(--layer-modal-backdrop)',
    backgroundColor: primaryAccent4
  },
  variants: {
    hasClickOutside: {
      true: {
        pointerEvents: 'all'
      }
    },
    animationState: {
      idle: {
        top: 'calc(-1 * var(--layer-conceal) * 1px)',
        left: 'calc(-1 * var(--layer-conceal) * 1px)'
      },
      start: {
        animation: `${FadeIn} ${animationOption}`,
        '@media': {
          '(max-width: 600px)': {
            animation: `${FadeInMobile} ${animationOption}`
          }
        }
      },
      end: {
        animation: `${FadeOut} ${animationOption}`,
        '@media': {
          '(max-width: 600px)': {
            animation: `${FadeOutMobile} ${animationOption}`
          }
        }
      }
    }
  }
})

export const modalContainer = recipe({
  base: {
    position: 'fixed',
    left: 0,
    width: '100vw',
    animation: 'none',
    zIndex: 'var(--layer-modal)',
    overflow: 'auto',
    border: 'none',
    outline: 'none',
    '@media': {
      '(min-width: 601px)': {
        top: 0,
        width: '100vw',
        height: 'calc(var(--vh, 1vh) * 100)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      },
      '(max-width: 600px)': {
        bottom: 0
      }
    }
  },
  variants: {
    animationState: {
      idle: {
        top: 'calc(-1 * var(--layer-conceal) * 1px)',
        left: 'calc(-1 * var(--layer-conceal) * 1px)'
      },
      start: {
        transform: 'translate3d(0, 100%, 0)',
        animation: `${FadeInWithDown} ${animationOption}`,
        '@media': {
          '(max-width: 600px)': {
            animation: `${SlideBottomUp} ${animationOption}`
          }
        }
      },
      end: {
        animation: `${FadeOutWithUp} ${animationOption}`,
        '@media': {
          '(max-width: 600px)': {
            animation: `${SlideTopDown} ${animationOption}`
          }
        }
      }
    }
  }
})

export const modalWrapper = style({
  width: '420px',
  height: 'auto',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  overflowY: 'auto',
  outline: 'none',
  boxShadow: 'var(--shadow-large)',
  backgroundColor: 'var(--primary-background)',
  color: 'var(--primary-foreground)',
  border: '1px solid var(--primary-accent-3)',
  '@media': {
    '(max-width: 600px)': {
      width: '100%',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    }
  }
})

export const modalContainerInner = style({
  outline: 0
})

// 새로운 Modal 컴포넌트를 위한 스타일
export const modalOverlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)'
})

export const modalContent = style({
  backgroundColor: 'var(--primary-background)',
  color: 'var(--primary-foreground)',
  borderRadius: '8px',
  padding: '20px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  border: '1px solid var(--primary-accent-3)',
  backdropFilter: 'blur(8px)',
  background: 'var(--primary-background)'
})

export const modalCloseButton = style({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  color: 'var(--primary-foreground)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s ease',
  selectors: {
    '&:hover': {
      backgroundColor: 'var(--primary-accent-2)'
    }
  }
})
