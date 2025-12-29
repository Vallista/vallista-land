import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

const distanceGap = 8

// Base tooltip styles
const tooltipBase = style({
  cursor: 'default',
  maxWidth: '300px',
  minWidth: '100px',
  width: 'max-content',
  position: 'absolute',
  opacity: 0,
  transition: 'opacity 0.2s ease-in',
  textAlign: 'center',
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  zIndex: 1000,
  padding: '8px 12px',
  borderRadius: '5px',
  boxSizing: 'border-box',
  pointerEvents: 'none',
  border: '1px solid var(--primary-accent-3)', // 다크모드에서 보이도록 보더 추가
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '8px',
      height: '8px',
      background: 'inherit'
    }
  }
})

// Tooltip type variants
const tooltipType = styleVariants({
  primary: {
    color: 'var(--primary-background)',
    background: 'var(--primary-foreground)',
    selectors: {
      '&::after': {
        background: 'var(--primary-foreground)'
      }
    }
  },
  success: {
    color: 'var(--primary-background)',
    background: 'var(--success-default)',
    selectors: {
      '&::after': {
        background: 'var(--success-default)'
      }
    }
  },
  warning: {
    color: 'var(--primary-background)',
    background: 'var(--warning-default)',
    selectors: {
      '&::after': {
        background: 'var(--warning-default)'
      }
    }
  },
  error: {
    color: 'var(--primary-background)',
    background: 'var(--error-default)',
    selectors: {
      '&::after': {
        background: 'var(--error-default)'
      }
    }
  },
  secondary: {
    color: 'var(--primary-background)',
    background: 'var(--primary-accent-5)',
    selectors: {
      '&::after': {
        background: 'var(--primary-accent-5)'
      }
    }
  }
})

// Position variants
const tooltipPosition = styleVariants({
  top: {
    bottom: `calc(100% + ${distanceGap}px)`,
    left: '50%',
    transform: 'translateX(-50%)',
    selectors: {
      '&::after': {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' // 아래쪽 화살표
      }
    }
  },
  bottom: {
    top: `calc(100% + ${distanceGap}px)`,
    left: '50%',
    transform: 'translateX(-50%)',
    selectors: {
      '&::after': {
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' // 위쪽 화살표
      }
    }
  },
  left: {
    right: `calc(100% + ${distanceGap}px)`,
    top: '50%',
    transform: 'translateY(-50%)',
    selectors: {
      '&::after': {
        left: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        clipPath: 'polygon(0% 0%, 0% 100%, 100% 50%)' // 오른쪽 화살표
      }
    }
  },
  right: {
    left: `calc(100% + ${distanceGap}px)`,
    top: '50%',
    transform: 'translateY(-50%)',
    selectors: {
      '&::after': {
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)' // 왼쪽 화살표
      }
    }
  }
})

// Visible state
const tooltipVisible = style({
  opacity: 1
})

export const tooltip = recipe({
  base: tooltipBase,
  variants: {
    type: tooltipType,
    position: tooltipPosition,
    visible: {
      true: tooltipVisible
    }
  },
  defaultVariants: {
    type: 'primary',
    position: 'top'
  }
})

export type TooltipVariants = RecipeVariants<typeof tooltip>
