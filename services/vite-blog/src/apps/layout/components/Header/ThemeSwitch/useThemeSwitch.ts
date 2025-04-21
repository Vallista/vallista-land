import { useTheme } from '@vallista/design-system'
import { useEffect, useState } from 'react'
import { ThemeModeType } from '../utils/type'
import { isDarkMode, onChangeThemeEvent } from '@/utils'

export const useThemeSwitch = () => {
  const theme = useTheme()

  const [mode, setMode] = useState<ThemeModeType>(() => {
    if (typeof window === 'undefined') return 'LIGHT'
    return isDarkMode() ? 'DARK' : 'LIGHT'
  })

  const handleThemeSwitch = (state: boolean) => {
    if (state) {
      changeTheme('DARK')
    } else {
      changeTheme('LIGHT')
    }
  }

  const changeTheme = (_theme: ThemeModeType) => {
    setMode(_theme)
  }

  useEffect(() => {
    onChangeThemeEvent((_theme) => {
      setMode(_theme)
    })
  }, [])

  useEffect(() => {
    if (!mode) return
    theme.state.changeTheme(mode)
  }, [mode, theme.state])

  return {
    mode,
    handleThemeSwitch
  }
}
