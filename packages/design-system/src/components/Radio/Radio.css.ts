import { style } from '@vanilla-extract/css'

export const radioLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '0.875rem',
  color: 'var(--primary-foreground)',
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

export const radioLabelDisabled = style({
  color: 'var(--primary-accent-3)',
  cursor: 'not-allowed'
})

export const radioInput = style({
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

export const radioCircle = style({
  width: '18px',
  height: '18px',
  border: '2px solid var(--primary-accent-3)',
  borderRadius: '50%',
  transition: 'all 0.15s ease',
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
})

export const radioCircleDisabled = style({
  borderColor: 'var(--primary-accent-3)',
  cursor: 'not-allowed'
})

export const radioCircleChecked = style({
  borderColor: 'var(--primary-foreground)',
  selectors: {
    '&::after': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: 'var(--primary-foreground)',
      transition: 'all 0.15s ease'
    }
  }
})

export const radioCircleHover = style({
  borderColor: 'var(--primary-foreground)'
})

export const radioText = style({
  marginLeft: '8px',
  color: 'var(--primary-foreground)',
  lineHeight: '1.4'
})
