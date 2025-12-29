import { style, keyframes } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

const spinnerStickAnimation = keyframes({
  from: {
    opacity: 1
  },
  to: {
    opacity: 0.15
  }
})

export const spinnerWrapper = style({
  position: 'relative',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center'
})

export const spinnerContainer = style({
  position: 'relative',
  width: '100%',
  height: '100%'
})

export const spinnerStick = style({
  animation: `${spinnerStickAnimation} 1.2s linear infinite`,
  position: 'absolute',
  width: '24%',
  height: '8%',
  borderRadius: '5px',
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_700,
  top: '50%',
  left: '50%',
  transformOrigin: '0 0'
})

// Generate 12 spinner sticks with different delays and rotations
export const spinnerSticks = Array.from({ length: 12 }, (_, index) => ({
  className: spinnerStick,
  style: {
    animationDelay: `${-1.2 + index * 0.1}s`,
    transform: `rotate(${30 * index}deg) translate(146%)`
  }
}))
