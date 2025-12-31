import { useTheme } from '@vallista/design-system'
import { useCallback, useEffect, useState } from 'react'

type ThemeModeType = 'DARK' | 'LIGHT'

/** dark mode 인지 여부 */
function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// iOS 메타 태그 업데이트 함수
// Stack Overflow 참고: https://stackoverflow.com/questions/74197660/how-to-dynamically-change-background-color-of-ios-statusbar-within-webapp
// theme-color는 iOS 15+에서 동적 업데이트가 가능하므로 setAttribute로 변경 시도
// 만약 작동하지 않으면 메타 태그를 제거하고 재생성
const updateIOSMetaTags = (theme: 'LIGHT' | 'DARK') => {
  if (typeof document === 'undefined') {
    console.warn('⚠️ updateIOSMetaTags: document is undefined')
    return
  }

  console.log('🔧 updateIOSMetaTags executing for theme:', theme)

  const themeColor = theme === 'DARK' ? '#000000' : '#ffffff'
  const statusBarStyle = theme === 'DARK' ? 'black-translucent' : 'default'

  // 방법 1: theme-color 메타 태그 업데이트 (iOS 15+ 동적 업데이트 지원)
  // Stack Overflow 답변에 따르면 setAttribute만으로도 작동할 수 있음
  let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
  if (themeColorMeta) {
    // 기존 메타 태그가 있으면 content만 변경 시도
    themeColorMeta.setAttribute('content', themeColor)
    console.log('✅ theme-color updated via setAttribute to:', themeColor)
  } else {
    // 메타 태그가 없으면 새로 생성
    themeColorMeta = document.createElement('meta')
    themeColorMeta.name = 'theme-color'
    themeColorMeta.content = themeColor
    document.head.appendChild(themeColorMeta)
    console.log('✅ theme-color created and added:', themeColor)
  }

  // 방법 2: apple-mobile-web-app-status-bar-style 업데이트
  // 이 메타 태그는 동적 업데이트를 지원하지 않으므로 제거 후 재생성
  const existingStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (existingStatusBarMeta) {
    existingStatusBarMeta.remove()
  }
  const statusBarMeta = document.createElement('meta')
  statusBarMeta.name = 'apple-mobile-web-app-status-bar-style'
  statusBarMeta.content = statusBarStyle
  document.head.appendChild(statusBarMeta)
  console.log('✅ apple-mobile-web-app-status-bar-style updated to:', statusBarStyle)

  // 방법 3: Stack Overflow 답변에서 제시한 트릭
  // html 요소를 숨겼다가 다시 보여서 강제 리플로우 발생
  const html = document.documentElement
  const originalDisplay = html.style.display

  // 숨기기
  html.style.display = 'none'

  // 다음 프레임에서 다시 보이기 (강제 리플로우)
  requestAnimationFrame(() => {
    html.style.display = originalDisplay || ''

    // 추가로 한 번 더 시도 (Safari가 변경을 감지하도록)
    requestAnimationFrame(() => {
      // theme-color를 다시 한 번 업데이트 (확실하게 하기 위해)
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', themeColor)
      }
    })
  })
}

export const useThemeSwitch = () => {
  const themeContext = useTheme()

  const [mode, setMode] = useState<ThemeModeType>(() => {
    if (typeof window === 'undefined') return 'LIGHT'

    // localStorage에서 저장된 테마 확인
    const savedTheme = localStorage.getItem('theme') as ThemeModeType | null
    if (savedTheme && (savedTheme === 'LIGHT' || savedTheme === 'DARK')) {
      return savedTheme
    }

    // 시스템 테마 감지
    return isDarkMode() ? 'DARK' : 'LIGHT'
  })

  const handleThemeSwitch = useCallback(
    (state: boolean) => {
      const newTheme = state ? 'DARK' : 'LIGHT'
      console.log('🔘 handleThemeSwitch called:', { state, newTheme })

      // localStorage에 먼저 저장 (changeTheme보다 먼저)
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
        console.log('💾 localStorage saved:', newTheme)
      }

      setMode(newTheme)
      themeContext.changeTheme(newTheme)

      // iOS 메타 태그를 즉시 업데이트 (Safari가 변경을 감지하도록)
      // requestAnimationFrame을 사용하여 브라우저 렌더링 사이클에 맞춤
      requestAnimationFrame(() => {
        updateIOSMetaTags(newTheme)
      })
    },
    [themeContext]
  )

  // Sync with theme provider
  useEffect(() => {
    if (themeContext.currentTheme && themeContext.currentTheme !== mode) {
      setMode(themeContext.currentTheme)
    }
  }, [themeContext.currentTheme, mode])

  // 초기 로드 시 및 테마 변경 시 iOS 메타 태그 업데이트
  useEffect(() => {
    // 초기 테마에 맞춰 메타 태그 설정
    const currentTheme = mode || (themeContext.currentTheme as 'LIGHT' | 'DARK' | undefined)
    if (currentTheme) {
      updateIOSMetaTags(currentTheme)
    }
  }, [mode, themeContext.currentTheme])

  return {
    mode,
    handleThemeSwitch
  }
}
