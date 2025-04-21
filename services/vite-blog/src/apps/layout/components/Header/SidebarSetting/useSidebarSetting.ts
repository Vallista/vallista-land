import { useEffect, useState } from 'react'
import { HeaderDialogType, HeaderDialogVariableType } from '../utils/type'
import { localStorage } from '@/utils'

export const useSidebarSetting = () => {
  const [dialog, setDialog] = useState<HeaderDialogType>({
    visible: false,
    type: 'SETTING'
  })

  const [textSize, setTextSize] = useState(() => {
    let localTextSize = localStorage.get('text-size')

    if (!localTextSize) {
      localStorage.set('text-size', '14')
      localTextSize = '14'
    }

    return parseInt(localTextSize, 10) || 16
  })

  useEffect(() => {
    if (!document?.body?.parentElement) return

    // if (textSize === 16) {
    //   const { ...otherProps } = document.body.parentElement.style
    //   Object.assign(document.body.parentElement.style, otherProps)
    //   return
    // }

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

  const changeREM = (size: number) => {
    changeTextSize(size)
  }

  const changeDialogVisible = (type: HeaderDialogVariableType) => {
    if (dialog.visible) closeDialog()
    else openDialog(type)
  }

  return {
    textSize,
    dialog,
    openDialog,
    closeDialog,
    changeREM,
    changeDialogVisible
  }
}
