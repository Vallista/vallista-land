import { style } from '@vanilla-extract/css'
import { vars } from '@vallista/ui'

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '24px',
  marginBottom: '48px',
  '@media': {
    '(max-width: 720px)': {
      flexDirection: 'column',
      alignItems: 'stretch'
    }
  }
})

export const title = style({
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  color: vars.color.ink,
  margin: 0
})

export const searchSlot = style({
  width: '280px',
  flexShrink: 0,
  '@media': {
    '(max-width: 720px)': {
      width: '100%'
    }
  }
})

export const section = style({
  marginBottom: '64px'
})

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px'
})

export const sectionTitle = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.ink4,
  margin: 0
})

export const featuredGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: '32px',
  alignItems: 'stretch',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr'
    }
  }
})

export const featuredMeta = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '16px'
})

export const featuredMetaRow = style({
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
})

export const featuredTitle = style({
  fontSize: '26px',
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: '-0.3px',
  color: vars.color.ink,
  margin: 0
})

export const featuredDek = style({
  fontSize: '15.5px',
  lineHeight: 1.7,
  color: vars.color.ink2
})

export const listGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '20px',
  '@media': {
    '(max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '24px'
    },
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
      gap: '20px'
    }
  }
})

export const bottomLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '24px',
  fontFamily: vars.font.sans,
  fontSize: '13px',
  fontWeight: 500,
  color: vars.color.accent,
  textDecoration: 'none',
  selectors: {
    '&:hover': { color: vars.color.accentHover }
  }
})
