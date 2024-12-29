export interface SelectProps {
  children: React.ReactNode
  value: string
  onChange: (value: string) => void
  disabled: boolean
  icon: boolean | React.ReactNode
}

export type NeedSelectProps = Pick<SelectProps, 'disabled' | 'icon'>

export interface ReturningUseSelect {
  uniqueId: string
  isAnotherIcon: boolean
}
