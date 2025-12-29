import { keyframes, style } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

const LoadingDotBlink = keyframes({
  '0%': {
    background: COLOR_TOKENS.PRIMARY.GRAY_100
  },
  '50%': {
    background: COLOR_TOKENS.PRIMARY.GRAY_600
  },
  '100%': {
    background: COLOR_TOKENS.PRIMARY.GRAY_100
  }
})

export const loadingDotsContainer = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: 'auto'
})

export const loadingDotsChildrenContainer = style({
  marginRight: '12px'
})

export const loadingDotsDot = style({
  width: 'var(--loading-dots-size)',
  height: 'var(--loading-dots-size)',
  borderRadius: '50%',
  animation: `${LoadingDotBlink} 1.4s both infinite`,
  background: COLOR_TOKENS.PRIMARY.GRAY_100,
  display: 'inline-block',
  margin: '0 1px',
  selectors: {
    '&:nth-of-type(2)': {
      animationDelay: '0.2s'
    },
    '&:nth-of-type(3)': {
      animationDelay: '0.4s'
    }
  }
})
