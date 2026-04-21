import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 8px',
  borderRadius: vars.radius.pill,
  fontFamily: vars.font.sans,
  fontWeight: 500,
  fontSize: '11px',
  lineHeight: 1,
  letterSpacing: '0.01em',
  textDecoration: 'none',
  whiteSpace: 'nowrap'
})

export const tone = styleVariants({
  neutral: {
    backgroundColor: vars.color.line2,
    color: vars.color.ink3
  },
  blue: {
    backgroundColor: vars.color.accentTint,
    color: vars.color.accentHover
  },
  green: {
    backgroundColor: vars.color.statusGreenBg,
    color: vars.color.statusGreenFg
  },
  amber: {
    backgroundColor: vars.color.statusAmberBg,
    color: vars.color.statusAmberFg
  },
  red: {
    backgroundColor: vars.color.statusRedBg,
    color: vars.color.statusRedFg
  }
})

export const dot = style({
  '::before': {
    content: '""',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    display: 'inline-block'
  }
})
