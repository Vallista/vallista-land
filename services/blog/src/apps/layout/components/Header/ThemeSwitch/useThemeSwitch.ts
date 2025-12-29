import { useTheme } from '@vallista/design-system'
import { useEffect, useState } from 'react'
import { ThemeModeType } from '../utils/type'
import { isDarkMode } from '@/utils'

export const useThemeSwitch = () => {
  const themeContext = useTheme()

  const [mode, setMode] = useState<ThemeModeType>(() => {
    if (typeof window === 'undefined') return 'LIGHT'
    return isDarkMode() ? 'DARK' : 'LIGHT'
  })

  const handleThemeSwitch = (state: boolean) => {
    const newTheme = state ? 'DARK' : 'LIGHT'
    setMode(newTheme)
    themeContext.changeTheme(newTheme)
  }

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
