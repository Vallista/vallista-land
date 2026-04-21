import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '20px',
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.line2}`,
  borderRadius: vars.radius['5'],
  textDecoration: 'none',
  color: 'inherit',
  boxShadow: vars.elevation['1'],
  transitionProperty: 'border-color, box-shadow, transform',
  transitionDuration: vars.duration.base,
  transitionTimingFunction: vars.easing.out,
  selectors: {
    '&:hover': {
      borderColor: vars.color.line,
      boxShadow: vars.elevation['2'],
      transform: 'translateY(-1px)'
    }
  }
})

export const meta = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  letterSpacing: '0.04em'
})

export const title = style({
  fontFamily: vars.font.sans,
  fontSize: '19px',
  fontWeight: 600,
  lineHeight: 1.3,
  letterSpacing: '-0.005em',
  color: vars.color.ink,
  margin: 0
})

export const description = style({
  fontSize: '13px',
  lineHeight: 1.6,
  color: vars.color.ink2,
  margin: 0
})

export const chipRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: 'auto'
})

export const projectTag = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.ink4
})

export const footer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto'
})

export const stars = style({
  fontFamily: vars.font.mono,
  fontSize: '12px',
  color: vars.color.ink3
})
