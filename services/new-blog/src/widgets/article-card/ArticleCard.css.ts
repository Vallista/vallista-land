import { style } from '@vanilla-extract/css'
import { vars } from '@vallista/design-system'

export const card = style({
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
  padding: vars.space[6],
  border: `1px solid ${vars.colors.gray[200]}`,
  borderRadius: vars.radii.lg,
  backgroundColor: vars.colors.background,
  transition: 'all 0.2s ease',

  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: vars.shadows.lg,
    borderColor: vars.colors.gray[300]
  }
})

export const imageContainer = style({
  marginBottom: vars.space[4],
  borderRadius: vars.radii.md,
  overflow: 'hidden'
})

export const image = style({
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  transition: 'transform 0.2s ease',

  selectors: {
    [`${card}:hover &`]: {
      transform: 'scale(1.05)'
    }
  }
})

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[3]
})

export const meta = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3]
})

export const title = style({
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
})

export const description = style({
  lineHeight: 1.6,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
})

export const tags = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  flexWrap: 'wrap'
})
