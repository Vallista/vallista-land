import { style } from '@vanilla-extract/css'

import { vars } from '../styles/theme.css'

export const footer = style({
  marginTop: '80px',
  paddingTop: '48px',
  paddingBottom: '48px',
  borderTop: `1px solid ${vars.color.line2}`,
  backgroundColor: vars.color.bgSoft
})

export const inner = style({
  maxWidth: '880px',
  margin: '0 auto',
  padding: '0 32px',
  '@media': {
    '(max-width: 720px)': {
      padding: '0 20px'
    }
  }
})

export const groups = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '32px',
  paddingBottom: '32px',
  borderBottom: `1px solid ${vars.color.line2}`,
  '@media': {
    '(max-width: 480px)': {
      gridTemplateColumns: '1fr'
    }
  }
})

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
})

export const groupTitle = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  margin: 0
})

export const link = style({
  fontSize: '14px',
  lineHeight: 1.5,
  color: vars.color.ink2,
  textDecoration: 'none',
  transition: `color ${vars.duration.fast} ${vars.easing.out}`,
  selectors: {
    '&:hover': { color: vars.color.accent }
  }
})

export const bottom = style({
  paddingTop: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  textAlign: 'center'
})

export const copy = style({
  margin: 0,
  fontSize: '12px',
  color: vars.color.ink4
})

export const copyLink = style({
  color: vars.color.ink3,
  textDecoration: 'none',
  selectors: {
    '&:hover': { color: vars.color.accent }
  }
})
