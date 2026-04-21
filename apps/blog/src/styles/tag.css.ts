import { style } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

export const breadcrumb = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  letterSpacing: '0.08em',
  marginBottom: '16px'
})

export const tagTitle = style({
  fontSize: '44px',
  fontWeight: 700,
  color: vars.color.accent,
  margin: '0 0 12px',
  letterSpacing: '-0.8px'
})

export const tagCount = style({
  fontFamily: vars.font.mono,
  fontSize: '13px',
  color: vars.color.ink4
})

export const relatedRow = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  margin: '24px 0 40px'
})

export const articleList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0
})

export const articleItem = style({
  display: 'grid',
  gridTemplateColumns: '100px 1fr 80px',
  gap: '20px',
  alignItems: 'baseline',
  padding: '16px 0',
  borderBottom: `1px solid ${vars.color.line2}`,
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
      gap: '4px'
    }
  }
})

export const articleDate = style({
  fontFamily: vars.font.mono,
  fontSize: '12px',
  color: vars.color.ink4
})

export const articleTitle = style({
  fontSize: '16px',
  fontWeight: 500,
  color: vars.color.ink,
  textDecoration: 'none',
  selectors: {
    '&:hover': { color: vars.color.accent }
  }
})

export const articleMinutes = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.ink4,
  textAlign: 'right',
  '@media': {
    '(max-width: 720px)': {
      textAlign: 'left'
    }
  }
})

export const empty = style({
  padding: '48px 0',
  color: vars.color.ink3,
  textAlign: 'center',
  fontSize: '15px'
})

export const tagsGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px'
})
