import { globalStyle } from '@vanilla-extract/css'

// Root font-size 설정 (기본 16px)
// 모바일에서 rem 단위를 조정하기 위해 root font-size를 변경
// iOS Safari에서 fixed 요소가 제대로 작동하도록 스타일 추가
globalStyle('html', {
  fontSize: '16px', // 기본: 16px (1rem = 16px)
  position: 'relative',
  overflowX: 'hidden',
  '@media': {
    'screen and (max-width: 1024px)': {
      fontSize: '14px', // 모바일: 14px (1rem = 14px)
      // iOS Safari에서 주소창 때문에 viewport 높이 문제 해결
      height: '-webkit-fill-available'
    }
  }
})

// body 기본 스타일
// iOS Safari에서 스크롤 시 fixed 요소가 함께 움직이는 문제 방지
globalStyle('body', {
  margin: 0,
  padding: 0,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  position: 'relative',
  overflowX: 'hidden'
})
