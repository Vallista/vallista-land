import { style } from '@vanilla-extract/css'

export const search = style({
  display: 'flex',
  alignItems: 'center',
  height: '38px',
  padding: '0 24px',
  maxWidth: '100%',

  selectors: {
    '& > div': {
      width: '100%'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      padding: '0 16px'
    }
  }
})
