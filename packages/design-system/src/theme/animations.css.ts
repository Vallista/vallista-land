import { globalStyle } from '@vanilla-extract/css'

// Global transitions for smooth theme changes
// 테마 전환 속도를 빠르게 하기 위해 0.15s로 설정
globalStyle('*', {
  transition:
    'color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.15s ease'
})
