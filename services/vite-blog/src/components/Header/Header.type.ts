export interface HeaderProps {
  fold: boolean
  folding: () => void
}

export interface ReturnUseHeader {
  dialog: HeaderDialogType
  mode: ThemeModeType
  textSize: number
  openDialog: (name: HeaderDialogVariableType) => void
  closeDialog: () => void
  changeTextSize: (size: number) => void
  changeTheme: (theme: ThemeModeType) => void
}

export type HeaderDialogVariableType = 'SETTING'
export interface HeaderDialogType {
  visible: boolean
  type: HeaderDialogVariableType
}

export type ThemeModeType = 'LIGHT' | 'DARK'
