import { style } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

export const wrap = style({
  maxWidth: '720px',
  margin: '0 auto',
  padding: '16px 0 120px'
})

export const hello = style({
  display: 'block',
  fontSize: '48px',
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: '-1px',
  color: vars.color.ink,
  marginBottom: '8px',
  '@media': {
    '(max-width: 720px)': {
      fontSize: '32px',
      lineHeight: 1.2
    }
  }
})

export const headline = style({
  fontSize: '48px',
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: '-1px',
  color: vars.color.ink,
  margin: '0 0 32px',
  '@media': {
    '(max-width: 720px)': {
      fontSize: '32px',
      lineHeight: 1.2
    }
  }
})

export const highlight = style({
  color: vars.color.accent
})

export const body = style({
  fontSize: '17px',
  lineHeight: 1.85,
  color: vars.color.ink2,
  margin: 0
})

export const bodyStrong = style({
  color: vars.color.ink,
  fontWeight: 600
})

export const spacer = style({
  height: '24px'
})
