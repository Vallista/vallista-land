import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'

export const container = style({
  padding: '20px',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_50,
  borderRadius: '12px',
  border: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`
})

export const title = style({
  marginBottom: '16px'
})

export const tagGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
})

export const tagButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  backgroundColor: COLOR_TOKENS.PRIMARY.WHITE,
  border: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_300}`,
  borderRadius: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: COLOR_TOKENS.PRIMARY.GRAY_700,
  opacity: 0.8,
  fontSize: 'var(--tag-size, 1rem)',

  ':hover': {
    backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_100,
    borderColor: COLOR_TOKENS.PRIMARY.GRAY_400,
    transform: 'translateY(-1px)',
    opacity: 1
  }
})

export const selected = style({
  backgroundColor: COLOR_TOKENS.HIGHLIGHT.RED,
  borderColor: COLOR_TOKENS.HIGHLIGHT.RED,
  color: COLOR_TOKENS.PRIMARY.WHITE,

  ':hover': {
    backgroundColor: COLOR_TOKENS.HIGHLIGHT.RED,
    borderColor: COLOR_TOKENS.HIGHLIGHT.RED,
    opacity: 0.9
  }
})

export const count = style({
  fontSize: '0.75rem',
  opacity: 0.7,
  fontWeight: 500
})
