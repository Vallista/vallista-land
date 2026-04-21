import { styleVariants, style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const btn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  borderRadius: vars.radius['3'],
  fontFamily: vars.font.sans,
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'none',
  border: '1px solid transparent',
  transitionProperty: 'background-color, border-color, color, transform',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:active': { transform: 'translateY(1px)' },
    '&[aria-disabled="true"]': {
      opacity: 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none'
    }
  }
})

export const variant = styleVariants({
  primary: {
    backgroundColor: vars.color.ink,
    color: vars.color.bg,
    selectors: {
      '&:hover:not([aria-disabled="true"])': {
        backgroundColor: vars.color.ink2
      }
    }
  },
  secondary: {
    backgroundColor: vars.color.bg,
    color: vars.color.ink2,
    borderColor: vars.color.line,
    selectors: {
      '&:hover:not([aria-disabled="true"])': {
        borderColor: vars.color.ink3,
        color: vars.color.ink
      }
    }
  },
  ghost: {
    backgroundColor: 'transparent',
    color: vars.color.ink3,
    selectors: {
      '&:hover:not([aria-disabled="true"])': {
        backgroundColor: vars.color.bgSoft,
        color: vars.color.ink2
      }
    }
  }
})

export const size = styleVariants({
  sm: { padding: '6px 12px', fontSize: '12px', minHeight: '28px' },
  md: { padding: '10px 18px', fontSize: '13px', minHeight: '36px' },
  lg: { padding: '14px 22px', fontSize: '14px', minHeight: '46px' }
})
