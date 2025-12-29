/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ToastProvider } from '../Toast/ToastProvider'

interface ThemeContextType {
  currentTheme: 'LIGHT' | 'DARK'
  changeTheme: (theme: 'LIGHT' | 'DARK') => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export { useTheme }

interface ThemeProviderProps {
  children: React.ReactNode
  theme?: 'LIGHT' | 'DARK'
  enableSystemTheme?: boolean
}

export const ThemeProvider = ({ children, theme: initialTheme, enableSystemTheme = true }: ThemeProviderProps) => {
  const [themeState, setThemeState] = useState<'LIGHT' | 'DARK'>(() => {
    // 초기 테마 결정 로직
    if (initialTheme) {
      return initialTheme
    }

    // localStorage에서 저장된 테마 확인
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'LIGHT' | 'DARK' | null
      if (savedTheme && (savedTheme === 'LIGHT' || savedTheme === 'DARK')) {
        return savedTheme
      }
    }

    // 시스템 테마 감지
    if (enableSystemTheme && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      return mediaQuery.matches ? 'DARK' : 'LIGHT'
    }

    // 기본값
    return 'LIGHT'
  })

  // iOS 메타 태그 업데이트 함수 (useCallback으로 메모이제이션)
  // changeTheme에서 사용하기 위해 먼저 정의
  const updateIOSMetaTags = useCallback((theme: 'LIGHT' | 'DARK') => {
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
    // 다크모드일 때는 'black' 또는 'black-translucent' 사용
    // 'black-translucent'는 콘텐츠가 상태바 영역까지 확장됨
    statusBarMeta.content = theme === 'DARK' ? 'black-translucent' : 'default'
  }, [])

  // changeTheme 함수를 useCallback으로 메모이제이션하여 Context value 안정성 보장
  // iOS 메타 태그 업데이트는 useThemeSwitch에서만 처리
  const changeTheme = useCallback((theme: 'LIGHT' | 'DARK') => {
    // 상태 업데이트 (함수형 업데이트 사용하여 themeState 의존성 제거)
    setThemeState((prevTheme) => {
      if (prevTheme === theme) {
        return prevTheme
      }
      return theme
    })

    // localStorage에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }
  }, [])

  // useLayoutEffect를 사용하여 브라우저 페인트 전에 동기적으로 실행
  // 이렇게 하면 테마 변경이 즉시 반영되어 nav와 sidebar가 빠르게 업데이트됨
  useLayoutEffect(() => {
    console.log('🎨 useLayoutEffect triggered, themeState:', themeState)

    // CSS 변수 설정
    const root = document.documentElement

    // 테마 변경을 위한 data 속성 추가
    root.setAttribute('data-theme', themeState.toLowerCase())

    // CSS 변수 설정
    if (themeState === 'DARK') {
      // Dark theme CSS variables
      root.style.setProperty('--primary-foreground', '#ffffff')
      root.style.setProperty('--primary-background', '#000000')
      root.style.setProperty('--primary-accent-1', '#111111')
      root.style.setProperty('--primary-accent-2', '#333333')
      root.style.setProperty('--primary-accent-3', '#666666')
      root.style.setProperty('--primary-accent-4', '#888888')
      root.style.setProperty('--primary-accent-5', '#999999')
      root.style.setProperty('--success-default', '#3291ff')
      root.style.setProperty('--error-default', '#ff1a1a')
      root.style.setProperty('--warning-default', '#f7b955')

      console.log('🌙 Dark theme applied:', {
        '--primary-foreground': '#ffffff',
        '--primary-background': '#000000'
      })
    } else {
      // Light theme CSS variables
      root.style.setProperty('--primary-foreground', '#000000')
      root.style.setProperty('--primary-background', '#ffffff')
      root.style.setProperty('--primary-accent-1', '#f5f5f5')
      root.style.setProperty('--primary-accent-2', '#e5e5e5')
      root.style.setProperty('--primary-accent-3', '#d4d4d4')
      root.style.setProperty('--primary-accent-4', '#a3a3a3')
      root.style.setProperty('--primary-accent-5', '#737373')
      root.style.setProperty('--success-default', '#0070f3')
      root.style.setProperty('--error-default', '#e00')
      root.style.setProperty('--warning-default', '#f5a623')

      console.log('☀️ Light theme applied:', {
        '--primary-foreground': '#000000',
        '--primary-background': '#ffffff'
      })
    }

    // body 배경색 설정
    document.body.style.backgroundColor = themeState === 'DARK' ? '#000000' : '#ffffff'
    document.body.style.color = themeState === 'DARK' ? '#ffffff' : '#000000'
  }, [themeState])

  // 시스템 테마 변경 감지 및 React 상태 업데이트
  useEffect(() => {
    if (!enableSystemTheme || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // localStorage에 저장된 테마가 없을 때만 시스템 테마 적용
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'DARK' : 'LIGHT')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enableSystemTheme])

  // 시스템 테마를 지속적으로 추적하여 iOS 메타 태그 업데이트
  // React 상태와 무관하게 시스템 테마 변경을 감지하고 iOS 메타 태그를 업데이트
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    // 현재 적용된 테마 결정 (localStorage 우선, 없으면 시스템 테마)
    const getCurrentTheme = (): 'LIGHT' | 'DARK' => {
      const savedTheme = localStorage.getItem('theme') as 'LIGHT' | 'DARK' | null
      if (savedTheme && (savedTheme === 'LIGHT' || savedTheme === 'DARK')) {
        return savedTheme
      }
      return mediaQuery.matches ? 'DARK' : 'LIGHT'
    }

    // 초기 로드 시 iOS 메타 태그 설정
    updateIOSMetaTags(getCurrentTheme())

    // 시스템 테마 변경 시 iOS 메타 태그 업데이트
    // localStorage에 저장된 테마가 있으면 그것을 사용, 없으면 시스템 테마 사용
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('theme') as 'LIGHT' | 'DARK' | null
      if (savedTheme && (savedTheme === 'LIGHT' || savedTheme === 'DARK')) {
        // localStorage에 저장된 테마가 있으면 그것을 사용
        updateIOSMetaTags(savedTheme)
      } else {
        // localStorage에 저장된 테마가 없으면 시스템 테마 사용
        updateIOSMetaTags(e.matches ? 'DARK' : 'LIGHT')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [updateIOSMetaTags]) // updateIOSMetaTags를 의존성 배열에 포함

  // Context value를 useMemo로 메모이제이션하여 불필요한 리렌더링 방지
  const contextValue = useMemo(
    () => ({
      currentTheme: themeState,
      changeTheme
    }),
    [themeState, changeTheme]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeContext.Provider>
  )
}
