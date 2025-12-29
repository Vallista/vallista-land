import { style, keyframes } from '@vanilla-extract/css'

const anim = keyframes({
  '0%': {
    opacity: 0
  },
  '100%': {
    opacity: 1
  }
})

export const wrap = style({
  animation: `${anim} 0.2s ease-in-out`
})
