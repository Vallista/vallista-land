import { ChangeEvent, CSSProperties, ReactNode, RefObject } from 'react'

export interface CheckboxProps {
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  fullWidth: boolean
  label: string
  children: ReactNode
  style: CSSProperties
  onChange(event: React.ChangeEvent<HTMLInputElement>): void
}

export type CheckboxMarkerType = 'none' | 'checked' | 'indeterminate'
export type ReturningUseCheckbox<T extends Partial<CheckboxProps> = Partial<CheckboxProps>> = T & {
  marker: CheckboxMarkerType
  isFocus: boolean
  isHover: boolean
  onInputChange(event: ChangeEvent<HTMLInputElement>): void
  onCheckboxClick(inputRef: RefObject<HTMLInputElement>): void
  onFocus(): void
  onBlur(): void
  onMouseEnter(): void
  onMouseLeave(): void
}
