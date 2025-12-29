import { style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '@vallista/design-system'

export const wrapper = style({
  maxWidth: '900px',
  width: '100%',
  margin: '4rem auto',
  boxSizing: 'border-box',
  padding: '2rem 2rem',
  borderTop: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
  selectors: {
    '& > p': {
      marginBottom: '1.5rem',
      fontSize: '1.8rem',
      color: COLOR_TOKENS.PRIMARY.BLACK
    },
    '& > a': {
      border: 'none !important',
      outline: 'none !important',
      transition: 'none !important',
      background: 'none !important'
    },
    '& > a:hover': {
      background: 'none !important',
      borderColor: 'none !important'
    }
  }
})
