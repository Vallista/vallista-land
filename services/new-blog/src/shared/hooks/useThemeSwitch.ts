import { useTheme } from '@vallista/design-system'
import { useCallback, useEffect, useState } from 'react'

type ThemeModeType = 'DARK' | 'LIGHT'

/** dark mode 인지 여부 */
function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// iOS 메타 태그 업데이트 함수
// Safari는 메타 태그의 content 속성만 변경하는 것으로는 status bar를 업데이트하지 않으므로
// 메타 태그를 완전히 제거하고 다시 추가하는 방식으로 변경
// 또한 Safari가 변경을 감지하도록 강제로 이벤트를 트리거
const updateIOSMetaTags = (theme: 'LIGHT' | 'DARK') => {
  if (typeof document === 'undefined') {
    console.warn('⚠️ updateIOSMetaTags: document is undefined')
    return
  }

  console.log('🔧 updateIOSMetaTags executing for theme:', theme)

  const themeColor = theme === 'DARK' ? '#000000' : '#ffffff'
  const statusBarStyle = theme === 'DARK' ? 'black-translucent' : 'default'

  // theme-color 메타 태그: 기존 태그 제거 후 새로 생성
  const existingThemeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (existingThemeColorMeta) {
    existingThemeColorMeta.remove()
  }
  const themeColorMeta = document.createElement('meta')
  themeColorMeta.name = 'theme-color'
  themeColorMeta.content = themeColor
  document.head.appendChild(themeColorMeta)
  console.log('✅ theme-color updated to:', themeColor)

  // apple-mobile-web-app-status-bar-style: 기존 태그 제거 후 새로 생성
  const existingStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (existingStatusBarMeta) {
    existingStatusBarMeta.remove()
  }
  const statusBarMeta = document.createElement('meta')
  statusBarMeta.name = 'apple-mobile-web-app-status-bar-style'
  statusBarMeta.content = statusBarStyle
  document.head.appendChild(statusBarMeta)
  console.log('✅ apple-mobile-web-app-status-bar-style updated to:', statusBarStyle)

  // Safari가 메타 태그 변경을 감지하도록 강제로 이벤트 트리거
  // 여러 강력한 방법을 조합하여 Safari가 변경을 감지하도록 함
  const triggerSafariUpdate = () => {
    const body = document.body
    const html = document.documentElement
    const head = document.head

    // 방법 1: viewport 메타 태그를 임시로 조작 (가장 강력한 방법)
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    if (viewportMeta) {
      const originalContent = viewportMeta.content
      // viewport를 임시로 변경하여 강제 리플로우
      viewportMeta.content = originalContent + ', maximum-scale=1.01'
      requestAnimationFrame(() => {
        viewportMeta.content = originalContent
      })
    }

    // 방법 2: body와 html에 강력한 리플로우 트리거
    if (body && html) {
      // 여러 스타일을 동시에 변경하여 강제 리플로우
      const originalBodyDisplay = body.style.display
      const originalHtmlTransform = html.style.transform

      body.style.display = 'none'
      html.style.transform = 'translateZ(0)'

      requestAnimationFrame(() => {
        body.style.display = originalBodyDisplay
        html.style.transform = originalHtmlTransform
      })
    }

    // 방법 3: head 요소 자체를 조작 (메타 태그가 head에 있으므로)
    if (head) {
      const originalHeadTransform = head.style.transform
      head.style.transform = 'translateZ(0)'
      requestAnimationFrame(() => {
        head.style.transform = originalHeadTransform
      })
    }

    // 방법 4: 여러 이벤트를 동시에 트리거
    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('orientationchange'))
      // visibilitychange도 시뮬레이션
      document.dispatchEvent(new Event('visibilitychange'))
    }

    // 방법 5: 스크롤 조작 (여러 프레임에 걸쳐)
    const currentScrollY = window.scrollY
    if (currentScrollY === 0) {
      // 더 큰 스크롤 거리로 시도
      window.scrollTo({ top: 1, behavior: 'auto' })
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'auto' })
        // 한 번 더 시도
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0.5, behavior: 'auto' })
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'auto' })
          })
        })
      })
    }
  }

  // 메타 태그 변경 후 여러 프레임에 걸쳐 시도
  // Safari가 변경을 감지할 때까지 여러 번 시도
  requestAnimationFrame(() => {
    triggerSafariUpdate()
    // 추가 시도 (지연 후)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        triggerSafariUpdate()
      })
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
