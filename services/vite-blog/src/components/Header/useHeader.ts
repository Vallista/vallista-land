import { useTheme } from '@vallista/design-system'
import { useEffect, useState } from 'react'

import { isDarkMode, localStorage, onChangeThemeEvent } from '../../utils'
import { HeaderDialogType, HeaderDialogVariableType, ThemeModeType } from './Header.type'
import { useGlobalProvider } from '@/context/useProvider'

export const useHeader = () => {
  const theme = useTheme()
  const { state, dispatch } = useGlobalProvider()
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
  }, [mode, theme.state])

  useEffect(() => {
    if (!document?.body?.parentElement) return
    if (textSize === 16) {
      const { ...otherProps } = document.body.parentElement.style
      Object.assign(document.body.parentElement.style, otherProps)
      return
    }

    document.body.parentElement.style.fontSize = `${textSize}px`
  }, [textSize])

  const openDialog = (name: HeaderDialogVariableType) => {
    setDialog({ visible: true, type: name })
  }

  const closeDialog = () => {
    setDialog((before) => ({ ...before, visible: false }))
  }

  const changeTextSize = (size: number) => {
    localStorage.set('text-size', size.toString())
    setTextSize(size)
  }

  const changeTheme = (_theme: ThemeModeType) => {
    setMode(_theme)
  }

  return {
    fold: state.fold,
    changeFold: () => dispatch({ type: 'changeFold', fold: !state.fold }),
    mode,
    textSize,
    dialog,
    openDialog,
    closeDialog,
    changeTheme,
    changeTextSize
  }
}
