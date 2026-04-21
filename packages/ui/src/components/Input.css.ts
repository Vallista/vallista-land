import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const wrap = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%'
})

export const input = style({
  width: '100%',
  padding: '10px 14px',
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius['3'],
  fontFamily: vars.font.sans,
  fontSize: '14px',
  lineHeight: 1.4,
  color: vars.color.ink,
  transitionProperty: 'border-color, box-shadow',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&::placeholder': { color: vars.color.ink4 },
    '&:focus-visible': {
      outline: 'none',
      borderColor: vars.color.accent,
      boxShadow: '0 0 0 3px rgba(43,108,255,0.18)'
    },
    '&[aria-invalid="true"]': {
      borderColor: vars.color.statusRedFg
    }
  }
})

export const withLeadingIcon = style({
  paddingLeft: '38px'
})

export const withTrailingHint = style({
  paddingRight: '50px'
})

export const leadingIcon = style({
  position: 'absolute',
  left: '14px',
  display: 'inline-flex',
  alignItems: 'center',
  color: vars.color.ink4,
  pointerEvents: 'none'
})

export const trailingHint = style({
  position: 'absolute',
  right: '10px',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 6px',
  borderRadius: vars.radius['2'],
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`,
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  color: vars.color.ink3,
  pointerEvents: 'none'
})
