import { useTheme } from '@vallista/design-system'
import { useCallback, useEffect, useState } from 'react'

type ThemeModeType = 'DARK' | 'LIGHT'

/** dark mode 인지 여부 */
function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// iOS 메타 태그 업데이트 함수
const updateIOSMetaTags = (theme: 'LIGHT' | 'DARK') => {
  if (typeof document === 'undefined') return

  // theme-color 메타 태그 업데이트
  let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta')
    themeColorMeta.name = 'theme-color'
    document.head.appendChild(themeColorMeta)
  }
  themeColorMeta.content = theme === 'DARK' ? '#000000' : '#ffffff'

  // apple-mobile-web-app-status-bar-style 업데이트
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement
  if (!statusBarMeta) {
    statusBarMeta = document.createElement('meta')
    statusBarMeta.name = 'apple-mobile-web-app-status-bar-style'
    document.head.appendChild(statusBarMeta)
  }
  // 다크모드일 때는 'black-translucent' 사용 (콘텐츠가 상태바 영역까지 확장)
  statusBarMeta.content = theme === 'DARK' ? 'black-translucent' : 'default'
}

export const useThemeSwitch = () => {
  const themeContext = useTheme()

  const [mode, setMode] = useState<ThemeModeType>(() => {
    if (typeof window === 'undefined') return 'LIGHT'
    return isDarkMode() ? 'DARK' : 'LIGHT'
  })

  const handleThemeSwitch = useCallback(
    (state: boolean) => {
      const newTheme = state ? 'DARK' : 'LIGHT'
      setMode(newTheme)
      themeContext.changeTheme(newTheme)

      // 테마 스위치 버튼 클릭 시 즉시 iOS 메타 태그 업데이트
      updateIOSMetaTags(newTheme)
    },
    [themeContext]
  )

  // Sync with theme provider
  useEffect(() => {
    if (themeContext.currentTheme && themeContext.currentTheme !== mode) {
      setMode(themeContext.currentTheme)
    }
  }, [themeContext.currentTheme, mode])

  return {
    mode,
    handleThemeSwitch
  }
}
