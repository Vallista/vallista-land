import { style } from '@vanilla-extract/css'

export const checkboxLabel = style({
  fontSize: '1em',
  display: 'flex',
  cursor: 'pointer',
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  }
})

export const checkboxLabelWithLabel = style({
  flexDirection: 'row',
  alignItems: 'center'
})

export const checkboxLabelWithoutLabel = style({
  flexDirection: 'row',
  alignItems: 'center'
})

export const checkboxLabelHover = style({
  cursor: 'pointer'
})

export const checkboxLabelFullWidth = style({
  width: '100%'
})

export const checkboxLabelDisabled = style({
  color: 'var(--primary-accent-3)',
  cursor: 'not-allowed'
})

export const checkboxCaption = style({
  color: 'var(--primary-accent-5)',
  fontSize: '0.98rem',
  fontWeight: 500,
  display: 'flex',
  maxWidth: '100%',
  marginLeft: '8px',
  cursor: 'pointer'
})

export const checkboxContent = style({
  color: 'var(--primary-accent-5)',
  fontSize: '0.98rem',
  fontWeight: 500,
  display: 'flex',
  maxWidth: '100%',
  marginLeft: '8px',
  cursor: 'pointer'
})

export const checkboxContainer = style({
  display: 'flex',
  alignItems: 'center',
  position: 'relative'
})

export const checkboxInput = style({
  position: 'absolute',
  opacity: 0,
  cursor: 'pointer',
  height: 0,
  width: 0,
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  }
})

export const checkboxBox = style({
  width: '18px',
  height: '18px',
  border: '1px solid var(--primary-accent-5)',
  borderRadius: '3px',
  transition: 'border-color 0.15s ease'
})

export const checkboxBoxHover = style({
  borderColor: 'var(--primary-foreground)'
})

export const checkboxBoxDisabled = style({
  backgroundColor: 'var(--primary-accent-1)',
  borderColor: 'var(--primary-accent-3)'
})

export const checkboxBoxChecked = style({
  backgroundColor: 'var(--primary-foreground)',
  borderColor: 'var(--primary-foreground)'
})

export const checkboxBoxCheckedDisabled = style({
  backgroundColor: 'var(--primary-accent-3)',
  borderColor: 'var(--primary-accent-3)'
})

export const checkboxCheckMarker = style({
  stroke: 'var(--primary-background)',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
})

export const checkboxIndeterminateMarker = style({
  stroke: 'var(--primary-accent-5)',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
})
