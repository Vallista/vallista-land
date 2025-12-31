/**
 * iOS 메타 태그 업데이트 유틸리티
 * 
 * Stack Overflow 참고: https://stackoverflow.com/questions/74197660/how-to-dynamically-change-background-color-of-ios-statusbar-within-webapp
 * 
 * theme-color는 iOS 15+에서 동적 업데이트가 가능하므로 setAttribute로 변경 시도
 * 만약 작동하지 않으면 메타 태그를 제거하고 재생성
 */

import { THEME_COLORS } from '@shared/constants/theme'

import { logger } from './logger'

/**
 * theme-color 메타 태그 업데이트
 */
function updateThemeColorMeta(theme: 'LIGHT' | 'DARK'): void {
  const themeColor = theme === 'DARK' ? THEME_COLORS.DARK_BACKGROUND : THEME_COLORS.LIGHT_BACKGROUND

  let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
  if (themeColorMeta) {
    // 기존 메타 태그가 있으면 content만 변경 시도
    themeColorMeta.setAttribute('content', themeColor)
    logger.debug('✅ theme-color updated via setAttribute to:', themeColor)
  } else {
    // 메타 태그가 없으면 새로 생성
    themeColorMeta = document.createElement('meta')
    themeColorMeta.name = 'theme-color'
    themeColorMeta.content = themeColor
    document.head.appendChild(themeColorMeta)
    logger.debug('✅ theme-color created and added:', themeColor)
  }
}

/**
 * apple-mobile-web-app-status-bar-style 메타 태그 업데이트
 * 이 메타 태그는 동적 업데이트를 지원하지 않으므로 제거 후 재생성
 */
function updateStatusBarMeta(theme: 'LIGHT' | 'DARK'): void {
  const statusBarStyle = theme === 'DARK' ? THEME_COLORS.DARK_STATUS_BAR : THEME_COLORS.LIGHT_STATUS_BAR

  // 기존 메타 태그 제거
  const existingStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (existingStatusBarMeta) {
    existingStatusBarMeta.remove()
  }

  // 새 메타 태그 생성
  const statusBarMeta = document.createElement('meta')
  statusBarMeta.name = 'apple-mobile-web-app-status-bar-style'
  statusBarMeta.content = statusBarStyle
  document.head.appendChild(statusBarMeta)
  logger.debug('✅ apple-mobile-web-app-status-bar-style updated to:', statusBarStyle)
}

/**
 * 강제 리플로우 발생 (화면이 사라지지 않도록 안전한 방법)
 */
function triggerReflow(): void {
  // 간단한 리플로우만 트리거 (body 스타일 변경 제거)
  if (typeof document !== 'undefined' && document.body) {
    void document.body.offsetHeight
  }
}

/**
 * iOS 메타 태그 업데이트 (통합 함수)
 * theme-color와 status-bar-style을 모두 업데이트합니다.
 */
export function updateIOSMetaTags(theme: 'LIGHT' | 'DARK'): void {
  if (typeof document === 'undefined') {
    logger.warn('⚠️ updateIOSMetaTags: document is undefined')
    return
  }

  logger.debug('🔧 updateIOSMetaTags executing for theme:', theme)

  // 메타 태그 업데이트
  updateThemeColorMeta(theme)
  updateStatusBarMeta(theme)

  // 강제 리플로우 발생
  triggerReflow()
}

