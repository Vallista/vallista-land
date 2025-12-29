/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
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

  const changeTheme = (theme: 'LIGHT' | 'DARK') => {
    setThemeState(theme)

    // localStorage에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }
  }

  useEffect(() => {
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

    // iOS 노치 영역 색상 업데이트
    if (typeof document !== 'undefined') {
      // theme-color 메타 태그 업데이트
      let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta')
        themeColorMeta.name = 'theme-color'
        document.head.appendChild(themeColorMeta)
      }
      themeColorMeta.content = themeState === 'DARK' ? '#000000' : '#ffffff'

      // apple-mobile-web-app-status-bar-style 업데이트
      let statusBarMeta = document.querySelector(
        'meta[name="apple-mobile-web-app-status-bar-style"]'
      ) as HTMLMetaElement
      if (!statusBarMeta) {
        statusBarMeta = document.createElement('meta')
        statusBarMeta.name = 'apple-mobile-web-app-status-bar-style'
        document.head.appendChild(statusBarMeta)
      }
      // 다크모드일 때는 'black-translucent' 사용 (콘텐츠가 상태바 영역까지 확장)
      // 라이트모드일 때는 'default' 사용 (흰색 배경)
      statusBarMeta.content = themeState === 'DARK' ? 'black-translucent' : 'default'
    }
  }, [themeState])

  // 시스템 테마 변경 감지
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

  return (
    <ThemeContext.Provider value={{ currentTheme: themeState, changeTheme }}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeContext.Provider>
  )
}
