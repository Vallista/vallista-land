import { createGlobalTheme, globalStyle } from '@vanilla-extract/css'
import { COLOR_TOKENS } from '../../theme/colorTokens'

// 전역 테마 생성
export const globalTheme = createGlobalTheme(':root', {
  // Primary colors
  '--primary-black': COLOR_TOKENS.PRIMARY.BLACK,
  '--primary-white': COLOR_TOKENS.PRIMARY.WHITE,
  '--primary-gray-50': COLOR_TOKENS.PRIMARY.GRAY_50,
  '--primary-gray-100': COLOR_TOKENS.PRIMARY.GRAY_100,
  '--primary-gray-300': COLOR_TOKENS.PRIMARY.GRAY_300,
  '--primary-gray-400': COLOR_TOKENS.PRIMARY.GRAY_400,
  '--primary-gray-500': COLOR_TOKENS.PRIMARY.GRAY_500,
  '--primary-gray-600': COLOR_TOKENS.PRIMARY.GRAY_600,
  '--primary-gray-700': COLOR_TOKENS.PRIMARY.GRAY_700,
  '--primary-gray-800': COLOR_TOKENS.PRIMARY.GRAY_800,

  // Success colors
  '--success-default': COLOR_TOKENS.SUCCESS.DEFAULT,
  '--success-light': COLOR_TOKENS.SUCCESS.LIGHT,
  '--success-dark': COLOR_TOKENS.SUCCESS.DARK,

  // Error colors
  '--error-default': COLOR_TOKENS.ERROR.DEFAULT,
  '--error-light': COLOR_TOKENS.ERROR.LIGHT,
  '--error-dark': COLOR_TOKENS.ERROR.DARK,

  // Warning colors
  '--warning-default': COLOR_TOKENS.WARNING.DEFAULT,
  '--warning-light': COLOR_TOKENS.WARNING.LIGHT,
  '--warning-dark': COLOR_TOKENS.WARNING.DARK,

  // Shadow
  '--shadow': COLOR_TOKENS.SHADOW
})

// 전역 스타일 설정
globalStyle('*', {
  boxSizing: 'border-box'
})

globalStyle('html, body', {
  margin: 0,
  padding: 0,
  fontFamily:
    'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  fontSize: '16px',
  lineHeight: 1.5,
  color: 'var(--primary-foreground)',
  backgroundColor: 'var(--primary-background)'
})

// 모든 클릭 가능한 요소에서 아웃라인 제거
globalStyle('button, input, select, textarea, a, [role="button"], [tabindex]', {
  outline: 'none'
})

// 라벨과 클릭 가능한 요소들에서 아웃라인 제거
globalStyle('label, input, button, a', {
  WebkitTapHighlightColor: 'transparent'
})

// 모든 div와 span에서 아웃라인 제거
globalStyle('div, span', {
  outline: 'none'
})

// 링크 스타일 초기화
globalStyle('a', {
  textDecoration: 'none',
  color: 'inherit'
})

// 리스트 스타일 초기화
globalStyle('ul, ol', {
  listStyle: 'none',
  margin: 0,
  padding: 0
})

// 이미지 최대 너비 설정
globalStyle('img', {
  maxWidth: '100%',
  height: 'auto'
})

// 테이블 스타일 초기화
globalStyle('table', {
  borderCollapse: 'collapse',
  borderSpacing: 0
})

// 폼 요소 스타일 초기화
globalStyle('input, textarea, select', {
  fontFamily: 'inherit',
  fontSize: 'inherit'
})

// 스크롤바 스타일링
globalStyle('::-webkit-scrollbar', {
  width: '8px',
  height: '8px'
})

globalStyle('::-webkit-scrollbar-track', {
  background: 'var(--primary-accent-1)',
  borderRadius: '4px'
})

globalStyle('::-webkit-scrollbar-thumb', {
  background: 'var(--primary-accent-5)',
  borderRadius: '4px'
})

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: 'var(--primary-accent-3)'
})
