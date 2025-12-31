import { useTheme } from '@vallista/design-system'
import { useCallback, useEffect, useState } from 'react'

import { updateIOSMetaTags } from '@shared/lib/iosMetaTags'
import { logger } from '@shared/lib/logger'

type ThemeModeType = 'DARK' | 'LIGHT'

/** dark mode 인지 여부 */
function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
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
      logger.debug('🔘 handleThemeSwitch called:', { state, newTheme })

      // localStorage에 먼저 저장 (changeTheme보다 먼저)
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
        logger.debug('💾 localStorage saved:', newTheme)
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
