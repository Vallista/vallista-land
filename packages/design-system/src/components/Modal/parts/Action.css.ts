import { style } from '@vanilla-extract/css'
import {
  primaryBackground,
  primaryForeground,
  primaryAccent1,
  primaryAccent2,
  primaryAccent4,
  primaryAccent5
} from '../../../theme/colors.css'

export const modalActionButton = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '1 1 100%',
  padding: '1rem 0',
  border: 'none',
  outline: 'none',
  margin: 0,
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  textDecoration: 'none',
  background: primaryBackground,
  color: primaryAccent5,
  borderRight: `1px solid ${primaryAccent2}`,
  selectors: {
    '&:hover': {
      color: primaryForeground
    },
    '&:disabled': {
      color: primaryAccent4,
      background: primaryAccent1,
      cursor: 'not-allowed'
    },
    '&:last-child': {
      borderRight: 'none'
    }
  }
})
