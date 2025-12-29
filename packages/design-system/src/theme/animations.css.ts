import { globalStyle } from '@vanilla-extract/css'

// Global transitions for smooth theme changes
globalStyle('*', {
  transition:
    'color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease'
})
