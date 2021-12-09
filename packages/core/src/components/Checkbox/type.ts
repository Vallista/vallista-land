import { CSSProperties, ReactNode } from 'react'

export interface CheckboxProps {
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  fullWidth: boolean
  label: string
  children: ReactNode
  style: CSSProperties
  onChange: () => void
}

export type CheckboxMarkerType = 'none' | 'checked' | 'indeterminate'
export type ReturningUseCheckbox<T extends Partial<CheckboxProps> = Partial<CheckboxProps>> = T & {
  marker: CheckboxMarkerType
}
