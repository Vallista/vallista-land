import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const kbd = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 6px',
  borderRadius: vars.radius['2'],
  backgroundColor: vars.color.bgSoft,
  border: `1px solid ${vars.color.line2}`,
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  color: vars.color.ink3
})
