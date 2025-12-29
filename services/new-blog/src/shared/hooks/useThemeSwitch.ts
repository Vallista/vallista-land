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
  if (typeof document === 'undefined') {
    console.warn('⚠️ updateIOSMetaTags: document is undefined')
    return
  }

  console.log('🔧 updateIOSMetaTags executing for theme:', theme)

  // theme-color 메타 태그 업데이트
  let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
  if (!themeColorMeta) {
    console.log('➕ Creating new theme-color meta tag')
    themeColorMeta = document.createElement('meta')
    themeColorMeta.name = 'theme-color'
    document.head.appendChild(themeColorMeta)
  }
  const themeColor = theme === 'DARK' ? '#000000' : '#ffffff'
  themeColorMeta.content = themeColor
  console.log('✅ theme-color updated to:', themeColor)

  // apple-mobile-web-app-status-bar-style 업데이트
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement
  if (!statusBarMeta) {
    console.log('➕ Creating new apple-mobile-web-app-status-bar-style meta tag')
    statusBarMeta = document.createElement('meta')
    statusBarMeta.name = 'apple-mobile-web-app-status-bar-style'
    document.head.appendChild(statusBarMeta)
  }
  // 다크모드일 때는 'black-translucent' 사용 (콘텐츠가 상태바 영역까지 확장)
  const statusBarStyle = theme === 'DARK' ? 'black-translucent' : 'default'
  statusBarMeta.content = statusBarStyle
  console.log('✅ apple-mobile-web-app-status-bar-style updated to:', statusBarStyle)
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
      console.log('🔘 handleThemeSwitch called:', { state, newTheme })
      
      // localStorage에 먼저 저장 (changeTheme보다 먼저)
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
        console.log('💾 localStorage saved:', newTheme)
      }
      
      setMode(newTheme)
      themeContext.changeTheme(newTheme)

      // localStorage 저장 후 다음 틱에서 iOS 메타 태그 업데이트
      // 이렇게 하면 localStorage가 확실히 업데이트된 후에 실행됨
      setTimeout(() => {
        // localStorage에서 다시 읽어서 확인
        const savedTheme = localStorage.getItem('theme') as 'LIGHT' | 'DARK' | null
        const themeToUse = savedTheme && (savedTheme === 'LIGHT' || savedTheme === 'DARK') ? savedTheme : newTheme
        console.log('📱 Calling updateIOSMetaTags with:', themeToUse, '(saved:', savedTheme, 'newTheme:', newTheme, ')')
        updateIOSMetaTags(themeToUse)
        
        // 업데이트 확인
        setTimeout(() => {
          const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
          const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement
          console.log('✅ iOS meta tags after update:', {
            themeColor: themeColorMeta?.content,
            statusBarStyle: statusBarMeta?.content,
            expectedTheme: themeToUse
          })
        }, 50)
      }, 0)
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
