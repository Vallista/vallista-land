import { ReactNode } from 'react'

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  icon: boolean | ReactNode
}

export type NeedSelectProps = Pick<SelectProps, 'disabled' | 'icon'>

export interface ReturningUseSelect {
  uniqueId: string
  isAnotherIcon: boolean
}
