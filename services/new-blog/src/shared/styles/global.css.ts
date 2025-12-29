import { globalStyle } from '@vanilla-extract/css'

// Root font-size 설정 (기본 16px)
// 모바일에서 rem 단위를 조정하기 위해 root font-size를 변경
globalStyle('html', {
  fontSize: '16px', // 기본: 16px (1rem = 16px)
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '14px' // 모바일: 14px (1rem = 14px)
    }
  }
})

// body 기본 스타일
globalStyle('body', {
  margin: 0,
  padding: 0,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale'
})
