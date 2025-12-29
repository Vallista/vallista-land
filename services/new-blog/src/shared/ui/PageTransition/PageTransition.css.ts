import { style } from '@vanilla-extract/css'

export const container = style({
  opacity: 1,
  transform: 'translateY(0)',
  transition: 'opacity 0.3s ease, transform 0.3s ease'
})

export const transitioning = style({
  opacity: 0,
  transform: 'translateY(20px)'
})
