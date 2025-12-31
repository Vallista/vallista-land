import { vars } from '@vallista/design-system'
import { style } from '@vanilla-extract/css'

export const container = style({
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto'
})

export const title = style({
  marginBottom: vars.space[6]
})

export const commentsWrapper = style({
  position: 'relative',
  minHeight: '200px'
})

export const comments = style({
  width: '100%'
})

export const iframe = style({
  width: '100% !important',
  border: 'none !important',
  borderRadius: vars.radii.md
})

export const loading = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  zIndex: 1
})

export const error = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  zIndex: 1
})
