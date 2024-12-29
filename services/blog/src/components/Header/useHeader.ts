import { useTheme } from '@vallista/core'
import { useEffect, useState } from 'react'

import { isDarkMode, localStorage, onChangeThemeEvent } from '../../utils'
import { HeaderDialogType, HeaderProps, ReturnUseHeader, HeaderDialogVariableType, ThemeModeType } from './Header.type'

export const useHeader = <T extends HeaderProps>(props: T): ReturnUseHeader & T => {
  const theme = useTheme()
  const [mode, setMode] = useState<ThemeModeType>(() => {
    if (typeof window === 'undefined') return 'LIGHT'
    return isDarkMode() ? 'DARK' : 'LIGHT'
  })
  const [dialog, setDialog] = useState<HeaderDialogType>({
    visible: false,
    type: 'SETTING'
  })
  const [textSize, setTextSize] = useState(() => {
    let localTextSize = localStorage.get('text-size')

    if (!localTextSize) {
      localStorage.set('text-size', '16')
      localTextSize = '16'
    }

    return parseInt(localTextSize, 10) || 16
  })

  useEffect(() => {
    onChangeThemeEvent((_theme) => {
      setMode(_theme)
    })
  }, [])

  useEffect(() => {
    if (!mode) return
    theme.state.changeTheme(mode)
  }, [mode])

  useEffect(() => {
    if (!document?.body?.parentElement) return
    if (textSize === 16) {
      const { fontSize, ...otherProps } = document.body.parentElement.style
      ;(document.body.parentElement as any).style = otherProps
      return
    }

    document.body.parentElement.style.fontSize = `${textSize}px`
  }, [textSize])

  return {
    ...props,
    mode,
    textSize,
    dialog,
    openDialog,
    closeDialog,
    changeTheme,
    changeTextSize
  }

  function openDialog(name: HeaderDialogVariableType): void {
    setDialog({ visible: true, type: name })
  }

  function closeDialog(): void {
    setDialog((before) => ({ ...before, visible: false }))
  }

  function changeTextSize(size: number): void {
    localStorage.set('text-size', size.toString())
    setTextSize(size)
  }

  function changeTheme(_theme: ThemeModeType): void {
    setMode(_theme)
  }
}
